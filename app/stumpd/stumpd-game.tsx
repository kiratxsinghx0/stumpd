"use client";
import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ShareModal from "../components/share";
import HowToPlayModal from "../components/how-to-play-modal";
import GuessHistoryModal from "../components/guess-history-modal";
import StumpdHowToPlay from "./stumpd-how-to-play";
import PageHeader, { OPEN_HOW_TO_PLAY_EVENT, OPEN_HINT_HISTORY_EVENT, OPEN_LEADERBOARD_EVENT, OPEN_SETTINGS_EVENT, dispatchLeaderboardState } from "../components/page-header";
import LeaderboardModal from "../components/leaderboard-modal";
import SettingsModal from "../components/settings-modal";
import type { ToggleOrigin } from "../components/settings-modal";
import HardModeTransition from "../components/hard-mode-transition";
import WeeklyTopPlayersNotice from "../components/weekly-top-players-notice";
import FunFactNotice from "../components/fun-fact-notice";
import { dispatchHintCountUpdate } from "../components/hint-history-open";
import { COOKIE_CONSENT_STORAGE_KEY } from "../components/cookie-banner";
import { getInitialPlayerList, fetchIplPlayersFromAPI, loadFallbackPlayers } from "./ipl-players";
import type { IplPlayerRow } from "./ipl-players";
import { fetchPuzzleToday, fetchHardModePuzzleToday, fetchPuzzleByDay } from "../services/ipl-api";
import type { PuzzleData, PuzzleHintEntry } from "../services/ipl-api";
import type { GameStats, LiveStats } from "../components/games";
import { DEFAULT_STUMPD_STATS, readStats, readStreaks, readModeStats, recordGameResult, saveGameToHistory, readArchiveDay, patchArchiveDay } from "./stats-storage";
import ReminderPrompt from "../components/reminder-prompt";
import { fetchLiveStats, incrementLiveStats, incrementGameStart } from "../services/live-stats-api";
import { postGameResult, postHardModeResult, postAllPendingResults, isLoggedIn, fetchMyStats, fetchMyHardModeStats, saveGameProgress, fetchGameProgress, fetchGodmodeStatus, getStoredUser, syncGameHistory, postArchiveResult } from "../services/auth-api";
import type { GameResultPayload } from "../services/auth-api";
import { getAccuracyBadge, getGodmodeBadge } from "../utils/accuracy-badge";
import { xorDecode, ENCODE_KEY } from "../utils/xor-codec";
import NextPuzzleTimer from "../components/timers";
import GodmodeUnlockAnimation from "../components/godmode-unlock-animation";
import GodmodeLoginPrompt from "../components/godmode-login-prompt";
import { isGodmodeActive, activateGodmode, getGodmodeHoursRemaining } from "../utils/godmode-status";
import { readCurrentGameProgress } from "./progress-helpers";

function findHint<T = string>(hints: PuzzleHintEntry[], key: string): T | undefined {
  const entry = hints.find((h) => h[key] !== undefined);
  return entry ? (entry[key] as T) : undefined;
}

function collectHintTexts(hints: PuzzleHintEntry[]): string[] {
  const entry = hints.find((h) => h.trivia !== undefined);
  if (!entry) return [];
  const val = entry.trivia;
  return Array.isArray(val) ? (val as string[]) : [val as string];
}

/** Optional display metadata when the playable 5-letter token is an abbreviation. */
export type PlayerNameMeta = { shortened: true; fullName: string };

/** Fixed hint ladder: one hint auto-revealed per wrong guess in this order. */
const HINT_LADDER: { key: string; label: string }[] = [
  { key: "role",            label: "Role" },
  { key: "hint",            label: "Hint" },
  { key: "iplTeam+country", label: "IPL Team & Nationality" },
  { key: "hint",            label: "Hint" },
  { key: "hint",            label: "Hint" },
];

const LS_HOW_TO_PLAY_DISMISSED = "stumpdpuzzle_howToPlayDismissed";
const LS_HOW_TO_PLAY_SEEN = "stumpdpuzzle_howToPlaySeen";
const LS_WEEKLY_NOTICE_SEEN = "stumpdpuzzle_weeklyNoticeSeen";
const ENABLE_WEEKLY_NOTICE = false;

function shouldShowWeeklyNotice(): boolean {
  try {
    const lastSeen = localStorage.getItem(LS_WEEKLY_NOTICE_SEEN);
    if (!lastSeen) return true;
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return new Date(lastSeen) < monday;
  } catch {
    return false;
  }
}

function markWeeklyNoticeSeen(): void {
  try {
    localStorage.setItem(LS_WEEKLY_NOTICE_SEEN, new Date().toISOString());
  } catch { /* */ }
}

const LS_FUN_FACT_SEEN_DAY = "stumpdpuzzle_funFactSeenDay";

function hasFunFactBeenSeen(day: number): boolean {
  try {
    return localStorage.getItem(LS_FUN_FACT_SEEN_DAY) === String(day);
  } catch {
    return true;
  }
}

function markFunFactSeen(day: number): void {
  try {
    localStorage.setItem(LS_FUN_FACT_SEEN_DAY, String(day));
  } catch { /* */ }
}

type IplHintEntry = PuzzleHintEntry;

/** When `disambiguateFullName` is set (from the daily puzzle), pick that row among duplicate tokens (e.g. RASHI). */
function resolvePlayerByName(
  token: string,
  playerList: IplPlayerRow[],
  disambiguateFullName?: string | null,
): IplPlayerRow | null {
  const normalized = token.trim().toLowerCase();
  const matches = playerList.filter((p) => p.name.toLowerCase() === normalized);
  if (matches.length === 0) {
    const fn = disambiguateFullName?.trim();
    if (fn) {
      return playerList.find((p) => p.meta.fullName === fn) ?? null;
    }
    return null;
  }
  const fn = disambiguateFullName?.trim();
  if (fn) {
    const hit = matches.find((p) => p.meta.fullName === fn);
    if (hit) return hit;
  }
  return matches[0] ?? null;
}

function isSamePlayer(
  guess: string,
  answer: string,
  playerList: IplPlayerRow[],
  answerFullName?: string | null,
  exactOnly?: boolean,
): boolean {
  if (guess === answer) return true;
  if (exactOnly) return false;
  const gp = resolvePlayerByName(guess, playerList, null);
  const ap = resolvePlayerByName(answer, playerList, answerFullName ?? null);
  if (!gp || !ap) return false;
  return !!gp.meta.fullName && gp.meta.fullName === ap.meta.fullName;
}

const MAX_GUESSES  = 6;
const WORD_LENGTH  = 5;


const LS_PUZZLE_CACHE_KEY = "stumpdpuzzle_cache";
const LS_HARD_PUZZLE_CACHE_KEY = "stumpdpuzzle_hard_cache";

/** 6 AM IST = 00:30 UTC */
function isPuzzleBeforeTodayCutoff(setAt: string): boolean {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setUTCHours(0, 30, 0, 0);
  if (now < cutoff) {
    cutoff.setUTCDate(cutoff.getUTCDate() - 1);
  }
  return new Date(setAt) < cutoff;
}

function readCachedPuzzle(hard?: boolean): PuzzleData | null {
  if (typeof window === "undefined") return null;
  try {
    const key = hard ? LS_HARD_PUZZLE_CACHE_KEY : LS_PUZZLE_CACHE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as PuzzleData;
  } catch {
    return null;
  }
}

function cachePuzzle(data: PuzzleData, hard?: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const key = hard ? LS_HARD_PUZZLE_CACHE_KEY : LS_PUZZLE_CACHE_KEY;
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* quota / private mode */ }
}

async function ensureFreshPuzzle(hard?: boolean): Promise<PuzzleData> {
  const cached = readCachedPuzzle(hard);
  if (cached?.setAt && !isPuzzleBeforeTodayCutoff(cached.setAt)) {
    return cached;
  }
  try {
    const fresh = hard ? await fetchHardModePuzzleToday() : await fetchPuzzleToday();
    cachePuzzle(fresh, hard);
    return fresh;
  } catch {
    if (cached) return cached;
    throw new Error("No puzzle available");
  }
}

const FLIP_DURATION = 340;
const FLIP_STAGGER  = 80;

/** Win row: staggered tile bounce (left → right), then “Genius” toast above the grid */
const WIN_BOUNCE_STAGGER_MS = 100;
const WIN_BOUNCE_DURATION_MS = 450;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const STATUS_PRIORITY: Record<string, number> = { correct: 3, present: 2, absent: 1 };
const STATUS_COLOR: Record<string, string> = {
  correct: "#6aaa64",
  present: "#c9b458",
  absent:  "#787c7e",
};
const GODMODE_STATUS_COLOR: Record<string, string> = {
  correct: "#d4a017",
  present: "#7c5cbf",
  absent:  "#3d4555",
};

function getLetterStatuses(guess: string, answer: string): string[] {
  const result    = Array(WORD_LENGTH).fill("absent");
  const answerArr = answer.split("");
  const guessArr  = guess.split("");
  const used      = Array(WORD_LENGTH).fill(false);

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === answerArr[i]) { result[i] = "correct"; used[i] = true; }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!used[j] && guessArr[i] === answerArr[j]) {
        result[i] = "present"; used[j] = true; break;
      }
    }
  }
  return result;
}

const LS_GAME_ID_KEY = "stumpdpuzzle_gameId";
const LS_HARD_GAME_ID_KEY = "stumpdpuzzle_hard_gameId";

