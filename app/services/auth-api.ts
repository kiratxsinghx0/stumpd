const LS_TOKEN_KEY = "stumpd_auth_token";
const LS_USER_KEY = "stumpd_auth_user";

export type AuthUser = { id: number; email: string };

export type GameResultPayload = {
  puzzle_day: number;
  won: boolean;
  num_guesses: number;
  time_seconds?: number;
  hints_used?: number;
};

export type UserStats = {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
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
  localStorage.setItem(LS_TOKEN_KEY, token);
  localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(LS_TOKEN_KEY);
  localStorage.removeItem(LS_USER_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(
  email: string,
  password: string,
  gameResult?: GameResultPayload,
  baselineStats?: { gamesPlayed: number; gamesWon: number; currentStreak: number; maxStreak: number },
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
  const data = json.data as { token: string; user: AuthUser };
  storeAuth(data.token, data.user);
  return data;
}

export async function login(
  email: string,
  password: string,
  baselineStats?: { gamesPlayed: number; gamesWon: number; currentStreak: number; maxStreak: number },
): Promise<{ user: AuthUser; token: string }> {
  let res: Response;
  try {
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, baselineStats }),
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
  const data = json.data as { token: string; user: AuthUser };
  storeAuth(data.token, data.user);
  return data;
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
