"use client";
import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import ShareModal from "../components/share";
import HowToPlayModal from "../components/how-to-play-modal";
import GuessHistoryModal from "../components/guess-history-modal";
import StumpdHowToPlay from "./stumpd-how-to-play";
import PageHeader, { OPEN_HOW_TO_PLAY_EVENT, OPEN_HINT_HISTORY_EVENT } from "../components/page-header";
import { dispatchHintCountUpdate } from "../components/hint-history-open";
import { COOKIE_CONSENT_STORAGE_KEY } from "../components/cookie-banner";
import NextPuzzleTimer from "../components/timers";
import { iplPlayers, fetchIplPlayersFromAPI } from "./ipl-players";
import type { IplPlayerRow } from "./ipl-players";
import { fetchPuzzleToday } from "../services/ipl-api";
import type { PuzzleData, PuzzleHintEntry } from "../services/ipl-api";
import type { GameStats } from "../components/games";
import { DEFAULT_STUMPD_STATS, readStats, recordGameResult } from "./stats-storage";
import ReminderPrompt from "../components/reminder-prompt";

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
): boolean {
  if (guess === answer) return true;
  const gp = resolvePlayerByName(guess, playerList, null);
  const ap = resolvePlayerByName(answer, playerList, answerFullName ?? null);
  if (!gp || !ap) return false;
  return !!gp.meta.fullName && gp.meta.fullName === ap.meta.fullName;
}

const MAX_GUESSES  = 6;
const WORD_LENGTH  = 5;

const ENCODE_KEY = "fw26k";

function xorDecode(encoded: string, key: string): string {
  const raw = atob(encoded);
  let result = "";
  for (let i = 0; i < raw.length; i++) {
    result += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

const LS_PUZZLE_CACHE_KEY = "stumpdpuzzle_cache";

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

function readCachedPuzzle(): PuzzleData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_PUZZLE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PuzzleData;
  } catch {
    return null;
  }
}

function cachePuzzle(data: PuzzleData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_PUZZLE_CACHE_KEY, JSON.stringify(data));
  } catch { /* quota / private mode */ }
}

async function ensureFreshPuzzle(): Promise<PuzzleData> {
  try {
    return await fetchPuzzleToday();
  } catch {
    const cached = readCachedPuzzle();
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

const GAME_STORAGE_KEYS = [
  LS_GUESS_KEY,
  LS_USER_HAS_PLAYED_KEY,
  LS_PUZZLE_ID_KEY,
  LS_SHARE_DISMISSED_PUZZLE_KEY,
  LS_UNLOCKED_HINTS_KEY,
  LS_TIMER_ELAPSED_KEY,
  LS_TIMER_STARTED_KEY,
  LS_USED_TRIVIA_KEY,
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

function persistShareDismissed(puzzleId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_SHARE_DISMISSED_PUZZLE_KEY, puzzleId);
  } catch {
    /* quota / private mode */
  }
}

function readShareDismissedForPuzzle(puzzleId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LS_SHARE_DISMISSED_PUZZLE_KEY) === puzzleId;
  } catch {
    return false;
  }
}