const LS_GUESS_KEY = "stumpdpuzzle_guess";
const LS_USER_HAS_PLAYED_KEY = "stumpdpuzzle_userHasPlayed";
const LS_USER_HAS_PLAYED_VALUE = "yes";
const LS_PUZZLE_ID_KEY = "stumpdpuzzle_puzzleId";
const LS_SHARE_DISMISSED_PUZZLE_KEY = "stumpdpuzzle_shareDismissedPuzzleId";
const LS_UNLOCKED_HINTS_KEY = "stumpdpuzzle_unlockedHints";
const LS_TIMER_ELAPSED_KEY = "stumpdpuzzle_timerElapsed";
const LS_TIMER_STARTED_KEY = "stumpdpuzzle_timerStarted";
const LS_USED_TRIVIA_KEY = "stumpdpuzzle_usedTriviaIndices";
const LS_HARD_MODE_KEY = "stumpdpuzzle_hardMode";

const LS_HARD_GUESS_KEY = "stumpdpuzzle_hard_guess";
const LS_HARD_PUZZLE_ID_KEY = "stumpdpuzzle_hard_puzzleId";
const LS_HARD_TIMER_ELAPSED_KEY = "stumpdpuzzle_hard_timerElapsed";
const LS_HARD_TIMER_STARTED_KEY = "stumpdpuzzle_hard_timerStarted";
const LS_HARD_SHARE_DISMISSED_PUZZLE_KEY = "stumpdpuzzle_hard_shareDismissedPuzzleId";

const NORMAL_GAME_STORAGE_KEYS = [
  LS_GUESS_KEY,
  LS_PUZZLE_ID_KEY,
  LS_SHARE_DISMISSED_PUZZLE_KEY,
  LS_UNLOCKED_HINTS_KEY,
  LS_TIMER_ELAPSED_KEY,
  LS_TIMER_STARTED_KEY,
  LS_USED_TRIVIA_KEY,
] as const;

const HARD_GAME_STORAGE_KEYS = [
  LS_HARD_GUESS_KEY,
  LS_HARD_PUZZLE_ID_KEY,
  LS_HARD_TIMER_ELAPSED_KEY,
  LS_HARD_TIMER_STARTED_KEY,
  LS_HARD_SHARE_DISMISSED_PUZZLE_KEY,
] as const;

/**
 * Per-mode day guard: only clears that mode's keys when its own puzzle day
 * rolls over. The other mode's data is never touched.
 */
function syncGameIdStorage(gameId: string, hardMode?: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const idKey = hardMode ? LS_HARD_GAME_ID_KEY : LS_GAME_ID_KEY;
    const keysToClean = hardMode ? HARD_GAME_STORAGE_KEYS : NORMAL_GAME_STORAGE_KEYS;
    const stored = localStorage.getItem(idKey);
    if (stored === gameId) return;
    for (const key of keysToClean) {
      localStorage.removeItem(key);
    }
    localStorage.setItem(idKey, gameId);
  } catch {
    /* quota / private mode */
  }
}

function persistShareDismissed(puzzleId: string, hard?: boolean) {
  if (typeof window === "undefined") return;
  try {
    const key = hard ? LS_HARD_SHARE_DISMISSED_PUZZLE_KEY : LS_SHARE_DISMISSED_PUZZLE_KEY;
    localStorage.setItem(key, puzzleId);
  } catch {
    /* quota / private mode */
  }
}

function readShareDismissedForPuzzle(puzzleId: string, hard?: boolean): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = hard ? LS_HARD_SHARE_DISMISSED_PUZZLE_KEY : LS_SHARE_DISMISSED_PUZZLE_KEY;
    return localStorage.getItem(key) === puzzleId;
  } catch {
    return false;
  }
}

function parseGuessObject(
  raw: string,
  targetAnswer: string,
  playerList: IplPlayerRow[],
  answerFullName: string | null,
  hardMode?: boolean,
): { guesses: string[]; statuses: string[][] } | null {
  const obj = JSON.parse(raw) as Record<string, string>;
  const keys = Object.keys(obj)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  if (keys.length === 0) return null;
  const guesses: string[] = [];
  const statuses: string[][] = [];
  for (const k of keys) {
    const g = obj[String(k)];
    if (typeof g !== "string" || g.length !== WORD_LENGTH) continue;
    guesses.push(g);
    const isAlias = g !== targetAnswer && isSamePlayer(g, targetAnswer, playerList, answerFullName, hardMode);
    statuses.push(isAlias ? Array(WORD_LENGTH).fill("correct") : getLetterStatuses(g, targetAnswer));
  }
  if (guesses.length === 0) return null;
  return { guesses, statuses };
}

/**
 * Restore when `userHasPlayed` is "yes".
 * `puzzleId` is only written after the game ends (win or 6 guesses); until then it is absent and we still restore in-progress boards.
 * If `puzzleId` is present, it must match `PLAYER_TO_GUESS` (finished game for this puzzle).
 */
function readStoredGuesses(
  puzzleId: string,
  targetAnswer: string,
  playerList: IplPlayerRow[],
  answerFullName: string | null,
  hardMode?: boolean,
): { guesses: string[]; statuses: string[][] } | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem(LS_USER_HAS_PLAYED_KEY) !== "yes") return null;
    const guessKey = hardMode ? LS_HARD_GUESS_KEY : LS_GUESS_KEY;
    const puzzleIdKey = hardMode ? LS_HARD_PUZZLE_ID_KEY : LS_PUZZLE_ID_KEY;
    const storedPuzzleId = localStorage.getItem(puzzleIdKey);
    if (storedPuzzleId != null && storedPuzzleId !== "") {
      if (storedPuzzleId !== puzzleId) return null;
    }
    const raw = localStorage.getItem(guessKey);
    if (!raw) return null;
    return parseGuessObject(raw, targetAnswer, playerList, answerFullName, hardMode);
  } catch {
    return null;
  }
}

function isLocalGameCompleted(puzzleId: string, hardMode?: boolean): boolean {
  if (typeof window === "undefined") return false;
  try {
    const puzzleIdKey = hardMode ? LS_HARD_PUZZLE_ID_KEY : LS_PUZZLE_ID_KEY;
    return localStorage.getItem(puzzleIdKey) === puzzleId;
  } catch {
    return false;
  }
}

function writeRemoteToLocalStorage(
  remote: { guesses_json?: string; completed?: boolean; elapsed_seconds?: number; hints_used?: number; used_trivia_json?: string | null },
  puzzleId: string,
  hardMode: boolean,
  setElapsed?: (v: number) => void,
  elapsedRef?: React.MutableRefObject<number>,
  setTimerStartedCb?: (v: boolean) => void,
) {
  const guessKey = hardMode ? LS_HARD_GUESS_KEY : LS_GUESS_KEY;
  const puzzleIdKey = hardMode ? LS_HARD_PUZZLE_ID_KEY : LS_PUZZLE_ID_KEY;
  const timerKey = hardMode ? LS_HARD_TIMER_ELAPSED_KEY : LS_TIMER_ELAPSED_KEY;

  localStorage.setItem(LS_USER_HAS_PLAYED_KEY, LS_USER_HAS_PLAYED_VALUE);
  if (remote.guesses_json) localStorage.setItem(guessKey, remote.guesses_json);
  if (remote.completed) localStorage.setItem(puzzleIdKey, puzzleId);
  if (remote.elapsed_seconds != null) {
    localStorage.setItem(timerKey, String(remote.elapsed_seconds));
    if (!remote.completed) {
      localStorage.setItem(LS_TIMER_STARTED_KEY, "1");
      if (setTimerStartedCb) setTimerStartedCb(true);
    }
    if (setElapsed) setElapsed(remote.elapsed_seconds);
    if (elapsedRef) elapsedRef.current = remote.elapsed_seconds;
  }
  if (!hardMode && remote.hints_used != null && remote.hints_used > 0) {
    localStorage.setItem(LS_UNLOCKED_HINTS_KEY, JSON.stringify(Array(remote.hints_used).fill({})));
  }
}

/**
 * Saves guess rows and marks the session as played.
 * `puzzleId` is stored only when the game is finished (correct answer or all 6 guesses used).
 */
function persistGuess(
  puzzleId: string,
  guessIndex1Based: number,
  word: string,
  targetAnswer: string,
  playerList: IplPlayerRow[],
  answerFullName: string | null,
  hardMode?: boolean,
) {
  if (typeof window === "undefined") return;
  try {
    const guessKey = hardMode ? LS_HARD_GUESS_KEY : LS_GUESS_KEY;
    const puzzleIdKey = hardMode ? LS_HARD_PUZZLE_ID_KEY : LS_PUZZLE_ID_KEY;

    localStorage.setItem(LS_USER_HAS_PLAYED_KEY, LS_USER_HAS_PLAYED_VALUE);
    const prevPuzzle = localStorage.getItem(puzzleIdKey);
    const prevEmpty = prevPuzzle === null || prevPuzzle === "";
    const shouldMerge = prevEmpty || prevPuzzle === puzzleId;
    let obj: Record<string, string> = {};
    if (shouldMerge) {
      const existing = localStorage.getItem(guessKey);
      if (existing) obj = { ...JSON.parse(existing) as Record<string, string> };
    }
    obj[String(guessIndex1Based)] = word;
    localStorage.setItem(guessKey, JSON.stringify(obj));
    const won = isSamePlayer(word, targetAnswer, playerList, answerFullName, hardMode);
    const gameOver = won || guessIndex1Based === MAX_GUESSES;
    if (gameOver) {
      localStorage.setItem(puzzleIdKey, puzzleId);
    }
  } catch {
    /* quota / private mode */
  }
}

function persistUnlockedHints(hints: { label: string; text: string }[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_UNLOCKED_HINTS_KEY, JSON.stringify(hints));
  } catch { /* quota / private mode */ }
}

function readUnlockedHints(): { label: string; text: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_UNLOCKED_HINTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as { label: string; text: string }[];
  } catch {
    return [];
  }
}

