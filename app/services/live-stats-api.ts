export type LiveStats = {
  puzzleDay: number | null;
  totalPlayed: number;
  totalWon: number;
  distribution: number[];
};

const FALLBACK: LiveStats = {
  puzzleDay: null,
  totalPlayed: 8901,
  totalWon: 7120,
  distribution: [5, 12, 28, 30, 17, 8],
};

export async function fetchLiveStats(): Promise<LiveStats> {
  try {
    const res = await fetch("/api/live-stats/today", { cache: "no-store" });
    if (!res.ok) return FALLBACK;
    const json = await res.json();
    if (!json.success || !json.data) return FALLBACK;
    const d = json.data as LiveStats;
    if (d.totalPlayed === 0) return FALLBACK;
    return d;
  } catch {
    return FALLBACK;
  }
}

export async function incrementLiveStats(
  puzzleDay: number,
  won: boolean,
  numGuesses: number,
): Promise<void> {
  try {
    await fetch("/api/live-stats/increment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzle_day: puzzleDay, won, num_guesses: numGuesses }),
    });
  } catch {
    /* silent */
  }
}
