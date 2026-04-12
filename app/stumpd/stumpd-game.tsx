"use client";
import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import ShareModal from "../components/share";
import HowToPlayModal from "../components/how-to-play-modal";
import GuessHistoryModal from "../components/guess-history-modal";
import StumpdHowToPlay from "./stumpd-how-to-play";
import PageHeader, { OPEN_HOW_TO_PLAY_EVENT, OPEN_HINT_HISTORY_EVENT, OPEN_LEADERBOARD_EVENT, OPEN_SETTINGS_EVENT, dispatchLeaderboardState } from "../components/page-header";
import LeaderboardModal from "../components/leaderboard-modal";
import SettingsModal from "../components/settings-modal";
import type { ToggleOrigin } from "../components/settings-modal";
import HardModeTransition from "../components/hard-mode-transition";
import { dispatchHintCountUpdate } from "../components/hint-history-open";
import { COOKIE_CONSENT_STORAGE_KEY } from "../components/cookie-banner";
import { getInitialPlayerList, fetchIplPlayersFromAPI, loadFallbackPlayers } from "./ipl-players";
import type { IplPlayerRow } from "./ipl-players";
import { fetchPuzzleToday, fetchHardModePuzzleToday } from "../services/ipl-api";
import type { PuzzleData, PuzzleHintEntry } from "../services/ipl-api";
import type { GameStats, LiveStats } from "../components/games";
import { DEFAULT_STUMPD_STATS, readStats, recordGameResult, saveGameToHistory } from "./stats-storage";
import ReminderPrompt from "../components/reminder-prompt";
import { fetchLiveStats, incrementLiveStats } from "../services/live-stats-api";
import { postGameResult, postHardModeResult, isLoggedIn, fetchMyStats, saveGameProgress, fetchGameProgress, fetchGodmodeStatus, getStoredUser } from "../services/auth-api";
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

function collectTrivias(hints: PuzzleHintEntry[]): string[] {
  const entry = hints.find((h) => h.trivia !== undefined);
  if (!entry) return [];
  const val = entry.trivia;
  return Array.isArray(val) ? (val as string[]) : [val as string];
}

/** Optional display metadata when the playable 5-letter token is an abbreviation. */
export type PlayerNameMeta = { shortened: true; fullName: string };

/** Fixed hint ladder: one hint auto-revealed per wrong guess in this order. */
const HINT_LADDER: { key: string; label: string }[] = [
  { key: "iplTeam+country", label: "IPL Team & Nationality" },
  { key: "trivia",          label: "Trivia" },
  { key: "trivia",          label: "Trivia" },
  { key: "role",            label: "Role" },
  { key: "trivia",          label: "Trivia" },
];

const LS_HOW_TO_PLAY_DISMISSED = "stumpdpuzzle_howToPlayDismissed";
const LS_HOW_TO_PLAY_SEEN = "stumpdpuzzle_howToPlaySeen";

function readReturningUserHintEligible(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) !== "accepted") return false;
    if (localStorage.getItem(LS_HOW_TO_PLAY_SEEN) === "true") return true;
    if (localStorage.getItem(LS_HOW_TO_PLAY_DISMISSED) === "1") return true;
    return false;
  } catch {
    return false;
  }
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
  if (matches.length === 0) return null;
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
const LS_HARD_SHARE_DISMISSED_PUZZLE_KEY = "stumpdpuzzle_hard_shareDismissedPuzzleId";

const GAME_STORAGE_KEYS = [
  LS_GUESS_KEY,
  LS_USER_HAS_PLAYED_KEY,
  LS_PUZZLE_ID_KEY,
  LS_SHARE_DISMISSED_PUZZLE_KEY,
  LS_UNLOCKED_HINTS_KEY,
  LS_TIMER_ELAPSED_KEY,
  LS_TIMER_STARTED_KEY,
  LS_USED_TRIVIA_KEY,
  LS_HARD_GUESS_KEY,
  LS_HARD_PUZZLE_ID_KEY,
  LS_HARD_TIMER_ELAPSED_KEY,
  LS_HARD_SHARE_DISMISSED_PUZZLE_KEY,
] as const;

/**
 * If persisted `gameId` matches `CURRENT_GAME_ID`, keep game data. Otherwise clear game-related keys
 * and persist the new id (new puzzle / first visit).
 */
