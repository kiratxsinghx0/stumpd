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

const LS_STREAK_NORMAL_CURRENT = "stumpdpuzzle_streak_normal_current";
const LS_STREAK_NORMAL_MAX = "stumpdpuzzle_streak_normal_max";
const LS_STREAK_NORMAL_LAST_DAY = "stumpdpuzzle_streak_normal_lastDay";
const LS_STREAK_HARD_CURRENT = "stumpdpuzzle_streak_hard_current";
const LS_STREAK_HARD_MAX = "stumpdpuzzle_streak_hard_max";
const LS_STREAK_HARD_LAST_DAY = "stumpdpuzzle_streak_hard_lastDay";

const LS_PLAYED_NORMAL = "stumpdpuzzle_played_normal";
const LS_WON_NORMAL = "stumpdpuzzle_won_normal";
const LS_PLAYED_HARD = "stumpdpuzzle_played_hard";
const LS_WON_HARD = "stumpdpuzzle_won_hard";

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

/* ── Per-mode streak helpers (localStorage) ── */

function lsGetInt(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(key) || "0", 10) || 0;
  } catch { return 0; }
}

function lsSetInt(key: string, value: number): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, String(value)); } catch { /* */ }
}

export function readStreaks(mode: "normal" | "hard"): { currentStreak: number; maxStreak: number; lastPuzzleDay: number } {
  if (typeof window === "undefined") return { currentStreak: 0, maxStreak: 0, lastPuzzleDay: 0 };

  const currentKey = mode === "hard" ? LS_STREAK_HARD_CURRENT : LS_STREAK_NORMAL_CURRENT;
  const maxKey = mode === "hard" ? LS_STREAK_HARD_MAX : LS_STREAK_NORMAL_MAX;
  const lastDayKey = mode === "hard" ? LS_STREAK_HARD_LAST_DAY : LS_STREAK_NORMAL_LAST_DAY;

  // Legacy migration: if normal streak keys have never been written, try to
  // seed from the old shared stats blob. Only safe when no per-mode keys
  // exist at all — once the new system is active the shared blob mixes modes.
  if (mode === "normal" && localStorage.getItem(currentKey) === null) {
    const newSystemActive = localStorage.getItem(LS_STREAK_HARD_CURRENT) !== null
      || localStorage.getItem(LS_PLAYED_HARD) !== null
      || localStorage.getItem(LS_PLAYED_NORMAL) !== null;

    if (!newSystemActive) {
      try {
        const raw = localStorage.getItem(LS_STATS_KEY);
        if (raw) {
          const old = JSON.parse(raw) as Partial<GameStats>;
          const cur = old.currentStreak ?? 0;
          const max = old.maxStreak ?? 0;
          lsSetInt(currentKey, cur);
          lsSetInt(maxKey, max);
          return { currentStreak: cur, maxStreak: max, lastPuzzleDay: 0 };
        }
      } catch { /* */ }
    }
  }

  return {
    currentStreak: lsGetInt(currentKey),
    maxStreak: lsGetInt(maxKey),
    lastPuzzleDay: lsGetInt(lastDayKey),
  };
}

export function persistStreaks(mode: "normal" | "hard", current: number, max: number, lastPuzzleDay?: number): void {
  if (mode === "hard") {
    lsSetInt(LS_STREAK_HARD_CURRENT, current);
    lsSetInt(LS_STREAK_HARD_MAX, max);
    if (lastPuzzleDay != null) lsSetInt(LS_STREAK_HARD_LAST_DAY, lastPuzzleDay);
  } else {
    lsSetInt(LS_STREAK_NORMAL_CURRENT, current);
    lsSetInt(LS_STREAK_NORMAL_MAX, max);
    if (lastPuzzleDay != null) lsSetInt(LS_STREAK_NORMAL_LAST_DAY, lastPuzzleDay);
  }
}

/** Per-mode played/won counts from localStorage (not derived from history). */
export function readModeStats(mode: "normal" | "hard"): { gamesPlayed: number; gamesWon: number } {
  const playedKey = mode === "hard" ? LS_PLAYED_HARD : LS_PLAYED_NORMAL;
  const wonKey = mode === "hard" ? LS_WON_HARD : LS_WON_NORMAL;
  return { gamesPlayed: lsGetInt(playedKey), gamesWon: lsGetInt(wonKey) };
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
 * Each mode now has its own independent streak tracked in localStorage.
 * Uses puzzle_day to detect gaps — skipping a day resets currentStreak.
 */
export function recordGameResult(won: boolean, gameId: string, hardMode?: boolean): GameStats {
  const prev = readStats();
  const mode = hardMode ? "hard" : "normal";
  const modeKey = `${gameId}_${mode}`;
  const recorded = readRecordedSet();
  if (recorded.has(modeKey)) return prev;

  const puzzleDay = parseInt(gameId, 10) || 0;
  const modeStreaks = readStreaks(mode);

  const isConsecutive = modeStreaks.lastPuzzleDay === 0 ||
    puzzleDay === modeStreaks.lastPuzzleDay + 1;

  let newCurrent: number;
  if (!won) {
    newCurrent = 0;
  } else if (isConsecutive) {
    newCurrent = modeStreaks.currentStreak + 1;
  } else {
    newCurrent = 1;
  }
  const newMax = Math.max(modeStreaks.maxStreak, newCurrent);
  persistStreaks(mode, newCurrent, newMax, puzzleDay);

  const playedKey = hardMode ? LS_PLAYED_HARD : LS_PLAYED_NORMAL;
  const wonKey = hardMode ? LS_WON_HARD : LS_WON_NORMAL;
  const modePlayed = lsGetInt(playedKey) + 1;
  const modeWon = lsGetInt(wonKey) + (won ? 1 : 0);
  lsSetInt(playedKey, modePlayed);
  lsSetInt(wonKey, modeWon);

  const next: GameStats = {
    gamesPlayed: modePlayed,
    gamesWon: modeWon,
    currentStreak: newCurrent,
    maxStreak: newMax,
  };
  // Persist per-mode played/won to the shared blob for backward compat;
  // streak values stay only in per-mode keys to avoid cross-mode leaks.
  persistStats({ ...prev, gamesPlayed: prev.gamesPlayed + 1, gamesWon: prev.gamesWon + (won ? 1 : 0) });

  recorded.add(modeKey);
  persistRecordedSet(recorded);
  try {
    localStorage.setItem(LS_STATS_RECORDED_KEY, modeKey);
  } catch { /* */ }
  return next;
}
