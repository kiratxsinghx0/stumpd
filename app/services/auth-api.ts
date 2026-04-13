const LS_TOKEN_KEY = "stumpd_auth_token";
const LS_USER_KEY = "stumpd_auth_user";

export type AuthUser = { id: number; email: string };

export type GameResultPayload = {
  puzzle_day: number;
  won: boolean;
  num_guesses: number;
  time_seconds?: number;
  hints_used?: number;
  hard_mode?: boolean;
};

export type UserStats = {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
  todayRank?: number;
};

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getStoredToken();
}

function storeAuth(token: string, user: AuthUser) {
  try {
    localStorage.setItem(LS_TOKEN_KEY, token);
    localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
  } catch { /* quota / private mode */ }
}

export function clearAuth() {
  try {
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem(LS_USER_KEY);
  } catch { /* private mode / quota */ }
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type BaselineStats = {
  gamesPlayed?: number; gamesWon?: number; currentStreak?: number; maxStreak?: number;
  gamesPlayedNormal?: number; gamesWonNormal?: number;
  gamesPlayedHard?: number; gamesWonHard?: number;
};

export async function register(
  email: string,
  password: string,
  gameResult?: GameResultPayload,
  baselineStats?: BaselineStats,
): Promise<{ user: AuthUser; token: string }> {
  let res: Response;
  try {
    res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, gameResult, baselineStats }),
    });
  } catch {
    throw new Error("Network error — please check your connection");
  }
  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    throw new Error("Server returned an unexpected response");
  }
  if (!res.ok || !json.success) throw new Error((json.message as string) || "Registration failed");
  const data = json.data as { token: string; user: AuthUser; godmode_activated_at?: number | null; hard_mode_pref?: boolean };
  storeAuth(data.token, data.user);
  applyServerPrefs(data);
  await syncGameHistory();
  return data;
}

export async function login(
  email: string,
  password: string,
  baselineStats?: BaselineStats,
  gameResult?: GameResultPayload,
): Promise<{ user: AuthUser; token: string }> {
  let res: Response;
  try {
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, baselineStats, gameResult }),
    });
  } catch {
    throw new Error("Network error — please check your connection");
  }
  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    throw new Error("Server returned an unexpected response");
  }
  if (!res.ok || !json.success) throw new Error((json.message as string) || "Login failed");
  const data = json.data as { token: string; user: AuthUser; godmode_activated_at?: number | null; hard_mode_pref?: boolean };
  storeAuth(data.token, data.user);
  applyServerPrefs(data);
  await syncGameHistory();
  return data;
}

/** Bulk-sync all localStorage game results to the backend. */
export async function syncGameHistory(): Promise<void> {
  const token = getStoredToken();
  if (!token) return;
  try {
    const { readGameHistory } = await import("../stumpd/stats-storage");
    const results = readGameHistory();
    if (results.length === 0) return;
    const normalResults = results.filter((r) => !r.hard_mode);
    const hardResults = results.filter((r) => r.hard_mode);
    const headers = { "Content-Type": "application/json", ...authHeaders() };
    const promises: Promise<Response>[] = [];
    if (normalResults.length > 0) {
      promises.push(fetch("/api/user/sync-results", { method: "POST", headers, body: JSON.stringify({ results: normalResults }) }));
    }
    if (hardResults.length > 0) {
      promises.push(fetch("/api/user/hard-mode/sync-results", { method: "POST", headers, body: JSON.stringify({ results: hardResults }) }));
    }
    await Promise.all(promises);
  } catch {
    /* non-critical */
  }
}

/**
 * Post all pending game results from localStorage history for both modes.
 * Unlike syncGameHistory (which bulk-syncs), this explicitly posts each
 * mode's latest result so leaderboard caches are updated.
 */
export async function postAllPendingResults(): Promise<void> {
  const token = getStoredToken();
  if (!token) return;
  try {
    const { readGameHistory } = await import("../stumpd/stats-storage");
    const results = readGameHistory();
    if (results.length === 0) return;

    const latestNormal = [...results].filter((r) => !r.hard_mode).pop();
    const latestHard = [...results].filter((r) => r.hard_mode).pop();

    const promises: Promise<unknown>[] = [];
    if (latestNormal) promises.push(postGameResult(latestNormal));
    if (latestHard) promises.push(postHardModeResult(latestHard));
    await Promise.all(promises);
  } catch {
    /* non-critical */
  }
}

export async function postGameResult(payload: GameResultPayload): Promise<UserStats | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch("/api/user/result", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) {
      clearAuth();
      return null;
    }
    if (!json.success) return null;
    return json.data as UserStats;
  } catch {
    return null;
  }
}

export async function fetchMyStats(): Promise<UserStats | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch("/api/user/stats", {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (res.status === 401) {
      clearAuth();
      return null;
    }
    if (!json.success) return null;
    return json.data as UserStats;
  } catch {
    return null;
  }
}