function syncGameIdStorage(gameId: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(LS_GAME_ID_KEY);
    if (stored === gameId) return;
    for (const key of GAME_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    localStorage.setItem(LS_GAME_ID_KEY, gameId);
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

  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [puzzleError, setPuzzleError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [hardMode, setHardMode] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(LS_HARD_MODE_KEY) === "1";
    } catch { return false; }
  });

  useEffect(() => {
    let cancelled = false;
    const isHard = hardMode;

    Promise.all([
      ensureFreshPuzzle(isHard).catch(() => null),
      fetchLiveStats().catch(() => null),
      fetchIplPlayersFromAPI().catch(() => null),
    ]).then(async ([fresh, live, players]) => {
      if (cancelled) return;
      if (fresh) {
        setPuzzleError(false);
        setPuzzleData((prev) => {
          if (prev && prev.day === fresh.day && prev.encoded === fresh.encoded) return prev;
          return fresh;
        });
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
    let cancelled = false;
    setPuzzleData(null);
    setPuzzleError(false);
    ensureFreshPuzzle(hardMode)
      .then((fresh) => {
        if (cancelled) return;
        setPuzzleData(fresh);
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
  const [lbInvalidateKey, setLbInvalidateKey] = useState(0);
  const [shareDismissed, setShareDismissed] = useState(false);
  /** Cookie accepted + how to play seen — enables initial trivia before first guess (client-read). */
  const [returningUserHints, setReturningUserHints] = useState(false);
  const [usedTriviaIndices, setUsedTriviaIndices] = useState<number[]>([]);
  const usedTriviaIndicesRef = useRef(usedTriviaIndices);
  usedTriviaIndicesRef.current = usedTriviaIndices;
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

  const inputLocked = !puzzleData || !targetPlayer || !cookieConsentDone || !howToPlayDone || showHowToPlay || showHintHistory || showLeaderboard || showSettings || showModal;

  const answer = targetPlayer?.name.toLowerCase() ?? "";
  answerRef.current = answer;
  currentGameIdRef.current = puzzleData ? String(puzzleData.day) : "";
  puzzleAnswerFullNameRef.current = puzzleData?.fullName ?? null;
  hardModeRef.current = hardMode;
  const nameNotice =
    targetPlayer?.meta?.shortened === true && targetPlayer.meta.fullName
      ? targetPlayer.meta.fullName
      : null;

  const refreshGodmodeState = useCallback(async (opts?: { triggerReentry?: boolean }) => {
    const cachedActive = isGodmodeActive();
    setGodmodeActive(cachedActive);
    setGodmodeHoursLeft(cachedActive ? getGodmodeHoursRemaining() : 0);
    const user = getStoredUser();
    setUserInitial(user?.email ? user.email.charAt(0).toUpperCase() : "");

    let active = cachedActive;
    if (isLoggedIn()) {
      const server = await fetchGodmodeStatus();
      active = server.active;
      setGodmodeActive(server.active);
      setGodmodeHoursLeft(server.hours_remaining);
    }

    if (opts?.triggerReentry && active) {
      setGodmodeReentry(true);
      setGodmodeColorFlood(true);
      setShowGodmodeUnlock(true);
    }
  }, []);

  useEffect(() => {
    refreshGodmodeState({ triggerReentry: true });
  }, [refreshGodmodeState]);

  useLayoutEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'327401'},body:JSON.stringify({sessionId:'327401',location:'stumpd-game.tsx:useLayoutEffect-body-class',message:'body class toggle',data:{godmodeActive,showGodmodeUnlock,bodyClasses:document.body.className},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (godmodeActive && !showGodmodeUnlock) {
      document.body.classList.add("body--godmode");
    } else if (!godmodeActive) {
      document.body.classList.remove("body--godmode");
    }
    return () => { document.body.classList.remove("body--godmode"); };
  }, [godmodeActive, showGodmodeUnlock]);

  useEffect(() => {
    setReturningUserHints(readReturningUserHintEligible());
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
        setHowToPlayDone(true);
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
    setHowToPlayDone(true);
    setReturningUserHints(readReturningUserHintEligible());
  }, []);

  /** Mark how-to-play seen on cookie accept so returning-user trivia hint works. */
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
      setReturningUserHints(readReturningUserHintEligible());
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
  const allAnimationsComplete = gameOver && !isAnimating && winBounceRow === null && !showGodmodeUnlock && !showGodmodeLoginPrompt;

  const wrongGuessCount = guesses.filter((g) => !isSamePlayer(g, answer, playerList, puzzleAnswerFullName, hardMode)).length;

  const playerHints: IplHintEntry[] = puzzleData?.hints ?? [];

  const showOpeningHint = !hardMode && !!targetPlayer && guesses.length === 0;
  const showProgressiveHint = !hardMode && !!targetPlayer && wrongGuessCount >= 1 && !won && !lost && !(gameOver && shareDismissed);
  const showHintSlot = showOpeningHint || showProgressiveHint;

  const displayRevealName =
    targetPlayer?.meta?.fullName ??
    `${answer.charAt(0).toUpperCase()}${answer.slice(1).toLowerCase()}`;

  const openingHintText = String(findHint(playerHints, "openingHint") ?? "");

  /**
   * Resolve a single ladder tier's text. For trivia slots, use the stored random
   * index so refreshing the page gives the same trivia.
   */
  const resolveHintTier = useCallback((tier: number, storedTrivia: number[]): { label: string; text: string } => {
    const { key, label } = HINT_LADDER[Math.min(tier, HINT_LADDER.length - 1)];
    if (key === "trivia") {
      const trivias = collectTrivias(playerHints);
      let triviaSlotIdx = 0;
      for (let t = 0; t < tier; t++) {
        if (HINT_LADDER[t]?.key === "trivia") triviaSlotIdx++;
      }
      const idx = storedTrivia[triviaSlotIdx];
      return { label, text: idx != null && trivias[idx] ? trivias[idx] : "" };
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

  /** Pick a random trivia index (not yet used) and persist it. */
  const pickAndStoreTriviaIndex = useCallback((currentUsed: number[]): number[] => {
    const trivias = collectTrivias(playerHints);
    const available = trivias.map((_, i) => i).filter(i => !currentUsed.includes(i));
    if (available.length === 0) return currentUsed;
    const randomIdx = available[Math.floor(Math.random() * available.length)];
    const next = [...currentUsed, randomIdx];
    setUsedTriviaIndices(next);
    try { localStorage.setItem(LS_USED_TRIVIA_KEY, JSON.stringify(next)); } catch { /* */ }
    return next;
  }, [playerHints]);

  /** Auto-pick trivia indices when wrongGuessCount grows into a trivia tier. */
  useEffect(() => {
    if (wrongGuessCount === 0) return;
    let needed = 0;
    for (let t = 0; t < Math.min(wrongGuessCount, HINT_LADDER.length); t++) {
      if (HINT_LADDER[t].key === "trivia") needed++;
    }
    if (needed <= usedTriviaIndicesRef.current.length) return;
    let current = [...usedTriviaIndicesRef.current];
    while (current.length < needed) {
      const next = pickAndStoreTriviaIndex(current);
      if (next.length === current.length) break;
      current = next;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongGuessCount]);

  const allUnlockedHints: { label: string; text: string }[] = hardMode
    ? []
    : [{ label: "Opening Clue", text: openingHintText }];
  if (!hardMode) {
    for (let i = 1; i <= wrongGuessCount; i++) {
      allUnlockedHints.push(resolveHintTier(i - 1, usedTriviaIndices));
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
    persistUnlockedHints(allUnlockedHints);
    dispatchHintCountUpdate(allUnlockedHints.length);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongGuessCount]);

  useEffect(() => {
    if (!playerToGuess || !currentGameId) return;
    let cancelled = false;
    syncGameIdStorage(currentGameId);

    // Reset React state first — prevents stale guesses from a previous puzzle
    setGuesses([]);
    setStatuses([]);
    setLetterStatus({});
    setCurrentInput("");
    setShareDismissed(false);
    setShowModal(false);
    setTimerStarted(false);
    setElapsedSeconds(0);
    setUsedTriviaIndices([]);

    let isHardRestore = false;
    try {
      isHardRestore = localStorage.getItem(LS_HARD_MODE_KEY) === "1";
      const timerKey = isHardRestore ? LS_HARD_TIMER_ELAPSED_KEY : LS_TIMER_ELAPSED_KEY;
      const savedElapsed = localStorage.getItem(timerKey);
      if (savedElapsed) {
        const val = parseInt(savedElapsed, 10) || 0;
        setElapsedSeconds(val);
        elapsedSecondsRef.current = val;
      }
      if (localStorage.getItem(LS_TIMER_STARTED_KEY) === "1") setTimerStarted(true);
      const savedTrivia = localStorage.getItem(LS_USED_TRIVIA_KEY);
      if (savedTrivia) setUsedTriviaIndices(JSON.parse(savedTrivia));
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

    const loaded = readStoredGuesses(currentGameId, answer, playerList, puzzleAnswerFullName, isHardRestore);
    if (loaded) {
      applyLoaded(loaded, isHardRestore);
      return;
    }

    if (!isLoggedIn()) return;

    fetchGameProgress(Number(currentGameId), isHardRestore).then((remote) => {
      if (cancelled) return;
      if (!remote.found || !remote.guesses_json) return;

      const guessKey = isHardRestore ? LS_HARD_GUESS_KEY : LS_GUESS_KEY;
      const puzzleIdKey = isHardRestore ? LS_HARD_PUZZLE_ID_KEY : LS_PUZZLE_ID_KEY;
      const timerKey = isHardRestore ? LS_HARD_TIMER_ELAPSED_KEY : LS_TIMER_ELAPSED_KEY;

      try {
        localStorage.setItem(LS_USER_HAS_PLAYED_KEY, LS_USER_HAS_PLAYED_VALUE);
        localStorage.setItem(guessKey, remote.guesses_json);
        if (remote.completed) localStorage.setItem(puzzleIdKey, currentGameId);
        if (remote.elapsed_seconds) {
          localStorage.setItem(timerKey, String(remote.elapsed_seconds));
          setElapsedSeconds(remote.elapsed_seconds);
          elapsedSecondsRef.current = remote.elapsed_seconds;
        }
        if (!isHardRestore && remote.hints_used != null && remote.hints_used > 0) {
          localStorage.setItem(LS_UNLOCKED_HINTS_KEY, JSON.stringify(Array(remote.hints_used).fill({})));
        }
        if (!isHardRestore && remote.used_trivia_json) {
          localStorage.setItem(LS_USED_TRIVIA_KEY, remote.used_trivia_json);
          try { setUsedTriviaIndices(JSON.parse(remote.used_trivia_json)); } catch { /* */ }
        }
      } catch { /* quota / private mode */ }

      const parsed = parseGuessObject(remote.guesses_json, answer, playerList, puzzleAnswerFullName, isHardRestore);
      if (parsed) applyLoaded(parsed, isHardRestore);
    }).catch(() => { /* network failure — localStorage-only fallback is fine */ });

    return () => { cancelled = true; };
  }, [playerToGuess, currentGameId, answer, playerList, puzzleAnswerFullName]);

  useEffect(() => {
    if (!timerStarted || gameOver) return;
    const id = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        elapsedSecondsRef.current = next;
        const timerKey = hardModeRef.current ? LS_HARD_TIMER_ELAPSED_KEY : LS_TIMER_ELAPSED_KEY;
        try { localStorage.setItem(timerKey, String(next)); } catch { /* */ }
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

        persistGuess(gameId, completedRowIndex + 1, guess, ans, pl, fullName, isHard);

        if (isLoggedIn()) {
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

        // #region agent log
        fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a96fb2'},body:JSON.stringify({sessionId:'a96fb2',location:'stumpd-game.tsx:flip-complete',message:'flip animation completed',data:{guess,justWon,completedRowIndex,isHard,loggedIn:isLoggedIn()},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
        // #endregion

        const justLost = !justWon && completedRowIndex + 1 === MAX_GUESSES;
        if (justWon || justLost) {
          setStats(recordGameResult(justWon, gameId));

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
              postHardModeResult(payload).catch(() => {});
              setLbInvalidateKey(k => k + 1);
            } else {
              postGameResult(payload).then((result) => {
                if (result?.todayRank) setTodayRank(result.todayRank);
                setLbInvalidateKey(k => k + 1);
              }).catch(() => {});
            }
          }

          if (isHard && justWon) {
            // #region agent log
            fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a96fb2'},body:JSON.stringify({sessionId:'a96fb2',location:'stumpd-game.tsx:hardmode-win-branch',message:'hard mode win detected',data:{isHard,justWon,loggedIn:isLoggedIn()},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            if (isLoggedIn()) {
              setGodmodeColorFlood(true);
            }
            setShowGodmodeUnlock(true);
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
    const local = readStats();
    setStats(local);

    if (isLoggedIn()) {
      fetchMyStats().then((server) => {
        if (cancelled || !server) return;
        setStats({
          gamesPlayed: Math.max(local.gamesPlayed, server.gamesPlayed),
          gamesWon: Math.max(local.gamesWon, server.gamesWon),
          currentStreak: Math.max(local.currentStreak, server.currentStreak),
          maxStreak: Math.max(local.maxStreak, server.maxStreak),
        });
        if (server.todayRank) setTodayRank(server.todayRank);
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [showModal]);

  const handleKey = useCallback((key: string) => {
    // #region agent log
    if (key === "Enter" || key.length === 1) { fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a96fb2'},body:JSON.stringify({sessionId:'a96fb2',location:'stumpd-game.tsx:handleKey',message:'handleKey called',data:{key,inputLocked,isAnimating,gameOver,guessCount:guesses.length,flippingRow:flippingRow!==null,puzzleDataExists:!!puzzleData,targetPlayerExists:!!targetPlayer,showModal,showSettings,showHowToPlay,showHintHistory,showLeaderboard},timestamp:Date.now(),hypothesisId:'A-B-C-D'})}).catch(()=>{}); }
    // #endregion
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
        try { localStorage.setItem(LS_TIMER_STARTED_KEY, "1"); } catch { /* */ }
      }
      setCurrentInput(prev => prev.length < WORD_LENGTH ? prev + key.toLowerCase() : prev);
    }
  }, [currentInput, guesses, isAnimating, gameOver, timerStarted, inputLocked, answer, validGuesses, playerList, puzzleAnswerFullName]);

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
    ensureFreshPuzzle(hardMode)
      .then((fresh) => {
        setPuzzleData(fresh);
        setRetrying(false);
      })
      .catch(() => {
        setPuzzleError(true);
        setRetrying(false);
      });
  }, []);

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
      <div className={`game-page__content${godmodeActive ? " godmode-theme" : ""}`}>
        <PageHeader timerDisplay="00:00" logoSrc="/stumpd-logo.png" logoAlt="Stumpd" isGodmode={godmodeActive} godmodeHoursLeft={godmodeHoursLeft} userInitial={userInitial} />
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
      <div className={`game-page__content${godmodeActive ? " godmode-theme" : ""}`}>
        <PageHeader timerDisplay="00:00" logoSrc="/stumpd-logo.png" logoAlt="Stumpd" isGodmode={godmodeActive} godmodeHoursLeft={godmodeHoursLeft} userInitial={userInitial} />
        <div className="game-loading">
          <div className="game-loading__spinner" />
          <p className="game-loading__text">Loading puzzle…</p>
        </div>
      </div>
    );
  }

  if (!targetPlayer && !playersLoading) {
    return (
      <div className={`game-page__content${godmodeActive ? " godmode-theme" : ""}`}>
        <PageHeader timerDisplay="00:00" logoSrc="/stumpd-logo.png" logoAlt="Stumpd" isGodmode={godmodeActive} godmodeHoursLeft={godmodeHoursLeft} userInitial={userInitial} />
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

  const useDarkTheme = godmodeActive;
  // #region agent log
  if (typeof window !== 'undefined') fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'327401'},body:JSON.stringify({sessionId:'327401',location:'stumpd-game.tsx:render-useDarkTheme',message:'render pass',data:{useDarkTheme,godmodeActive},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
  // #endregion
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
        <PageHeader timerDisplay={formatGameTimer(elapsedSeconds)} logoSrc="/stumpd-logo.png" logoAlt="Stumpd" isGodmode={godmodeActive} godmodeHoursLeft={godmodeHoursLeft} userInitial={userInitial} />
        <div className={shellVpClass ? `game-shell ${shellVpClass}` : "game-shell"}>

        <div className="game-shell__top">
          <p className="game-subtitle game-subtitle--stumpd">Guess the Cricketer</p>
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
            <NextPuzzleTimer />
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

      {/* #region agent log */}
      {guesses.length >= 2 && (() => { fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a96fb2'},body:JSON.stringify({sessionId:'a96fb2',location:'stumpd-game.tsx:render-keyboard-decision',message:'render branch at 2+ guesses',data:{gameOver,isAnimating,won,lost,guessCount:guesses.length,showsKeyboard:!(gameOver&&!isAnimating)},timestamp:Date.now(),hypothesisId:'F'})}).catch(()=>{}); return null; })()}
      {/* #endregion */}
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
          <button
            type="button"
            className="see-results-btn"
            onClick={() => setShowModal(true)}
          >
            See Results
          </button>
          <ReminderPrompt variant="compact" />
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

      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        puzzleDay={puzzleData?.day}
        invalidateKey={lbInvalidateKey}
        isGodmode={godmodeActive}
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
          await refreshGodmodeState();
          setGodmodeColorFlood(true);
          setShowGodmodeUnlock(true);
        }}
      />

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        hardMode={hardMode}
        onToggleHardMode={(enabled: boolean, origin?: ToggleOrigin) => {
          if (guesses.length > 0 && !won && !lost) return;
          if (enabled && origin) {
            setHmTransOrigin(origin);
            setHmTransition(true);
          }
          setHardMode(enabled);
          try { localStorage.setItem(LS_HARD_MODE_KEY, enabled ? "1" : "0"); } catch { /* */ }
        }}
        canEnableHardMode={guesses.length === 0 || gameOver}
        canDisableHardMode={guesses.length === 0 || gameOver}
        puzzleDay={puzzleData?.day}
        onAuthChange={async () => {
          await refreshGodmodeState({ triggerReentry: isLoggedIn() });
          fetchLiveStats().then(setLiveStats).catch(() => {});
          if (puzzleData?.day) {
            const progress = readCurrentGameProgress(hardMode, puzzleData.day);
            if (progress) {
              progress.elapsed_seconds = elapsedSecondsRef.current;
              saveGameProgress(progress).catch(() => {});
            }
          }
          const local = readStats();
          fetchMyStats().then((server) => {
            if (!server) return;
            setStats({
              gamesPlayed: Math.max(local.gamesPlayed, server.gamesPlayed),
              gamesWon: Math.max(local.gamesWon, server.gamesWon),
              currentStreak: Math.max(local.currentStreak, server.currentStreak),
              maxStreak: Math.max(local.maxStreak, server.maxStreak),
            });
            if (server.todayRank) setTodayRank(server.todayRank);
          }).catch(() => {});
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
            await refreshGodmodeState({ triggerReentry: isLoggedIn() });
            fetchLiveStats().then(setLiveStats).catch(() => {});
            if (puzzleData?.day) {
              const progress = readCurrentGameProgress(hardMode, puzzleData.day);
              if (progress) {
                progress.elapsed_seconds = elapsedSecondsRef.current;
                saveGameProgress(progress).catch(() => {});
              }
            }

            if (lastGameResult) {
              try {
                if (hardMode) {
                  await postHardModeResult(lastGameResult);
                  setLbInvalidateKey(k => k + 1);
                } else {
                  const result = await postGameResult(lastGameResult);
                  if (result?.todayRank) setTodayRank(result.todayRank);
                  setLbInvalidateKey(k => k + 1);
                }
              } catch { /* non-critical */ }
            }

            const local = readStats();
            fetchMyStats().then((server) => {
              if (!server) return;
              setStats({
                gamesPlayed: Math.max(local.gamesPlayed, server.gamesPlayed),
                gamesWon: Math.max(local.gamesWon, server.gamesWon),
                currentStreak: Math.max(local.currentStreak, server.currentStreak),
                maxStreak: Math.max(local.maxStreak, server.maxStreak),
              });
              if (server.todayRank) setTodayRank(server.todayRank);
            }).catch(() => {});
          }}
          onClose={() => {
            setShowModal(false);
            setShareDismissed(true);
            persistShareDismissed(currentGameId, hardMode);
          }}
        />
      )}
    </>
  );
}
