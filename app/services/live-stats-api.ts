import type { LiveStats } from "../components/games";

export type { LiveStats };

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
    if (d.totalPlayed === 0 && d.puzzleDay == null) return FALLBACK;
    return d;
  } catch {
    return FALLBACK;
  }
}

const LS_INCREMENT_PREFIX = "stumpd_live_inc_";

export async function incrementLiveStats(
  puzzleDay: number,
  won: boolean,
  numGuesses: number,
  hardMode?: boolean,
): Promise<void> {
  try {
    const suffix = hardMode ? "hard" : "normal";
    const key = `${LS_INCREMENT_PREFIX}${suffix}_${puzzleDay}`;
    if (typeof window !== "undefined" && localStorage.getItem(key)) return;

    const endpoint = hardMode
      ? "/api/live-stats/hard-mode/increment"
      : "/api/live-stats/increment";

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzle_day: puzzleDay, won, num_guesses: numGuesses }),
    });

    if (typeof window !== "undefined") {
      try { localStorage.setItem(key, "1"); } catch { /* */ }
    }
  } catch {
    /* silent */
  }
}

const LS_GAME_START_PREFIX = "stumpd_live_start_";

export async function incrementGameStart(
  puzzleDay: number,
  hardMode?: boolean,
): Promise<void> {
  try {
    const suffix = hardMode ? "hard" : "normal";
    const key = `${LS_GAME_START_PREFIX}${suffix}_${puzzleDay}`;
    if (typeof window !== "undefined" && localStorage.getItem(key)) return;

    const endpoint = hardMode
      ? "/api/live-stats/hard-mode/game-start"
      : "/api/live-stats/game-start";

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzle_day: puzzleDay }),
    });

    if (typeof window !== "undefined") {
      try { localStorage.setItem(key, "1"); } catch { /* */ }
    }
  } catch {
    /* silent */
  }
}
