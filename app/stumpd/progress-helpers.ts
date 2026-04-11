import type { GameProgressPayload } from "../services/auth-api";

const NORMAL = {
  guess:        "stumpdpuzzle_guess",
  timerElapsed: "stumpdpuzzle_timerElapsed",
  unlockedHints:"stumpdpuzzle_unlockedHints",
  usedTrivia:   "stumpdpuzzle_usedTriviaIndices",
  puzzleId:     "stumpdpuzzle_puzzleId",
};

const HARD = {
  guess:        "stumpdpuzzle_hard_guess",
  timerElapsed: "stumpdpuzzle_hard_timerElapsed",
  usedTrivia:   "stumpdpuzzle_hard_usedTriviaIndices",
  puzzleId:     "stumpdpuzzle_hard_puzzleId",
};

/**
 * Read in-progress game state from localStorage and build a payload
 * suitable for the save-progress endpoint. Returns null if no game
 * data exists for the given mode.
 */
export function readCurrentGameProgress(
  hardMode: boolean,
  puzzleDay: number,
): GameProgressPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const k = hardMode ? HARD : NORMAL;
    const raw = localStorage.getItem(k.guess);
    if (!raw) return null;

    const elapsed = parseInt(localStorage.getItem(k.timerElapsed) ?? "0", 10) || 0;

    const storedPuzzleId = localStorage.getItem(k.puzzleId);
    const completed = storedPuzzleId != null && storedPuzzleId !== "";

    const payload: GameProgressPayload = {
      puzzle_day: puzzleDay,
      hard_mode: hardMode,
      guesses_json: raw,
      elapsed_seconds: elapsed,
      completed,
    };

    if (!hardMode) {
      const hints = localStorage.getItem(NORMAL.unlockedHints);
      payload.hints_used = hints ? (JSON.parse(hints) as unknown[]).length : 0;

      const trivia = localStorage.getItem(NORMAL.usedTrivia);
      payload.used_trivia_json = trivia ?? null;
    }

    return payload;
  } catch {
    return null;
  }
}