function letterStatusFromRows(guessRows: string[], statusRows: string[][]): Record<string, string> {
  const next: Record<string, string> = {};
  for (let r = 0; r < guessRows.length; r++) {
    const row = guessRows[r];
    const rowStats = statusRows[r];
    if (!rowStats) continue;
    row.split("").forEach((letter, i) => {
      const s = rowStats[i];
      if (!s) return;
      if (!next[letter] || (STATUS_PRIORITY[s] ?? 0) > (STATUS_PRIORITY[next[letter]] ?? 0)) {
        next[letter] = s;
      }
    });
  }
  return next;
}

/** Matches globals.css `.game-shell--xs|sm|md` — tighter shell on smaller phones, more padding on larger (≤480px). */
function gameShellViewportClassSnapshot(): "" | "game-shell--xs" | "game-shell--sm" | "game-shell--md" {
  if (typeof window === "undefined") return "";
  const w = window.innerWidth;
  if (w <= 360) return "game-shell--xs";
  if (w <= 400) return "game-shell--sm";
  if (w <= 480) return "game-shell--md";
  return "";
}

function subscribeGameShellViewport(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", onChange, { passive: true });
  return () => window.removeEventListener("resize", onChange);
}

function useGameShellViewportClass(): string {
  return useSyncExternalStore(subscribeGameShellViewport, gameShellViewportClassSnapshot, () => "");
}

function formatGameTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Game() {
  const shellVpClass = useGameShellViewportClass();
  const searchParams = useSearchParams();
  const archiveDayParam = searchParams.get("day");
  const archiveDay = archiveDayParam ? Number(archiveDayParam) : null;
  const isArchiveMode = archiveDay !== null && Number.isInteger(archiveDay) && archiveDay > 0;
  const archiveDayRef = useRef(archiveDay);
  archiveDayRef.current = archiveDay;
  const isArchiveModeRef = useRef(isArchiveMode);
  isArchiveModeRef.current = isArchiveMode;

  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [puzzleError, setPuzzleError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [hardMode, setHardMode] = useState(() => {
    if (isArchiveMode) return false;
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(LS_HARD_MODE_KEY) === "1";
    } catch { return false; }
  });

  useEffect(() => {
    let cancelled = false;
    const isHard = hardMode;

    const puzzlePromise = isArchiveMode
      ? fetchPuzzleByDay(archiveDay!).catch(() => null)
      : ensureFreshPuzzle(isHard).catch(() => null);

    Promise.all([
      puzzlePromise,
      isArchiveMode ? Promise.resolve(null) : fetchLiveStats().catch(() => null),
      fetchIplPlayersFromAPI().catch(() => null),
    ]).then(async ([fresh, live, players]) => {
      if (cancelled) return;
      if (fresh) {
        setPuzzleError(false);
        setPuzzleData((prev) => {
          if (prev && prev.day === fresh.day && prev.encoded === fresh.encoded) return prev;
          return fresh;
        });
        if (!isArchiveMode) {
          if (isHard) {
            setHardModePuzzleDay(fresh.day);
          } else {
            fetchHardModePuzzleToday().then((hm) => { if (!cancelled) setHardModePuzzleDay(hm.day); }).catch(() => {});
          }
        }
      } else {
        setPuzzleError(true);
      }
      if (live) setLiveStats(live);
      if (players) {
        setPlayerList(players);
      } else if (getInitialPlayerList().length === 0) {
        const fallback = await loadFallbackPlayers();
        if (cancelled) return;
        if (fallback.length > 0) setPlayerList(fallback);
      }
      setPlayersLoading(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hardModeInitialRef = useRef(true);
  useEffect(() => {
    if (hardModeInitialRef.current) {
      hardModeInitialRef.current = false;
      return;
    }
    if (isArchiveMode) return;
    let cancelled = false;
    setPuzzleData(null);
    setPuzzleError(false);
    ensureFreshPuzzle(hardMode)
      .then((fresh) => {
        if (cancelled) return;
        setPuzzleData(fresh);
        if (hardMode) setHardModePuzzleDay(fresh.day);
      })
      .catch(() => {
        if (!cancelled) setPuzzleError(true);
      });
    return () => { cancelled = true; };
  }, [hardMode]);

  const playerToGuess = puzzleData
    ? xorDecode(puzzleData.encoded, ENCODE_KEY).toUpperCase()
    : "";
  const currentGameId = puzzleData ? String(puzzleData.day) : "";
  const puzzleAnswerFullName = puzzleData?.fullName ?? null;

  const [currentInput,  setCurrentInput]  = useState("");
  const [guesses,       setGuesses]       = useState<string[]>([]);
  const [statuses,      setStatuses]      = useState<string[][]>([]);
  const [letterStatus,  setLetterStatus]  = useState<Record<string, string>>({});
  const [shaking,       setShaking]       = useState(false);
  const [message,       setMessage]       = useState("");
  const [showModal,     setShowModal]     = useState(false);
  const [showHowToPlay, setShowHowToPlay]  = useState(false);
  const [showHintHistory, setShowHintHistory] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hmTransition, setHmTransition] = useState(false);
  const [hmTransOrigin, setHmTransOrigin] = useState<ToggleOrigin>({ x: 0, y: 0 });
  const [showWeeklyNotice, setShowWeeklyNotice] = useState(false);
  const [showFunFact, setShowFunFact] = useState(false);
  const [lbInvalidateKey, setLbInvalidateKey] = useState(0);
  const [hardModePuzzleDay, setHardModePuzzleDay] = useState<number | undefined>();
  const [shareDismissed, setShareDismissed] = useState(false);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STUMPD_STATS);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [lastGameResult, setLastGameResult] = useState<GameResultPayload | null>(null);
  const [todayRank, setTodayRank] = useState<number>(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedSecondsRef = useRef(0);
  const [cookieConsentDone, setCookieConsentDone] = useState(false);
  const [howToPlayDone, setHowToPlayDone] = useState(false);
  const [aliasWin, setAliasWin] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nudgeShownRef = useRef(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showGodmodeUnlock, setShowGodmodeUnlock] = useState(false);
  const [godmodeColorFlood, setGodmodeColorFlood] = useState(false);
  const [godmodeReentry, setGodmodeReentry] = useState(false);
  const [showGodmodeLoginPrompt, setShowGodmodeLoginPrompt] = useState(false);
  const [godmodeActive, setGodmodeActive] = useState(false);
  const [godmodeHoursLeft, setGodmodeHoursLeft] = useState(0);
  const [userInitial, setUserInitial] = useState("");
  const [authVersion, setAuthVersion] = useState(0);

  const [playerList, setPlayerList] = useState<IplPlayerRow[]>(() => getInitialPlayerList());
  const answerRef = useRef("");
  const playerListRef = useRef(playerList);
  playerListRef.current = playerList;
  const puzzleAnswerFullNameRef = useRef<string | null>(null);
  const currentGameIdRef = useRef("");
  const hardModeRef = useRef(false);
  const [playersLoading, setPlayersLoading] = useState(true);

  const validGuesses = useMemo(
    () => playerList.map((p) => p.name.toLowerCase()),
    [playerList]
  );

  const targetPlayer = useMemo(
    () =>
      playerToGuess
        ? resolvePlayerByName(playerToGuess, playerList, puzzleAnswerFullName)
        : null,
    [playerList, playerToGuess, puzzleAnswerFullName]
  );

  const inputLocked = !puzzleData || !targetPlayer || !cookieConsentDone || !howToPlayDone || showHowToPlay || showHintHistory || showLeaderboard || showSettings || showModal || showWeeklyNotice || showFunFact;

  const answer = targetPlayer?.name.toLowerCase() ?? "";
  answerRef.current = answer;
  currentGameIdRef.current = puzzleData ? String(puzzleData.day) : "";
  puzzleAnswerFullNameRef.current = puzzleData?.fullName ?? null;
  hardModeRef.current = hardMode;

  const refreshGodmodeState = useCallback(async (opts?: { triggerReentry?: boolean; reentry?: boolean }) => {
    const cachedActive = isGodmodeActive();
    const user = getStoredUser();
    setUserInitial(user?.email ? user.email.charAt(0).toUpperCase() : "");

    let active = cachedActive;
    let hoursLeft = cachedActive ? getGodmodeHoursRemaining() : 0;
    if (isLoggedIn()) {
      const server = await fetchGodmodeStatus();
      active = server.active;
      hoursLeft = server.hours_remaining;
    }

    setGodmodeHoursLeft(hoursLeft);

    if (opts?.triggerReentry && active) {
      setGodmodeReentry(opts.reentry ?? true);
      setGodmodeColorFlood(true);
      setShowGodmodeUnlock(true);
    } else {
      setGodmodeActive(active);
    }
  }, []);

  useEffect(() => {
    refreshGodmodeState({ triggerReentry: !isArchiveMode });
  }, [refreshGodmodeState]);

  useEffect(() => {
    if (!godmodeActive) return;
    const id = setInterval(() => {
      const stillActive = isGodmodeActive();
      const hours = getGodmodeHoursRemaining();
      setGodmodeHoursLeft(hours);
      if (!stillActive) {
        setGodmodeActive(false);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [godmodeActive]);

  useLayoutEffect(() => {
    if (godmodeActive && !showGodmodeUnlock && !isArchiveMode) {
      document.body.classList.add("body--godmode");
    } else if (!godmodeActive || isArchiveMode) {
      document.body.classList.remove("body--godmode");
      document.documentElement.classList.remove("godmode-early");
      document.documentElement.style.removeProperty("background-color");
      document.documentElement.style.removeProperty("color-scheme");
    }
    return () => { document.body.classList.remove("body--godmode"); };
  }, [godmodeActive, showGodmodeUnlock]);

  useEffect(() => {
    setStats(readStats());

    let consentDone = false;
    let rejected = false;
    try {
      const v = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (v === "accepted" || v === "rejected") {
        setCookieConsentDone(true);
        consentDone = true;
        rejected = v === "rejected";
      }
    } catch { /* */ }

    try {
      if (rejected || localStorage.getItem(LS_HOW_TO_PLAY_DISMISSED) === "1") {
        if (ENABLE_WEEKLY_NOTICE && !rejected && shouldShowWeeklyNotice()) {
          markWeeklyNoticeSeen();
          setTimeout(() => setShowWeeklyNotice(true), 300);
        } else {
          setHowToPlayDone(true);
        }
      } else if (consentDone) {
        setShowHowToPlay(true);
      }
    } catch { /* */ }
  }, []);

  const dismissHowToPlay = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_HOW_TO_PLAY_DISMISSED, "1");
        localStorage.setItem(LS_HOW_TO_PLAY_SEEN, "true");
      }
    } catch {
      /* quota / private mode */
    }
    setShowHowToPlay(false);

    if (ENABLE_WEEKLY_NOTICE && shouldShowWeeklyNotice()) {
      markWeeklyNoticeSeen();
      setShowWeeklyNotice(true);
    } else {
      setHowToPlayDone(true);
    }
  }, []);

  const dismissWeeklyNotice = useCallback(() => {
    setShowWeeklyNotice(false);
    setHowToPlayDone(true);
  }, []);

  const dismissFunFact = useCallback(() => {
    setShowFunFact(false);
  }, []);

  useEffect(() => {
    if (!howToPlayDone || !puzzleData?.funFact || isArchiveMode) return;
    if (hasFunFactBeenSeen(puzzleData.day)) return;
    markFunFactSeen(puzzleData.day);
    const timer = setTimeout(() => setShowFunFact(true), 200);
    return () => clearTimeout(timer);
  }, [howToPlayDone, puzzleData, isArchiveMode]);

  /** Mark how-to-play seen on cookie accept so returning-user hint works. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let htpTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      if (localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === "accepted") {
        localStorage.setItem(LS_HOW_TO_PLAY_SEEN, "true");
      }
    } catch { /* */ }

    const onCookieConsent = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "accepted" || detail === "rejected") {
        setCookieConsentDone(true);
        if (detail === "rejected") {
          setHowToPlayDone(true);
        } else {
          try {
            if (localStorage.getItem(LS_HOW_TO_PLAY_DISMISSED) !== "1") {
              htpTimer = setTimeout(() => setShowHowToPlay(true), 450);
            }
          } catch { /* */ }
        }
      }
      if (detail !== "accepted") return;
      try { localStorage.setItem(LS_HOW_TO_PLAY_SEEN, "true"); } catch { /* */ }
    };
    window.addEventListener("cookie-consent", onCookieConsent);
    return () => {
      window.removeEventListener("cookie-consent", onCookieConsent);
      if (htpTimer) clearTimeout(htpTimer);
    };
  }, []);

  /** Header help button opens How to play without waiting for first-visit flow. */
  useEffect(() => {
    const onOpenFromHeader = () => setShowHowToPlay(true);
    window.addEventListener(OPEN_HOW_TO_PLAY_EVENT, onOpenFromHeader);
    return () => window.removeEventListener(OPEN_HOW_TO_PLAY_EVENT, onOpenFromHeader);
  }, []);

  /** Header hint button opens hint history modal. */
  useEffect(() => {
    const onOpenHints = () => setShowHintHistory(true);
    window.addEventListener(OPEN_HINT_HISTORY_EVENT, onOpenHints);
    return () => window.removeEventListener(OPEN_HINT_HISTORY_EVENT, onOpenHints);
  }, []);

  /** Header leaderboard button opens leaderboard modal. */
  useEffect(() => {
    const onOpenLb = () => setShowLeaderboard(true);
    window.addEventListener(OPEN_LEADERBOARD_EVENT, onOpenLb);
    return () => window.removeEventListener(OPEN_LEADERBOARD_EVENT, onOpenLb);
  }, []);

  useEffect(() => {
    dispatchLeaderboardState(showLeaderboard);
  }, [showLeaderboard]);

  /** Header settings button opens settings modal. */
  useEffect(() => {
    const onOpenSettings = () => setShowSettings(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpenSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpenSettings);
  }, []);

  // Animation state
  const [flippingRow,      setFlippingRow]      = useState<number | null>(null);
  const [flippingGuess,    setFlippingGuess]    = useState("");
  const [flippingStatuses, setFlippingStatuses] = useState<string[]>([]);
  const [currentFlipCol,   setCurrentFlipCol]   = useState(-1);
  const [doneFlipCols,     setDoneFlipCols]     = useState<Set<number>>(new Set());
  /** Row index (0-based) whose committed tiles play the win bounce; cleared after toast exits */
  const [winBounceRow, setWinBounceRow] = useState<number | null>(null);
  const [showBadge, setShowBadge] = useState(false);

  const isAnimating = flippingRow !== null;
  const won      = guesses.length > 0 && isSamePlayer(guesses[guesses.length - 1], answer, playerList, puzzleAnswerFullName, hardMode);
  const lost     = !won && guesses.length === MAX_GUESSES;
  const gameOver = won || lost;
  const allAnimationsComplete = gameOver && !isAnimating && winBounceRow === null && (isArchiveMode || (!showGodmodeUnlock && !showGodmodeLoginPrompt));

  const wrongGuessCount = guesses.filter((g) => !isSamePlayer(g, answer, playerList, puzzleAnswerFullName, hardMode)).length;

  const playerHints: IplHintEntry[] = puzzleData?.hints ?? [];

  const showOpeningHint = !hardMode && !!targetPlayer && guesses.length === 0;
  const showProgressiveHint = !hardMode && !!targetPlayer && wrongGuessCount >= 1 && !won && !lost && !(gameOver && shareDismissed);
  const showHintSlot = showOpeningHint || showProgressiveHint;

  const displayRevealName =
    targetPlayer?.meta?.fullName ??
    `${answer.charAt(0).toUpperCase()}${answer.slice(1).toLowerCase()}`;

  const openingHintText = String(findHint(playerHints, "openingHint") ?? "");

  /** Resolve a single ladder tier's display text. Hint slots use sequential indices. */
  const resolveHintTier = useCallback((tier: number): { label: string; text: string } => {
    const { key, label } = HINT_LADDER[Math.min(tier, HINT_LADDER.length - 1)];
    if (key === "hint") {
      const hints = collectHintTexts(playerHints);
      let hintSlotIdx = 0;
      for (let t = 0; t < tier; t++) {
        if (HINT_LADDER[t]?.key === "hint") hintSlotIdx++;
      }
      return { label, text: hintSlotIdx < hints.length ? hints[hintSlotIdx] : "" };
    }
    if (key === "iplTeam+country") {
      const team = findHint(playerHints, "iplTeam") ?? "";
      const country = findHint(playerHints, "country") ?? "";
      return { label, text: `${team} · ${country}` };
    }
    if (key === "teams") {
      const teams = findHint<string[]>(playerHints, key) ?? [];
      return { label, text: teams.join(", ") };
    }
    const val = findHint(playerHints, key);
    return { label, text: val != null ? String(val) : "" };
  }, [playerHints]);

  const allUnlockedHints: { label: string; text: string }[] = hardMode
    ? []
    : [{ label: "Opening Clue", text: openingHintText }];
  if (!hardMode) {
    for (let i = 1; i <= wrongGuessCount; i++) {
      allUnlockedHints.push(resolveHintTier(i - 1));
    }
  }
  const allUnlockedHintsRef = useRef(allUnlockedHints);
  allUnlockedHintsRef.current = allUnlockedHints;

  const [activeHintIdx, setActiveHintIdx] = useState(0);
  const [hintSlideDir, setHintSlideDir] = useState<"left" | "right" | "">("");

  useEffect(() => {
    setActiveHintIdx(allUnlockedHints.length - 1);
    setHintSlideDir("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongGuessCount]);

  const hintTouchRef = useRef<{ startX: number; startY: number; swiping: boolean }>({ startX: 0, startY: 0, swiping: false });

  const onHintTouchStart = useCallback((e: React.TouchEvent) => {
    hintTouchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, swiping: false };
  }, []);

  const onHintTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - hintTouchRef.current.startX;
    const dy = e.changedTouches[0].clientY - hintTouchRef.current.startY;
    if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0 && activeHintIdx < allUnlockedHints.length - 1) {
      setHintSlideDir("left");
      setActiveHintIdx(prev => prev + 1);
    } else if (dx > 0 && activeHintIdx > 0) {
      setHintSlideDir("right");
      setActiveHintIdx(prev => prev - 1);
    }
  }, [activeHintIdx, allUnlockedHints.length]);

  const goToHint = useCallback((idx: number) => {
    if (idx === activeHintIdx) return;
    setHintSlideDir(idx > activeHintIdx ? "left" : "right");
    setActiveHintIdx(idx);
  }, [activeHintIdx]);

  const viewingHint = allUnlockedHints[activeHintIdx] ?? allUnlockedHints[allUnlockedHints.length - 1];

  useEffect(() => {
    if (!isArchiveMode) {
      persistUnlockedHints(allUnlockedHints);
    }
    dispatchHintCountUpdate(allUnlockedHints.length);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongGuessCount]);

  useEffect(() => {
    if (!playerToGuess || !currentGameId) return;
    let cancelled = false;

    let isHardRestore = false;
    if (!isArchiveMode) {
      try { isHardRestore = localStorage.getItem(LS_HARD_MODE_KEY) === "1"; } catch { /* */ }
    }

    setGuesses([]);
    setStatuses([]);
    setLetterStatus({});
    setCurrentInput("");
    setShareDismissed(false);
    setShowModal(false);
    setTimerStarted(false);
    setElapsedSeconds(0);

    // Archive mode: restore from single nested key
    if (isArchiveMode) {
      const archiveData = readArchiveDay(archiveDay!);
      if (archiveData?.guesses) {
        const loaded = parseGuessObject(
          JSON.stringify(archiveData.guesses),
          answer, playerList, puzzleAnswerFullName, false,
        );
        if (loaded) {
          const last = loaded.guesses[loaded.guesses.length - 1];
          const wasWin = isSamePlayer(last, answer, playerList, puzzleAnswerFullName, false);
          const gameDone = wasWin || loaded.guesses.length === MAX_GUESSES;
          setGuesses(loaded.guesses);
          setStatuses(loaded.statuses);
          setLetterStatus(letterStatusFromRows(loaded.guesses, loaded.statuses));
          if (gameDone && archiveData.shareDismissed) setShareDismissed(true);
          if (wasWin && last !== answer) setAliasWin(true);
        }
      }
      if (archiveData?.timerElapsed) {
        setElapsedSeconds(archiveData.timerElapsed);
        elapsedSecondsRef.current = archiveData.timerElapsed;
      }
      if (archiveData?.timerStarted) setTimerStarted(true);
      return;
    }

    // Daily / hard mode: original restore logic
    syncGameIdStorage(currentGameId, isHardRestore);

    try {
      const timerKey = isHardRestore ? LS_HARD_TIMER_ELAPSED_KEY : LS_TIMER_ELAPSED_KEY;
      const timerStartedKey = isHardRestore ? LS_HARD_TIMER_STARTED_KEY : LS_TIMER_STARTED_KEY;
      const savedElapsed = localStorage.getItem(timerKey);
      if (savedElapsed) {
        const val = parseInt(savedElapsed, 10) || 0;
        setElapsedSeconds(val);
        elapsedSecondsRef.current = val;
      }
      if (localStorage.getItem(timerStartedKey) === "1") setTimerStarted(true);
      setHardMode(isHardRestore);
    } catch { /* */ }

    function applyLoaded(loaded: { guesses: string[]; statuses: string[][] }, isHard: boolean) {
      const last = loaded.guesses[loaded.guesses.length - 1];
      const wasStoredWin = isSamePlayer(last, answer, playerList, puzzleAnswerFullName, isHard);
      const gameDone = wasStoredWin || loaded.guesses.length === MAX_GUESSES;
      const dismissedShare = gameDone && readShareDismissedForPuzzle(currentGameId, isHard);
      setGuesses(loaded.guesses);
      setStatuses(loaded.statuses);
      setLetterStatus(letterStatusFromRows(loaded.guesses, loaded.statuses));
      if (dismissedShare) setShareDismissed(true);
      if (wasStoredWin && last !== answer) setAliasWin(true);
    }

    const local = readStoredGuesses(currentGameId, answer, playerList, puzzleAnswerFullName, isHardRestore);
    const localCompleted = isLocalGameCompleted(currentGameId, isHardRestore);

    if (!isLoggedIn()) {
      if (local) applyLoaded(local, isHardRestore);
      return;
    }

    function pushLocalToDb() {
      const progress = readCurrentGameProgress(isHardRestore, Number(currentGameId));
      if (progress) {
        progress.elapsed_seconds = elapsedSecondsRef.current;
        saveGameProgress(progress).catch(() => {});
      }
    }

    fetchGameProgress(Number(currentGameId), isHardRestore).then((remote) => {
      if (cancelled) return;

      const dbFound = remote.found && !!remote.guesses_json;
      const dbCompleted = remote.completed === true;

      if (!dbFound) {
        if (local) {
          applyLoaded(local, isHardRestore);
          pushLocalToDb();
        }
        return;
      }

      const dbParsed = parseGuessObject(remote.guesses_json!, answer, playerList, puzzleAnswerFullName, isHardRestore);
      const dbGuessCount = dbParsed?.guesses.length ?? 0;
      const localGuessCount = local?.guesses.length ?? 0;

      if (dbCompleted) {
        if (dbParsed) {
          try { writeRemoteToLocalStorage(remote, currentGameId, isHardRestore, setElapsedSeconds, elapsedSecondsRef, setTimerStarted); } catch { /* */ }
          applyLoaded(dbParsed, isHardRestore);
          return;
        }
        if (local) {
          applyLoaded(local, isHardRestore);
          pushLocalToDb();
        }
        return;
      }

      if (localCompleted && local) {
        applyLoaded(local, isHardRestore);
        pushLocalToDb();
        return;
      }

      if (local && localGuessCount >= dbGuessCount) {
        applyLoaded(local, isHardRestore);
        if (localGuessCount > dbGuessCount) pushLocalToDb();
      } else if (dbParsed) {
        try { writeRemoteToLocalStorage(remote, currentGameId, isHardRestore, setElapsedSeconds, elapsedSecondsRef, setTimerStarted); } catch { /* */ }
        applyLoaded(dbParsed, isHardRestore);
      }
    }).catch(() => {
      if (local) applyLoaded(local, isHardRestore);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerToGuess, currentGameId, answer, playerList, puzzleAnswerFullName, authVersion]);

  useEffect(() => {
    if (!timerStarted || gameOver) return;
    const id = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        elapsedSecondsRef.current = next;
        if (isArchiveModeRef.current && archiveDayRef.current) {
          patchArchiveDay(archiveDayRef.current, { timerElapsed: next });
        } else {
          const timerKey = hardModeRef.current ? LS_HARD_TIMER_ELAPSED_KEY : LS_TIMER_ELAPSED_KEY;
          try { localStorage.setItem(timerKey, String(next)); } catch { /* */ }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerStarted, gameOver]);

  const NUDGE_IDLE_MS = 45_000;

  const resetNudgeTimer = useCallback(() => {
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    nudgeTimerRef.current = null;
    setShowNudge(false);
  }, []);

  const startNudgeTimer = useCallback(() => {
    if (nudgeShownRef.current || gameOver) return;
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    nudgeTimerRef.current = setTimeout(() => {
      if (!nudgeShownRef.current) {
        setShowNudge(true);
        nudgeShownRef.current = true;
      }
    }, NUDGE_IDLE_MS);
  }, [gameOver]);

  useEffect(() => {
    if (!timerStarted || gameOver) {
      resetNudgeTimer();
      return;
    }
    startNudgeTimer();
    return () => { if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current); };
  }, [timerStarted, gameOver, guesses.length, startNudgeTimer, resetNudgeTimer]);

  // Per-tile flip sequencer
  // Uses refs for answer/playerList/puzzleAnswerFullName/currentGameId/hardMode
  // so async data fetches don't re-trigger (and cancel) the flip mid-animation.
  useEffect(() => {
    if (currentFlipCol < 0 || flippingRow === null) return;

    const timer = setTimeout(() => {
      setDoneFlipCols(prev => new Set([...prev, currentFlipCol]));

      if (currentFlipCol < WORD_LENGTH - 1) {
        setCurrentFlipCol(currentFlipCol + 1);
      } else {
        const guess    = flippingGuess;
        const completedRowIndex = flippingRow ?? 0;
        const ans = answerRef.current;
        const pl = playerListRef.current;
        const fullName = puzzleAnswerFullNameRef.current;
        const gameId = currentGameIdRef.current;
        const isHard = hardModeRef.current;

        const isArchive = isArchiveModeRef.current;
        const archiveDayVal = archiveDayRef.current;

        // Persist guess to archive localStorage or daily localStorage
        if (isArchive && archiveDayVal) {
          const existing = readArchiveDay(archiveDayVal);
          const prevGuesses = existing?.guesses ?? {};
          prevGuesses[String(completedRowIndex + 1)] = guess;
          patchArchiveDay(archiveDayVal, { guesses: prevGuesses, timerStarted: true });
        } else {
          persistGuess(gameId, completedRowIndex + 1, guess, ans, pl, fullName, isHard);
        }

        if (!isArchive && isLoggedIn()) {
          const progress = readCurrentGameProgress(isHard, Number(gameId));
          if (progress) {
            progress.elapsed_seconds = elapsedSecondsRef.current;
            saveGameProgress(progress).catch(() => {});
          }
        }

        const justWon = isSamePlayer(guess, ans, pl, fullName, isHard);
        const isAlias = justWon && guess !== ans;
        const rowStats = isAlias
          ? Array(WORD_LENGTH).fill("correct") as string[]
          : flippingStatuses;

        if (isAlias) setAliasWin(true);

        setGuesses(prev => [...prev, guess]);
        setStatuses(prev => [...prev, rowStats]);
        setLetterStatus(prev => {
          const next = { ...prev };
          guess.split("").forEach((letter, i) => {
            const s = rowStats[i];
            if (!next[letter] || STATUS_PRIORITY[s] > STATUS_PRIORITY[next[letter]]) {
              next[letter] = s;
            }
          });
          return next;
        });

        setFlippingRow(null);
        setFlippingGuess("");
        setFlippingStatuses([]);
        setCurrentFlipCol(-1);
        setDoneFlipCols(new Set());

        const justLost = !justWon && completedRowIndex + 1 === MAX_GUESSES;
        if (justWon || justLost) {
          if (isArchive && archiveDayVal) {
            // Archive: mark finished in localStorage, post to backend
            patchArchiveDay(archiveDayVal, {
              puzzleId: gameId,
              won: justWon,
              timerElapsed: elapsedSecondsRef.current,
            });
            if (isLoggedIn()) {
              postArchiveResult(archiveDayVal, justWon).catch(() => {});
            }
          } else {
            // Daily / hard: full stats, streaks, leaderboards
            setStats(recordGameResult(justWon, gameId, isHard));

            const payload: GameResultPayload = {
              puzzle_day: Number(gameId),
              won: justWon,
              num_guesses: completedRowIndex + 1,
              time_seconds: elapsedSecondsRef.current,
              hints_used: allUnlockedHintsRef.current.length,
              hard_mode: isHard || undefined,
            };
            setLastGameResult(payload);
            saveGameToHistory(payload);

            incrementLiveStats(payload.puzzle_day, payload.won, payload.num_guesses, isHard || undefined).catch(() => {});
            if (isLoggedIn()) {
              if (isHard) {
                postHardModeResult(payload).then(() => {
                  setLbInvalidateKey(k => k + 1);
                  if (justWon) {
                    setGodmodeColorFlood(true);
                    setShowGodmodeUnlock(true);
                  }
                }).catch(() => {
                  setLbInvalidateKey(k => k + 1);
                  if (justWon) {
                    setGodmodeColorFlood(true);
                    setShowGodmodeUnlock(true);
                  }
                });
              } else {
                postGameResult(payload).then((result) => {
                  if (result?.todayRank) setTodayRank(result.todayRank);
                  setLbInvalidateKey(k => k + 1);
                }).catch(() => {});
              }
            }

            if (isHard && justWon && !isLoggedIn()) {
              setShowGodmodeUnlock(true);
            }
          }
        }

        if (justWon && !prefersReducedMotion()) {
          setWinBounceRow(completedRowIndex);
        }
      }
    }, FLIP_DURATION + FLIP_STAGGER);

    return () => clearTimeout(timer);
  }, [
    currentFlipCol,
    flippingRow,
    flippingGuess,
    flippingStatuses,
  ]);

  // Clear win bounce class after animation completes
  useEffect(() => {
    if (winBounceRow === null) return;
    const clearDelay =
      (WORD_LENGTH - 1) * WIN_BOUNCE_STAGGER_MS + WIN_BOUNCE_DURATION_MS;
    const t = window.setTimeout(() => setWinBounceRow(null), clearDelay);
    return () => clearTimeout(t);
  }, [winBounceRow]);

  // Show accuracy badge overlay briefly after game ends
  useEffect(() => {
    if (allAnimationsComplete) {
      setShowBadge(true);
      const t = setTimeout(() => setShowBadge(false), 3000);
      return () => clearTimeout(t);
    }
  }, [allAnimationsComplete]);

  // Show modal after game ends (slight delay so all animations finish); not if share already dismissed (e.g. reload) or settings open (mode switch)
  useEffect(() => {
    if (allAnimationsComplete && !shareDismissed && !showSettings) {
      const t = setTimeout(() => setShowModal(true), 1800);
      return () => clearTimeout(t);
    }
  }, [allAnimationsComplete, shareDismissed, showSettings]);

  useEffect(() => {
    if (!showModal) return;
    let cancelled = false;
    const mode = hardMode ? "hard" : "normal";
    const modeCounters = readModeStats(mode);
    const localStreaks = readStreaks(mode);
    const fallback = readStats();
    const merged: GameStats = {
      gamesPlayed: modeCounters.gamesPlayed || fallback.gamesPlayed,
      gamesWon: modeCounters.gamesWon || fallback.gamesWon,
      currentStreak: localStreaks.currentStreak,
      maxStreak: localStreaks.maxStreak,
    };
    setStats(merged);

    if (isLoggedIn()) {
      const fetcher = hardMode ? fetchMyHardModeStats : fetchMyStats;
      fetcher().then((server) => {
        if (cancelled || !server) return;
        setStats({
          gamesPlayed: Math.max(merged.gamesPlayed, server.gamesPlayed),
          gamesWon: Math.max(merged.gamesWon, server.gamesWon),
          currentStreak: server.currentStreak,
          maxStreak: Math.max(merged.maxStreak, server.maxStreak),
        });
        if (server.todayRank) setTodayRank(server.todayRank);
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [showModal, hardMode]);

  const handleKey = useCallback((key: string) => {
    if (inputLocked || isAnimating || gameOver) return;

    if (key === "Enter") {
      if (currentInput.length !== WORD_LENGTH) {
        setMessage("Not enough letters");
        setShaking(true);
        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = setTimeout(() => { setShaking(false); setMessage(""); }, 600);
        return;
      }
      if (currentInput !== answer && !validGuesses.includes(currentInput)) {
        setMessage("Not a valid cricketer name");
        setShaking(true);
        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = setTimeout(() => { setShaking(false); setMessage(""); }, 600);
        return;
      }

      const isAliasGuess = currentInput !== answer && isSamePlayer(currentInput, answer, playerList, puzzleAnswerFullName, hardMode);
      const rowStatuses = isAliasGuess
        ? Array(WORD_LENGTH).fill("correct") as string[]
        : getLetterStatuses(currentInput, answer);
      const rowIndex    = guesses.length;

      setFlippingRow(rowIndex);
      setFlippingGuess(currentInput);
      setFlippingStatuses(rowStatuses);
      setDoneFlipCols(new Set());
      setCurrentFlipCol(0);
      setCurrentInput("");

    } else if (key === "Backspace") {
      setCurrentInput(prev => prev.slice(0, -1));
    } else if (/^[a-zA-Z]$/.test(key)) {
      if (!timerStarted) {
        setTimerStarted(true);
        if (isArchiveMode && archiveDay) {
          patchArchiveDay(archiveDay, { timerStarted: true });
        } else {
          try {
            const tsKey = hardMode ? LS_HARD_TIMER_STARTED_KEY : LS_TIMER_STARTED_KEY;
            localStorage.setItem(tsKey, "1");
          } catch { /* */ }
          if (puzzleData?.day) {
            incrementGameStart(puzzleData.day, hardMode || undefined).catch(() => {});
          }
        }
      }
      setCurrentInput(prev => prev.length < WORD_LENGTH ? prev + key.toLowerCase() : prev);
    }
  }, [currentInput, guesses, isAnimating, gameOver, timerStarted, inputLocked, answer, validGuesses, playerList, puzzleAnswerFullName, hardMode, isArchiveMode, archiveDay]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if      (e.key === "Enter")     handleKey("Enter");
      else if (e.key === "Backspace") handleKey("Backspace");
      else                            handleKey(e.key);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handleKey]);

  const handleRetry = useCallback(() => {
    setRetrying(true);
    setPuzzleError(false);
    const promise = isArchiveMode
      ? fetchPuzzleByDay(archiveDay!)
      : ensureFreshPuzzle(hardMode);
    promise
      .then((fresh) => {
        setPuzzleData(fresh);
        setRetrying(false);
      })
      .catch(() => {
        setPuzzleError(true);
        setRetrying(false);
      });
  }, [hardMode, isArchiveMode, archiveDay]);

  if ((puzzleError || retrying) && !puzzleData) {
    const ghostColors = [
      ["g","y","a","a","a"],
      ["a","g","a","y","a"],
      ["a","a","g","a","y"],
      ["","","","",""],
      ["","","","",""],
      ["","","","",""],
    ];
    return (
      <div className={`game-page__content${godmodeActive && !isArchiveMode ? " godmode-theme" : ""}`}>
        <PageHeader timerDisplay="00:00" logoSrc="/stumpd-logo.png" logoAlt="Stumpd" isGodmode={godmodeActive && !isArchiveMode} godmodeHoursLeft={godmodeActive && !isArchiveMode ? godmodeHoursLeft : 0} userInitial={userInitial} hardMode={hardMode} />
        <div className="game-error">
          <div className="game-error__ghost-grid" aria-hidden="true">
            {ghostColors.map((row, ri) => (
              <div key={ri} className="game-error__ghost-row">
                {row.map((c, ci) => (
                  <div
                    key={ci}
                    className={`game-error__ghost-tile${c ? ` game-error__ghost-tile--${c}` : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="game-error__card">
            <div className="game-error__icon-wrap">
              <span className="game-error__emoji">🏏</span>
            </div>
            <h2 className="game-error__title">Clean Bowled!</h2>
            <p className="game-error__subtitle">
              Today&apos;s puzzle is taking a bit longer to load. Give it another shot!
            </p>
            <button
              type="button"
              className="game-error__retry"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? (
                <span className="game-error__retry-spinner" />
              ) : (
                "Try Again"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!puzzleData || (playersLoading && playerList.length === 0)) {
    return (
      <div className={`game-page__content${godmodeActive && !isArchiveMode ? " godmode-theme" : ""}`}>
        <PageHeader timerDisplay="00:00" logoSrc="/stumpd-logo.png" logoAlt="Stumpd" isGodmode={godmodeActive && !isArchiveMode} godmodeHoursLeft={godmodeActive && !isArchiveMode ? godmodeHoursLeft : 0} userInitial={userInitial} hardMode={hardMode} />
        <div className="game-loading">
          <div className="game-loading__spinner" />
          <p className="game-loading__text">Loading puzzle…</p>
        </div>
      </div>
    );
  }

  if (!targetPlayer && !playersLoading) {
    return (
      <div className={`game-page__content${godmodeActive && !isArchiveMode ? " godmode-theme" : ""}`}>
        <PageHeader timerDisplay="00:00" logoSrc="/stumpd-logo.png" logoAlt="Stumpd" isGodmode={godmodeActive && !isArchiveMode} godmodeHoursLeft={godmodeActive && !isArchiveMode ? godmodeHoursLeft : 0} userInitial={userInitial} hardMode={hardMode} />
        <div className="game-error">
          <div className="game-error__card">
            <div className="game-error__icon-wrap">
              <span className="game-error__emoji">🏏</span>
            </div>
            <h2 className="game-error__title">Player data unavailable</h2>
            <p className="game-error__subtitle">
              We couldn&apos;t load the player list. Please try refreshing the page.
            </p>
            <button
              type="button"
              className="game-error__retry"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const useDarkTheme = godmodeActive && !isArchiveMode;
  const activeColorMap = useDarkTheme ? GODMODE_STATUS_COLOR : STATUS_COLOR;
  const defaultKeyBg = useDarkTheme ? "#2a2e3a" : "#d3d6da";
  const defaultKeyColor = useDarkTheme ? "#e0c97f" : "#000";
  const emptyBg = useDarkTheme ? "#1e2230" : "#fff";
  const emptyBorder = useDarkTheme ? "#3d4555" : "#d3d6da";
  const emptyText = useDarkTheme ? "#e0c97f" : "#000";
  const filledBorder = useDarkTheme ? "#8b7e4a" : "#888";

  return (
    <>
      <div className={`game-page__content${useDarkTheme ? " godmode-theme" : ""}`}>
        <PageHeader timerDisplay={formatGameTimer(elapsedSeconds)} logoSrc="/stumpd-logo.png" logoAlt="Stumpd" isGodmode={useDarkTheme} godmodeHoursLeft={useDarkTheme ? godmodeHoursLeft : 0} userInitial={userInitial} hardMode={hardMode} />
        <div className={shellVpClass ? `game-shell ${shellVpClass}` : "game-shell"}>

        <div className="game-shell__top">
          {!useDarkTheme && (
            <p className="game-subtitle game-subtitle--stumpd">
              {isArchiveMode ? (
                <Link href="/archive" className="archive-subtitle-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  Archive — Day {archiveDay}
                </Link>
              ) : (
                "Guess the Cricketer"
              )}
            </p>
          )}
        </div>

        {/* Validation only — positioned out of flow so the grid does not jump */}
        <div className="game-validation-layer" aria-live="polite">
          {message ? (
            <div className="game-validation-toast">{message}</div>
          ) : null}
        </div>

        {showNudge && (
          <div className="game-nudge-backdrop" onClick={() => setShowNudge(false)}>
            <div className="game-nudge-popup" role="alert" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="game-nudge-popup__close"
                onClick={() => setShowNudge(false)}
                aria-label="Dismiss tip"
              >
                ✕
              </button>
              <p className="game-nudge-popup__icon">💡</p>
              <p className="game-nudge-popup__title">Quick tip</p>
              <p className="game-nudge-popup__text">
                Don&apos;t just wait for hints — try typing any cricketer name!
                Even a wrong guess shows you which letters are in the answer.
                That makes it way easier to figure out the right one.
              </p>
              <button
                type="button"
                className="game-nudge-popup__btn"
                onClick={() => setShowNudge(false)}
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {allAnimationsComplete && (
          <div className="game-next-timer-inline">
            {isArchiveMode ? (
              <Link href="/archive" className="archive-back-inline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                Back to Archive
              </Link>
            ) : (
              <NextPuzzleTimer />
            )}
          </div>
        )}

        <div className="game-grid-wrap">
          {showBadge && (() => {
            const badge = hardMode && won ? getGodmodeBadge(guesses.length) : getAccuracyBadge(won, guesses.length);
            return (
              <div className="game-badge-overlay" aria-live="polite">
                <span className="game-badge-overlay__emoji">{badge.emoji}</span>
                <span className="game-badge-overlay__label">{badge.label}</span>
              </div>
            );
          })()}
          <div className="game-grid">
          {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
            const isCommitted    = rowIndex < guesses.length;
            const isCurrent      = !isAnimating && rowIndex === guesses.length;
            const isThisFlipping = flippingRow === rowIndex;

            return (
              <div
                key={rowIndex}
                className={`game-grid-row${shaking && isCurrent ? " shake" : ""}`}
              >
                {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                  let letter      = "";
                  let bgColor     = emptyBg;
                  let borderColor = emptyBorder;
                  let textColor   = emptyText;
                  let tileClass   = "tile game-tile";

                  if (isCommitted) {
                    letter      = guesses[rowIndex][colIndex];
                    bgColor     = activeColorMap[statuses[rowIndex][colIndex]];
                    borderColor = bgColor;
                    textColor   = "#fff";
                    if (winBounceRow === rowIndex) {
                      tileClass = "tile game-tile game-tile--win-bounce";
                    }

                  } else if (isThisFlipping) {
                    letter = flippingGuess[colIndex] || "";

                    if (doneFlipCols.has(colIndex)) {
                      bgColor     = activeColorMap[flippingStatuses[colIndex]];
                      borderColor = bgColor;
                      textColor   = "#fff";
                    } else if (colIndex === currentFlipCol) {
                      tileClass   = "tile game-tile flipping";
                      borderColor = filledBorder;
                    } else {
                      borderColor = filledBorder;
                    }

                  } else if (isCurrent) {
                    letter      = currentInput[colIndex] || "";
                    borderColor = letter ? filledBorder : emptyBorder;
                    const isJustTyped = colIndex === currentInput.length - 1;
                    if (letter && isJustTyped) tileClass = "tile game-tile pop";
                  }

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}-${doneFlipCols.has(colIndex) && isThisFlipping ? "done" : "anim"}`}
                      className={tileClass}
                      style={{
                        borderColor,
                        backgroundColor: bgColor,
                        color: textColor,
                        "--tile-bg":     isThisFlipping && flippingStatuses[colIndex]
                                           ? activeColorMap[flippingStatuses[colIndex]] : emptyBg,
                        "--tile-border": isThisFlipping && flippingStatuses[colIndex]
                                           ? activeColorMap[flippingStatuses[colIndex]] : filledBorder,
                        ...(winBounceRow === rowIndex && isCommitted
                          ? { "--win-bounce-index": String(colIndex) }
                          : {}),
                      } as React.CSSProperties & Record<string, string>}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
          </div>
        </div>

        <div
          className={`game-hint-slot${showHintSlot ? " game-hint-slot--active" : ""}`}
          aria-live="polite"
        >
          {showHintSlot ? (
            <div
              className="game-hint-card"
              role="status"
              onTouchStart={onHintTouchStart}
              onTouchEnd={onHintTouchEnd}
            >
              {allUnlockedHints.length > 1 && (
                <button
                  type="button"
                  className="game-hint-card__arrow game-hint-card__arrow--left"
                  onClick={() => goToHint(activeHintIdx - 1)}
                  disabled={activeHintIdx === 0}
                  aria-label="Previous clue"
                >
                  <span className="game-hint-card__arrow__icon">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </span>
                </button>
              )}
              {allUnlockedHints.length > 1 && (
                <button
                  type="button"
                  className="game-hint-card__arrow game-hint-card__arrow--right"
                  onClick={() => goToHint(activeHintIdx + 1)}
                  disabled={activeHintIdx === allUnlockedHints.length - 1}
                  aria-label="Next clue"
                >
                  <span className="game-hint-card__arrow__icon">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </span>
                </button>
              )}

              <div
                key={`hint-${activeHintIdx}`}
                className={`game-hint-card__content game-hint-card__content--slide${
                  hintSlideDir === "left" ? "-left" : hintSlideDir === "right" ? "-right" : ""
                }`}
              >
                <p className="game-hint-card__label">{viewingHint.label}</p>
                <p className="game-hint-card__text">{viewingHint.text}</p>
              </div>

              <div className="game-hint-card__dots">
                {allUnlockedHints.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`game-hint-card__dot${
                      i === activeHintIdx ? " game-hint-card__dot--active" : ""
                    }`}
                    onClick={() => goToHint(i)}
                    aria-label={`Go to clue ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="game-shortname-notice" role="note">
          <div className="game-shortname-notice__pill">
            <span className="game-shortname-notice__tag">INFO</span>
            <span className="game-shortname-notice__divider" />
            <p className="game-shortname-notice__text">
              Only first 5 letters of each name
              <span className="game-shortname-notice__example">
                <strong>YUVRAJ</strong>
                <span className="game-shortname-notice__arrow">→</span>
                <strong>YUVRA</strong>
              </span>
            </p>
          </div>
        </div>
        </div>
      </div>

      {allAnimationsComplete ? (
        <div className="game-page__see-results">
          <div className={`game-result-notice${won ? " game-result-notice--won" : " game-result-notice--lost"}`} role="status">
            <p className="game-result-notice__name">
              {won ? "🎉 " : ""}<strong>{displayRevealName}</strong>
            </p>
            {aliasWin && (
              <p className="game-result-notice__alias">
                You guessed it from hints! The word was <strong>{answer.toUpperCase()}</strong>
              </p>
            )}
            {!won && (
              <p className="game-result-notice__alias">
                The word was <strong>{answer.toUpperCase()}</strong>
              </p>
            )}
          </div>
          {!isArchiveMode && (
            <button
              type="button"
              className="see-results-btn"
              onClick={() => setShowModal(true)}
            >
              See Results
            </button>
          )}
          {isArchiveMode ? (
            <Link href="/archive" className="archive-back-inline archive-back-inline--bottom">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              Back to Archive
            </Link>
          ) : (
            <ReminderPrompt variant="compact" />
          )}
        </div>
      ) : (
      <div className="game-page__keyboard">
        {/* KEYBOARD — structure aligned with NYT Wordle (row + half-key spacers on middle row) */}
        <div className="game-keyboard" role="group" aria-label="Keyboard">
          <div className="game-keyboard-row game-keyboard-row--top">
            {"qwertyuiop".split("").map(l => {
              const s  = letterStatus[l];
              const bg = s ? activeColorMap[s] : defaultKeyBg;
              return (
                <button
                  key={l}
                  type="button"
                  className="game-key"
                  onClick={() => handleKey(l)}
                  style={{ background: bg, color: s ? "#fff" : defaultKeyColor }}
                >
                  {l.toUpperCase()}
                </button>
              );
            })}
          </div>
          <div className="game-keyboard-row game-keyboard-row--middle">
            <div className="game-keyboard-spacer" aria-hidden="true" />
            {"asdfghjkl".split("").map(l => {
              const s  = letterStatus[l];
              const bg = s ? activeColorMap[s] : defaultKeyBg;
              return (
                <button
                  key={l}
                  type="button"
                  className="game-key"
                  onClick={() => handleKey(l)}
                  style={{ background: bg, color: s ? "#fff" : defaultKeyColor }}
                >
                  {l.toUpperCase()}
                </button>
              );
            })}
            <div className="game-keyboard-spacer" aria-hidden="true" />
          </div>
          <div className="game-keyboard-row game-keyboard-row--bottom">
            <button type="button" className="game-key game-key-wide" onClick={() => handleKey("Enter")} style={{ background: defaultKeyBg, color: defaultKeyColor }}>
              ENTER
            </button>
            {"zxcvbnm".split("").map(l => {
              const s  = letterStatus[l];
              const bg = s ? activeColorMap[s] : defaultKeyBg;
              return (
                <button
                  key={l}
                  type="button"
                  className="game-key"
                  onClick={() => handleKey(l)}
                  style={{ background: bg, color: s ? "#fff" : defaultKeyColor }}
                >
                  {l.toUpperCase()}
                </button>
              );
            })}
            <button type="button" className="game-key game-key-wide" onClick={() => handleKey("Backspace")} style={{ background: defaultKeyBg, color: defaultKeyColor }}>
              ⌫
            </button>
          </div>
        </div>
      </div>
      )}

      <GuessHistoryModal
        open={showHintHistory}
        onClose={() => setShowHintHistory(false)}
        hints={allUnlockedHints}
        totalHints={HINT_LADDER.length + 1}
        answerRevealed={lost && !isAnimating}
        answerDisplay={displayRevealName}
        hardMode={hardMode}
      />

      <HowToPlayModal open={showHowToPlay} onClose={dismissHowToPlay}>
        <StumpdHowToPlay />
      </HowToPlayModal>

      <WeeklyTopPlayersNotice
        open={showWeeklyNotice}
        onClose={dismissWeeklyNotice}
      />

      <FunFactNotice
        open={showFunFact}
        onClose={dismissFunFact}
        funFact={puzzleData?.funFact ?? ""}
      />

      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        puzzleDay={puzzleData?.day}
        hardModePuzzleDay={hardModePuzzleDay}
        invalidateKey={lbInvalidateKey}
        isGodmode={useDarkTheme}
      />

      <HardModeTransition
        active={hmTransition}
        originX={hmTransOrigin.x}
        originY={hmTransOrigin.y}
        onMidpoint={() => {}}
        onComplete={() => setHmTransition(false)}
      />

      <GodmodeUnlockAnimation
        show={showGodmodeUnlock}
        colorFlood={godmodeColorFlood}
        variant={godmodeReentry ? "reentry" : "unlock"}
        onFloodPeak={async () => {
          if (godmodeReentry) {
            setGodmodeActive(true);
            document.body.classList.add("body--godmode");
          } else {
            await activateGodmode();
            await refreshGodmodeState();
            document.body.classList.add("body--godmode");
          }
        }}
        onComplete={() => {
          setShowGodmodeUnlock(false);
          setGodmodeColorFlood(false);
          setGodmodeReentry(false);
          if (!godmodeReentry && !isLoggedIn()) {
            setShowGodmodeLoginPrompt(true);
          }
        }}
      />

      <GodmodeLoginPrompt
        open={showGodmodeLoginPrompt}
        onClose={() => setShowGodmodeLoginPrompt(false)}
        gameResultPayload={lastGameResult}
        onAuthSuccess={async () => {
          setShowGodmodeLoginPrompt(false);
          try { localStorage.setItem(LS_HARD_MODE_KEY, hardMode ? "1" : "0"); } catch {}
          await refreshGodmodeState();
          setAuthVersion(v => v + 1);
          fetchLiveStats().then(setLiveStats).catch(() => {});

          try { await postAllPendingResults(); } catch { /* non-critical */ }

          // Save game progress for both modes using each mode's own puzzle day
          try {
            const normalDay = localStorage.getItem(LS_GAME_ID_KEY);
            const hardDay = localStorage.getItem(LS_HARD_GAME_ID_KEY);
            if (normalDay) {
              const normalProgress = readCurrentGameProgress(false, Number(normalDay));
              if (normalProgress) saveGameProgress(normalProgress).catch(() => {});
            }
            if (hardDay) {
              const hardProgress = readCurrentGameProgress(true, Number(hardDay));
              if (hardProgress) saveGameProgress(hardProgress).catch(() => {});
            }
          } catch { /* */ }

          const fetchStats = hardMode ? fetchMyHardModeStats : fetchMyStats;
          fetchStats().then((server) => {
            if (!server) return;
            setStats(server);
            if (server.todayRank) setTodayRank(server.todayRank);
          }).catch(() => {});
          setLbInvalidateKey(k => k + 1);
          setGodmodeColorFlood(true);
          setShowGodmodeUnlock(true);
        }}
      />

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        hardMode={hardMode}
        hideHardMode={isArchiveMode}
        onToggleHardMode={(enabled: boolean, origin?: ToggleOrigin) => {
          if (guesses.length > 0 && !won && !lost) return;
          if (enabled && origin) {
            setHmTransOrigin(origin);
            setHmTransition(true);
          }
          setHardMode(enabled);
          try { localStorage.setItem(LS_HARD_MODE_KEY, enabled ? "1" : "0"); } catch { /* */ }
        }}
        canEnableHardMode={(guesses.length === 0 || gameOver) && !isArchiveMode}
        canDisableHardMode={(guesses.length === 0 || gameOver) && !isArchiveMode}
        puzzleDay={puzzleData?.day}
        onAuthChange={async () => {
          try { localStorage.setItem(LS_HARD_MODE_KEY, hardMode ? "1" : "0"); } catch {}

          setAuthVersion(v => v + 1);
          fetchLiveStats().then(setLiveStats).catch(() => {});

          const loggedIn = isLoggedIn();
          if (loggedIn) {
            try { await postAllPendingResults(); } catch { /* non-critical */ }
            await activateGodmode();
            await refreshGodmodeState({ triggerReentry: true, reentry: godmodeActive });

            try {
              const normalDay = localStorage.getItem(LS_GAME_ID_KEY);
              const hardDay = localStorage.getItem(LS_HARD_GAME_ID_KEY);
              if (normalDay) {
                const normalProgress = readCurrentGameProgress(false, Number(normalDay));
                if (normalProgress) saveGameProgress(normalProgress).catch(() => {});
              }
              if (hardDay) {
                const hardProgress = readCurrentGameProgress(true, Number(hardDay));
                if (hardProgress) saveGameProgress(hardProgress).catch(() => {});
              }
            } catch { /* */ }

            const fetchStats = hardMode ? fetchMyHardModeStats : fetchMyStats;
            fetchStats().then((server) => {
              if (!server) return;
              setStats(server);
              if (server.todayRank) setTodayRank(server.todayRank);
            }).catch(() => {});
          } else {
            setGodmodeActive(false);
          }
          setLbInvalidateKey(k => k + 1);
        }}
      />

      {/* Share modal */}
      {showModal && (
        <ShareModal
          won={won}
          answer={targetPlayer?.meta?.fullName ?? answer}
          guessCount={guesses.length}
          statuses={statuses}
          stats={stats}
          elapsedSeconds={elapsedSeconds}
          gameTitle="Stumpd"
          puzzleDay={puzzleData?.day}
          hintsUsed={allUnlockedHints.length}
          maxHints={HINT_LADDER.length + 1}
          liveStats={liveStats}
          gameResultPayload={lastGameResult}
          todayRank={todayRank}
          hardMode={hardMode}
          onAuthChange={async () => {
            // Re-assert the current mode in localStorage BEFORE bumping
            // authVersion, so the restore effect reads the correct value
            // (applyServerPrefs inside register/login may have overwritten it).
            try { localStorage.setItem(LS_HARD_MODE_KEY, hardMode ? "1" : "0"); } catch {}

            setAuthVersion(v => v + 1);
            fetchLiveStats().then(setLiveStats).catch(() => {});

            const loggedIn = isLoggedIn();
            if (loggedIn) {
              try { await postAllPendingResults(); } catch { /* non-critical */ }
              await activateGodmode();
              await refreshGodmodeState({ triggerReentry: true, reentry: godmodeActive });

              try {
                const normalDay = localStorage.getItem(LS_GAME_ID_KEY);
                const hardDay = localStorage.getItem(LS_HARD_GAME_ID_KEY);
                if (normalDay) {
                  const normalProgress = readCurrentGameProgress(false, Number(normalDay));
                  if (normalProgress) saveGameProgress(normalProgress).catch(() => {});
                }
                if (hardDay) {
                  const hardProgress = readCurrentGameProgress(true, Number(hardDay));
                  if (hardProgress) saveGameProgress(hardProgress).catch(() => {});
                }
              } catch { /* */ }

              const fetchStats = hardMode ? fetchMyHardModeStats : fetchMyStats;
              fetchStats().then((server) => {
                if (!server) return;
                setStats(server);
                if (server.todayRank) setTodayRank(server.todayRank);
              }).catch(() => {});
            } else {
              setGodmodeActive(false);
            }
            setLbInvalidateKey(k => k + 1);
          }}
          onClose={() => {
            setShowModal(false);
            setShareDismissed(true);
            if (isArchiveMode && archiveDay) {
              patchArchiveDay(archiveDay, { shareDismissed: true });
            } else {
              persistShareDismissed(currentGameId, hardMode);
            }
          }}
        />
      )}
    </>
  );
}
