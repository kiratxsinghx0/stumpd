export type TodayEntry = {
  rank: number;
  email: string;
  num_guesses: number;
  time_seconds: number | null;
  hints_used: number;
  is_hard_mode_today?: boolean;
};

export type PeriodEntry = {
  rank: number;
  email: string;
  games_won: number;
  points: number;
  is_hard_mode_today?: boolean;
};

export type HardModeTodayEntry = {
  rank: number;
  email: string;
  num_guesses: number;
  time_seconds: number | null;
};

async function fetchJson<T>(url: string, bustCache = false): Promise<T[]> {
  try {
    const finalUrl = bustCache
      ? `${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`
      : url;
    const res = await fetch(finalUrl, bustCache ? { cache: "no-store" } : undefined);
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) return [];
    return json.data as T[];
  } catch {
    return [];
  }
}

/* ── Normal leaderboards ── */

export function fetchTodayLeaderboard(puzzleDay: number, bustCache = false): Promise<TodayEntry[]> {
  return fetchJson<TodayEntry>(
    `/api/user/leaderboard/today?puzzle_day=${puzzleDay}`,
    bustCache,
  );
}

export function fetchWeeklyLeaderboard(puzzleDay?: number): Promise<PeriodEntry[]> {
  const qs = puzzleDay ? `?puzzle_day=${puzzleDay}` : "";
  return fetchJson<PeriodEntry>(`/api/user/leaderboard/weekly${qs}`);
}

export function fetchMonthlyLeaderboard(puzzleDay?: number): Promise<PeriodEntry[]> {
  const qs = puzzleDay ? `?puzzle_day=${puzzleDay}` : "";
  return fetchJson<PeriodEntry>(`/api/user/leaderboard/monthly${qs}`);
}

export function fetchOverallLeaderboard(puzzleDay?: number): Promise<PeriodEntry[]> {
  const qs = puzzleDay ? `?puzzle_day=${puzzleDay}` : "";
  return fetchJson<PeriodEntry>(`/api/user/leaderboard/all-time${qs}`);
}

/* ── Hard mode leaderboards ── */

export function fetchHardModeTodayLeaderboard(puzzleDay: number, bustCache = false): Promise<HardModeTodayEntry[]> {
  return fetchJson<HardModeTodayEntry>(
    `/api/user/leaderboard/hard-mode/today?puzzle_day=${puzzleDay}`,
    bustCache,
  );
}

export function fetchHardModeWeeklyLeaderboard(puzzleDay?: number): Promise<PeriodEntry[]> {
  const qs = puzzleDay ? `?puzzle_day=${puzzleDay}` : "";
  return fetchJson<PeriodEntry>(`/api/user/leaderboard/hard-mode/weekly${qs}`);
}

export function fetchHardModeMonthlyLeaderboard(puzzleDay?: number): Promise<PeriodEntry[]> {
  const qs = puzzleDay ? `?puzzle_day=${puzzleDay}` : "";
  return fetchJson<PeriodEntry>(`/api/user/leaderboard/hard-mode/monthly${qs}`);
}

export function fetchHardModeOverallLeaderboard(puzzleDay?: number): Promise<PeriodEntry[]> {
  const qs = puzzleDay ? `?puzzle_day=${puzzleDay}` : "";
  return fetchJson<PeriodEntry>(`/api/user/leaderboard/hard-mode/all-time${qs}`);
}
