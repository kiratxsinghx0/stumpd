export type TodayLeaderboardEntry = {
  rank: number;
  email: string;
  num_guesses: number;
  time_seconds: number | null;
  hints_used: number;
};

export type AllTimeLeaderboardEntry = {
  rank: number;
  email: string;
  games_played: number;
  games_won: number;
  win_pct: number;
  avg_guesses: number;
  avg_time: number | null;
};

export async function fetchTodayLeaderboard(
  puzzleDay: number,
): Promise<TodayLeaderboardEntry[]> {
  try {
    const res = await fetch(
      `/api/user/leaderboard/today?puzzle_day=${puzzleDay}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success) return [];
    return json.data as TodayLeaderboardEntry[];
  } catch {
    return [];
  }
}

export async function fetchAllTimeLeaderboard(): Promise<AllTimeLeaderboardEntry[]> {
  try {
    const res = await fetch("/api/user/leaderboard/all-time", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success) return [];
    return json.data as AllTimeLeaderboardEntry[];
  } catch {
    return [];
  }
}