function parseGuessObject(
  raw: string,
  targetAnswer: string,
  playerList: IplPlayerRow[],
  answerFullName: string | null,
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
    const isAlias = g !== targetAnswer && isSamePlayer(g, targetAnswer, playerList, answerFullName);
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
): { guesses: string[]; statuses: string[][] } | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem(LS_USER_HAS_PLAYED_KEY) !== "yes") return null;
    const storedPuzzleId = localStorage.getItem(LS_PUZZLE_ID_KEY);
    if (storedPuzzleId != null && storedPuzzleId !== "") {
      if (storedPuzzleId !== puzzleId) return null;
    }
    const raw = localStorage.getItem(LS_GUESS_KEY);
    if (!raw) return null;
    return parseGuessObject(raw, targetAnswer, playerList, answerFullName);
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
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_USER_HAS_PLAYED_KEY, LS_USER_HAS_PLAYED_VALUE);
    const prevPuzzle = localStorage.getItem(LS_PUZZLE_ID_KEY);
    const prevEmpty = prevPuzzle === null || prevPuzzle === "";
    const shouldMerge = prevEmpty || prevPuzzle === puzzleId;
    let obj: Record<string, string> = {};
    if (shouldMerge) {
      const existing = localStorage.getItem(LS_GUESS_KEY);
      if (existing) obj = { ...JSON.parse(existing) as Record<string, string> };
    }
    obj[String(guessIndex1Based)] = word;
    localStorage.setItem(LS_GUESS_KEY, JSON.stringify(obj));
    const won = isSamePlayer(word, targetAnswer, playerList, answerFullName);
    const gameOver = won || guessIndex1Based === MAX_GUESSES;
    if (gameOver) {
      localStorage.setItem(LS_PUZZLE_ID_KEY, puzzleId);
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
      if (!next[letter] || STATUS_PRIORITY[s] > STATUS_PRIORITY[next[letter]]) {
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

  useEffect(() => {
    const cached = readCachedPuzzle();
    if (cached?.setAt && !isPuzzleBeforeTodayCutoff(cached.setAt)) setPuzzleData(cached);

    ensureFreshPuzzle()
      .then((fresh) => {
        cachePuzzle(fresh);
        setPuzzleData((prev) => {
          if (prev && prev.day === fresh.day) return prev;
          return fresh;
        });
      })
      .catch(() => {});
  }, []);

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
  const [shareDismissed, setShareDismissed] = useState(false);
  /** Cookie accepted + how to play seen — enables initial trivia before first guess (client-read). */
  const [returningUserHints, setReturningUserHints] = useState(false);
  const [usedTriviaIndices, setUsedTriviaIndices] = useState<number[]>([]);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STUMPD_STATS);
  const [timerStarted, setTimerStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cookieConsentDone, setCookieConsentDone] = useState(false);
  const [howToPlayDone, setHowToPlayDone] = useState(false);
  const [aliasWin, setAliasWin] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nudgeShownRef = useRef(false);

  const [playerList, setPlayerList] = useState<IplPlayerRow[]>(iplPlayers);

  useEffect(() => {
    fetchIplPlayersFromAPI()
      .then((data) => {
        if (data) setPlayerList(data);
      })
      .catch(() => {});
  }, []);

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

  const inputLocked = !puzzleData || !targetPlayer || !cookieConsentDone || !howToPlayDone;

  const answer = targetPlayer?.name.toLowerCase() ?? "";
  const nameNotice =
    targetPlayer?.meta?.shortened === true && targetPlayer.meta.fullName
      ? targetPlayer.meta.fullName
      : null;

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
              setTimeout(() => setShowHowToPlay(true), 450);
            }
          } catch { /* */ }
        }
      }
      if (detail !== "accepted") return;
      try { localStorage.setItem(LS_HOW_TO_PLAY_SEEN, "true"); } catch { /* */ }
      setReturningUserHints(readReturningUserHintEligible());
    };
    window.addEventListener("cookie-consent", onCookieConsent);
    return () => window.removeEventListener("cookie-consent", onCookieConsent);
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

  // Animation state
  const [flippingRow,      setFlippingRow]      = useState<number | null>(null);
  const [flippingGuess,    setFlippingGuess]    = useState("");
  const [flippingStatuses, setFlippingStatuses] = useState<string[]>([]);
  const [currentFlipCol,   setCurrentFlipCol]   = useState(-1);
  const [doneFlipCols,     setDoneFlipCols]     = useState<Set<number>>(new Set());
  /** Row index (0-based) whose committed tiles play the win bounce; cleared after toast exits */
  const [winBounceRow, setWinBounceRow] = useState<number | null>(null);

  const isAnimating = flippingRow !== null;
  const won      = guesses.length > 0 && isSamePlayer(guesses[guesses.length - 1], answer, playerList, puzzleAnswerFullName);
  const lost     = !won && guesses.length === MAX_GUESSES;
  const gameOver = won || lost;

  const wrongGuessCount = guesses.filter((g) => !isSamePlayer(g, answer, playerList, puzzleAnswerFullName)).length;

  const playerHints: IplHintEntry[] = puzzleData?.hints ?? [];

  const showOpeningHint = !!targetPlayer && guesses.length === 0;
  const showProgressiveHint = !!targetPlayer && wrongGuessCount >= 1 && !won && !lost && !(gameOver && shareDismissed);
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
    if (needed <= usedTriviaIndices.length) return;
    let current = [...usedTriviaIndices];
    while (current.length < needed) {
      current = pickAndStoreTriviaIndex(current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongGuessCount]);

  const allUnlockedHints: { label: string; text: string }[] = [
    { label: "Opening Clue", text: openingHintText },
  ];
  for (let i = 1; i <= wrongGuessCount; i++) {
    allUnlockedHints.push(resolveHintTier(i - 1, usedTriviaIndices));
  }

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

    try {
      const savedElapsed = localStorage.getItem(LS_TIMER_ELAPSED_KEY);
      if (savedElapsed) setElapsedSeconds(parseInt(savedElapsed, 10) || 0);
      if (localStorage.getItem(LS_TIMER_STARTED_KEY) === "1") setTimerStarted(true);
      const savedTrivia = localStorage.getItem(LS_USED_TRIVIA_KEY);
      if (savedTrivia) setUsedTriviaIndices(JSON.parse(savedTrivia));
    } catch { /* */ }

    const loaded = readStoredGuesses(currentGameId, answer, playerList, puzzleAnswerFullName);
    if (!loaded) return;
    const last = loaded.guesses[loaded.guesses.length - 1];
    const wasStoredWin = isSamePlayer(last, answer, playerList, puzzleAnswerFullName);
    const gameDone = wasStoredWin || loaded.guesses.length === MAX_GUESSES;
    const dismissedShare = gameDone && readShareDismissedForPuzzle(currentGameId);
    setGuesses(loaded.guesses);
    setStatuses(loaded.statuses);
    setLetterStatus(letterStatusFromRows(loaded.guesses, loaded.statuses));
    if (dismissedShare) setShareDismissed(true);
    if (wasStoredWin && last !== answer) setAliasWin(true);
  }, [playerToGuess, currentGameId, answer, playerList, puzzleAnswerFullName]);

  useEffect(() => {
    if (!timerStarted || gameOver) return;
    const id = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        try { localStorage.setItem(LS_TIMER_ELAPSED_KEY, String(next)); } catch { /* */ }
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
  useEffect(() => {
    if (currentFlipCol < 0 || flippingRow === null) return;

    const timer = setTimeout(() => {
      setDoneFlipCols(prev => new Set([...prev, currentFlipCol]));

      if (currentFlipCol < WORD_LENGTH - 1) {
        setCurrentFlipCol(currentFlipCol + 1);
      } else {
        const guess    = flippingGuess;
        const completedRowIndex = flippingRow ?? 0;
        persistGuess(currentGameId, completedRowIndex + 1, guess, answer, playerList, puzzleAnswerFullName);

        const justWon = isSamePlayer(guess, answer, playerList, puzzleAnswerFullName);
        const isAlias = justWon && guess !== answer;
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
          setStats(recordGameResult(justWon, currentGameId));
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
    currentGameId,
    answer,
    playerList,
    puzzleAnswerFullName,
  ]);

  // Clear win bounce class after animation completes
  useEffect(() => {
    if (winBounceRow === null) return;
    const clearDelay =
      (WORD_LENGTH - 1) * WIN_BOUNCE_STAGGER_MS + WIN_BOUNCE_DURATION_MS;
    const t = window.setTimeout(() => setWinBounceRow(null), clearDelay);
    return () => clearTimeout(t);
  }, [winBounceRow]);

  // Show modal after game ends (slight delay so last flip finishes); not if share already dismissed (e.g. reload)
  useEffect(() => {
    if (gameOver && !shareDismissed) {
      const t = setTimeout(() => setShowModal(true), 1800);
      return () => clearTimeout(t);
    }
  }, [gameOver, shareDismissed]);

  // Share modal always reflects latest persisted stats (localStorage is source of truth after each game).
  useEffect(() => {
    if (!showModal) return;
    setStats(readStats());
  }, [showModal]);

  const handleKey = useCallback((key: string) => {
    if (inputLocked || isAnimating || gameOver) return;

    if (key === "Enter") {
      if (currentInput.length !== WORD_LENGTH) {
        setMessage("Not enough letters");
        setShaking(true);
        setTimeout(() => { setShaking(false); setMessage(""); }, 600);
        return;
      }
      if (currentInput !== answer && !validGuesses.includes(currentInput)) {
        setMessage("Not a valid cricketer name");
        setShaking(true);
        setTimeout(() => { setShaking(false); setMessage(""); }, 600);
        return;
      }

      const isAliasGuess = currentInput !== answer && isSamePlayer(currentInput, answer, playerList, puzzleAnswerFullName);
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

  return (
    <>
      <div className="game-page__content">
        <PageHeader timerDisplay={formatGameTimer(elapsedSeconds)} logoSrc="/stumpd-logo.png" logoAlt="Stumpd" />
        <div className={shellVpClass ? `game-shell ${shellVpClass}` : "game-shell"}>

        <div className="game-shell__top">
          <p className="game-subtitle game-subtitle--stumpd">Guess the Cricketer</p>
          {gameOver && shareDismissed ? <NextPuzzleTimer /> : null}
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

        <div className="game-grid-wrap">
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
                  let bgColor     = "#fff";
                  let borderColor = "#d3d6da";
                  let textColor   = "#000";
                  let tileClass   = "tile game-tile";

                  if (isCommitted) {
                    letter      = guesses[rowIndex][colIndex];
                    bgColor     = STATUS_COLOR[statuses[rowIndex][colIndex]];
                    borderColor = bgColor;
                    textColor   = "#fff";
                    if (winBounceRow === rowIndex) {
                      tileClass = "tile game-tile game-tile--win-bounce";
                    }

                  } else if (isThisFlipping) {
                    letter = flippingGuess[colIndex] || "";

                    if (doneFlipCols.has(colIndex)) {
                      bgColor     = STATUS_COLOR[flippingStatuses[colIndex]];
                      borderColor = bgColor;
                      textColor   = "#fff";
                    } else if (colIndex === currentFlipCol) {
                      tileClass   = "tile game-tile flipping";
                      borderColor = "#888";
                    } else {
                      borderColor = "#888";
                    }

                  } else if (isCurrent) {
                    letter      = currentInput[colIndex] || "";
                    borderColor = letter ? "#888" : "#d3d6da";
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
                                           ? STATUS_COLOR[flippingStatuses[colIndex]] : "#fff",
                        "--tile-border": isThisFlipping && flippingStatuses[colIndex]
                                           ? STATUS_COLOR[flippingStatuses[colIndex]] : "#888",
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
              Names trimmed to 5 letters
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

      {gameOver && !isAnimating ? (
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
              const bg = s === "correct" ? "#6aaa64" : s === "present" ? "#c9b458" : s === "absent" ? "#787c7e" : "#d3d6da";
              return (
                <button
                  key={l}
                  type="button"
                  className="game-key"
                  onClick={() => handleKey(l)}
                  style={{ background: bg, color: s ? "#fff" : "#000" }}
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
              const bg = s === "correct" ? "#6aaa64" : s === "present" ? "#c9b458" : s === "absent" ? "#787c7e" : "#d3d6da";
              return (
                <button
                  key={l}
                  type="button"
                  className="game-key"
                  onClick={() => handleKey(l)}
                  style={{ background: bg, color: s ? "#fff" : "#000" }}
                >
                  {l.toUpperCase()}
                </button>
              );
            })}
            <div className="game-keyboard-spacer" aria-hidden="true" />
          </div>
          <div className="game-keyboard-row game-keyboard-row--bottom">
            <button type="button" className="game-key game-key-wide" onClick={() => handleKey("Enter")}>
              ENTER
            </button>
            {"zxcvbnm".split("").map(l => {
              const s  = letterStatus[l];
              const bg = s === "correct" ? "#6aaa64" : s === "present" ? "#c9b458" : s === "absent" ? "#787c7e" : "#d3d6da";
              return (
                <button
                  key={l}
                  type="button"
                  className="game-key"
                  onClick={() => handleKey(l)}
                  style={{ background: bg, color: s ? "#fff" : "#000" }}
                >
                  {l.toUpperCase()}
                </button>
              );
            })}
            <button type="button" className="game-key game-key-wide" onClick={() => handleKey("Backspace")}>
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
      />

      <HowToPlayModal open={showHowToPlay} onClose={dismissHowToPlay}>
        <StumpdHowToPlay />
      </HowToPlayModal>

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
          onClose={() => {
            setShowModal(false);
            setShareDismissed(true);
            persistShareDismissed(currentGameId);
          }}
        />
      )}
    </>
  );
}
