import type { GameStats } from "../components/games";
import type { GameResultPayload } from "../services/auth-api";

/* ── Archive localStorage (single key, nested by day) ── */

const LS_ARCHIVE_KEY = "stumpdpuzzle_archive";

export type ArchiveDayData = {
  guesses?: Record<string, string>;
  puzzleId?: string;
  timerElapsed?: number;
  timerStarted?: boolean;
  unlockedHints?: { label: string; text: string }[];
  usedTriviaIndices?: number[];
  shareDismissed?: boolean;
  won?: boolean;
};

function readAllArchive(): Record<string, ArchiveDayData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_ARCHIVE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ArchiveDayData>) : {};
  } catch {
    return {};
  }
}

function writeAllArchive(all: Record<string, ArchiveDayData>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_ARCHIVE_KEY, JSON.stringify(all));
  } catch { /* quota / private mode */ }
}

export function readArchiveDay(day: number): ArchiveDayData | null {
  const all = readAllArchive();
  return all[String(day)] ?? null;
}

export function writeArchiveDay(day: number, data: ArchiveDayData): void {
  const all = readAllArchive();
  all[String(day)] = data;
  writeAllArchive(all);
}

export function patchArchiveDay(day: number, patch: Partial<ArchiveDayData>): void {
  const all = readAllArchive();
  const existing = all[String(day)] ?? {};
  all[String(day)] = { ...existing, ...patch };
  writeAllArchive(all);
}

/** Returns a map of day→won for all finished archive games. */
export function getArchivePlayedDays(): Map<number, boolean> {
  const all = readAllArchive();
  const map = new Map<number, boolean>();
  for (const [day, data] of Object.entries(all)) {
    if (data.puzzleId) {
      map.set(Number(day), !!data.won);
    }
  }
  return map;
}

/* ── Daily stats ── */

const LS_STATS_KEY = "stumpdpuzzle_stats";
const LS_STATS_RECORDED_KEY = "stumpdpuzzle_statsRecordedGameId";
const LS_STATS_RECORDED_SET_KEY = "stumpdpuzzle_statsRecordedSet";
const LS_GAME_HISTORY_KEY = "stumpdpuzzle_gameHistory";

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

export function readPerModeBaseline(): {
  gamesPlayedNormal: number; gamesWonNormal: number;
  gamesPlayedHard: number; gamesWonHard: number;
} {
  const history = readGameHistory();
  const normal = history.filter((r) => !r.hard_mode);
  const hard = history.filter((r) => r.hard_mode);
  return {
    gamesPlayedNormal: normal.length,
    gamesWonNormal: normal.filter((r) => r.won).length,
    gamesPlayedHard: hard.length,
    gamesWonHard: hard.filter((r) => r.won).length,
  };
}

/** Read per-game result history from localStorage. */
export function readGameHistory(): GameResultPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_GAME_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameResultPayload[];
  } catch {
    return [];
  }
}

/** Append a game result to localStorage history (de-duped by puzzle_day + hard_mode). */
export function saveGameToHistory(result: GameResultPayload): void {
  if (typeof window === "undefined") return;
  try {
    const history = readGameHistory();
    if (history.some((r) => r.puzzle_day === result.puzzle_day && !!r.hard_mode === !!result.hard_mode)) return;
    history.push(result);
    localStorage.setItem(LS_GAME_HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* quota / private mode */
  }
}

function readRecordedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_STATS_RECORDED_SET_KEY);
    if (!raw) {
      // Migrate from old single-key format
      const legacy = localStorage.getItem(LS_STATS_RECORDED_KEY);
      return legacy ? new Set([legacy]) : new Set();
    }
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistRecordedSet(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_STATS_RECORDED_SET_KEY, JSON.stringify([...set]));
  } catch { /* */ }
}

/**
 * Updates played / wins / streaks once per puzzle `gameId` per mode.
 * Streak only increments once per puzzle_day (first mode played counts).
 */
export function recordGameResult(won: boolean, gameId: string, hardMode?: boolean): GameStats {
  const prev = readStats();
  const modeKey = `${gameId}_${hardMode ? "hard" : "normal"}`;
  const recorded = readRecordedSet();
  if (recorded.has(modeKey)) return prev;

  const dayKey = `${gameId}_day`;
  const dayAlreadyCounted = recorded.has(dayKey);

  const next: GameStats = {
    gamesPlayed: prev.gamesPlayed + 1,
    gamesWon: prev.gamesWon + (won ? 1 : 0),
    currentStreak: dayAlreadyCounted
      ? prev.currentStreak
      : won ? prev.currentStreak + 1 : 0,
    maxStreak: dayAlreadyCounted
      ? prev.maxStreak
      : won
        ? Math.max(prev.maxStreak, prev.currentStreak + 1)
        : prev.maxStreak,
  };
  persistStats(next);
  recorded.add(modeKey);
  if (!dayAlreadyCounted) recorded.add(dayKey);
  persistRecordedSet(recorded);
  try {
    localStorage.setItem(LS_STATS_RECORDED_KEY, modeKey);
  } catch { /* */ }
  return next;
}