export type GameProgressPayload = {
  puzzle_day: number;
  hard_mode: boolean;
  guesses_json: string;
  elapsed_seconds: number;
  hints_used?: number;
  used_trivia_json?: string | null;
  completed?: boolean;
};

export type GameProgressData = {
  found: boolean;
  completed?: boolean;
  guesses_json?: string;
  elapsed_seconds?: number;
  hints_used?: number;
  used_trivia_json?: string | null;
};

export async function saveGameProgress(payload: GameProgressPayload): Promise<void> {
  const token = getStoredToken();
  if (!token) return;
  try {
    await fetch("/api/user/save-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
  } catch {
    /* non-critical */
  }
}

export async function fetchGameProgress(puzzleDay: number, hardMode: boolean): Promise<GameProgressData> {
  const token = getStoredToken();
  if (!token) return { found: false };
  try {
    const res = await fetch(
      `/api/user/game-progress?puzzle_day=${puzzleDay}&hard_mode=${hardMode ? "1" : "0"}`,
      { headers: authHeaders() },
    );
    if (res.status === 401) {
      clearAuth();
      return { found: false };
    }
    const json = await res.json();
    if (!json.success) return { found: false };
    return json.data as GameProgressData;
  } catch {
    return { found: false };
  }
}

export async function postHardModeResult(payload: GameResultPayload): Promise<void> {
  const token = getStoredToken();
  if (!token) return;
  try {
    const res = await fetch("/api/user/hard-mode/result", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      clearAuth();
    }
  } catch {
    /* non-critical */
  }
}

/* ── Godmode & Preferences ── */

const LS_GODMODE_TS = "stumpdpuzzle_hmChampionTs";
const LS_HARD_MODE_PREF = "stumpdpuzzle_hardMode";

function applyServerPrefs(data: { godmode_activated_at?: number | null; hard_mode_pref?: boolean }) {
  if (typeof window === "undefined") return;
  try {
    if (data.godmode_activated_at != null) {
      localStorage.setItem(LS_GODMODE_TS, String(data.godmode_activated_at));
    }
    if (data.hard_mode_pref != null) {
      localStorage.setItem(LS_HARD_MODE_PREF, data.hard_mode_pref ? "1" : "0");
    }
  } catch { /* quota / private mode */ }
}

export async function postGodmodeActivation(): Promise<{ success: boolean; godmode_activated_at?: number }> {
  const token = getStoredToken();
  if (!token) return { success: false };
  try {
    const res = await fetch("/api/user/godmode", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });
    if (res.status === 401) { clearAuth(); return { success: false }; }
    const json = await res.json();
    if (!res.ok || !json.success) return { success: false };
    const ts = json.data?.godmode_activated_at as number | undefined;
    if (ts != null) {
      try { localStorage.setItem(LS_GODMODE_TS, String(ts)); } catch {}
    }
    return { success: true, godmode_activated_at: ts };
  } catch {
    return { success: false };
  }
}

export async function fetchGodmodeStatus(): Promise<{ active: boolean; activated_at: number | null; hours_remaining: number }> {
  const GODMODE_DURATION_MS = 24 * 60 * 60 * 1000;
  const prefs = await fetchPreferences();
  if (!prefs || !prefs.godmode_activated_at) {
    try { localStorage.removeItem(LS_GODMODE_TS); } catch {}
    return { active: false, activated_at: null, hours_remaining: 0 };
  }
  const elapsed = Date.now() - prefs.godmode_activated_at;
  const active = elapsed < GODMODE_DURATION_MS;
  const hours = Math.max(0, Math.ceil((GODMODE_DURATION_MS - elapsed) / (60 * 60 * 1000)));
  try {
    if (active) {
      localStorage.setItem(LS_GODMODE_TS, String(prefs.godmode_activated_at));
    } else {
      localStorage.removeItem(LS_GODMODE_TS);
    }
  } catch {}
  return { active, activated_at: prefs.godmode_activated_at, hours_remaining: active ? hours : 0 };
}

export async function postHardModePref(enabled: boolean): Promise<void> {
  const token = getStoredToken();
  if (!token) return;
  try {
    await fetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ hard_mode_pref: enabled }),
    });
  } catch {
    /* non-critical */
  }
}

export async function fetchPreferences(): Promise<{ godmode_activated_at: number | null; hard_mode_pref: boolean } | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch("/api/user/preferences", {
      headers: authHeaders(),
    });
    if (res.status === 401) {
      clearAuth();
      return null;
    }
    const json = await res.json();
    if (!json.success) return null;
    return json.data as { godmode_activated_at: number | null; hard_mode_pref: boolean };
  } catch {
    return null;
  }
}
