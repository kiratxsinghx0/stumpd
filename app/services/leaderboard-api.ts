export type TodayEntry = {
  rank: number;
  email: string;
  num_guesses: number;
  time_seconds: number | null;
  hints_used: number;
};

export type PeriodEntry = {
  rank: number;
  email: string;
  games_won: number;
  points: number;
};

async function fetchJson<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) return [];
    return json.data as T[];
  } catch {
    return [];
  }
}

export function fetchTodayLeaderboard(puzzleDay: number): Promise<TodayEntry[]> {
  return fetchJson<TodayEntry>(
    `/api/user/leaderboard/today?puzzle_day=${puzzleDay}`,
  );
}

export function fetchWeeklyLeaderboard(): Promise<PeriodEntry[]> {
  return fetchJson<PeriodEntry>("/api/user/leaderboard/weekly");
}

export function fetchMonthlyLeaderboard(): Promise<PeriodEntry[]> {
  return fetchJson<PeriodEntry>("/api/user/leaderboard/monthly");
}

export function fetchOverallLeaderboard(): Promise<PeriodEntry[]> {
  return fetchJson<PeriodEntry>("/api/user/leaderboard/all-time");
}
