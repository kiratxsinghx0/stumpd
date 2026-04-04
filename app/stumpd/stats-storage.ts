import type { GameStats } from "../components/games";

const LS_STATS_KEY = "stumpdpuzzle_stats";
const LS_STATS_RECORDED_KEY = "stumpdpuzzle_statsRecordedGameId";

export const DEFAULT_STUMPD_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
};

export function readStats(): GameStats {
  if (typeof window === "undefined") return DEFAULT_STUMPD_STATS;
  try {
    const raw = localStorage.getItem(LS_STATS_KEY);
    if (!raw) return DEFAULT_STUMPD_STATS;
    return { ...DEFAULT_STUMPD_STATS, ...(JSON.parse(raw) as Partial<GameStats>) };
  } catch {
    return DEFAULT_STUMPD_STATS;
  }
}

export function persistStats(stats: GameStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_STATS_KEY, JSON.stringify(stats));
  } catch {
    /* quota / private mode */
  }
}

/** Updates played / wins / streaks once per puzzle `gameId` and persists to localStorage. */
export function recordGameResult(won: boolean, gameId: string): GameStats {
  const prev = readStats();
  const alreadyRecorded =
    typeof window !== "undefined" &&
    localStorage.getItem(LS_STATS_RECORDED_KEY) === gameId;
  if (alreadyRecorded) return prev;

  const next: GameStats = {
    gamesPlayed: prev.gamesPlayed + 1,
    gamesWon: prev.gamesWon + (won ? 1 : 0),
    currentStreak: won ? prev.currentStreak + 1 : 0,
    maxStreak: won
      ? Math.max(prev.maxStreak, prev.currentStreak + 1)
      : prev.maxStreak,
  };
  persistStats(next);
  try {
    localStorage.setItem(LS_STATS_RECORDED_KEY, gameId);
  } catch {
    /* */
  }
  return next;
}
