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
): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, gameResult }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Registration failed");
  storeAuth(json.data.token, json.data.user);
  return json.data;
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Login failed");
  storeAuth(json.data.token, json.data.user);
  return json.data;
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
