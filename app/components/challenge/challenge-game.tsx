"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Socket } from "socket.io-client";
import OpponentToasts, { type ToastEntry } from "./opponent-toast";
import type { PuzzleHintEntry } from "../../services/ipl-api";
import { getInitialPlayerList, fetchIplPlayersFromAPI } from "../../stumpd/ipl-players";
import type { IplPlayerRow } from "../../stumpd/ipl-players";

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const FLIP_DURATION = 340;
const FLIP_STAGGER = 80;

const STATUS_COLOR: Record<string, string> = {
  correct: "#6aaa64",
  present: "#c9b458",
  absent: "#787c7e",
};

type HintEntry = Record<string, unknown>;

function findHint<T = string>(hints: HintEntry[], key: string): T | undefined {
  const entry = hints.find((h) => h[key] !== undefined);
  return entry ? (entry[key] as T) : undefined;
}

function collectHintTexts(hints: HintEntry[]): string[] {
  const entry = hints.find((h) => h.trivia !== undefined);
  if (!entry) return [];
  const val = entry.trivia;
  return Array.isArray(val) ? (val as string[]) : [val as string];
}

const HINT_LADDER: { key: string; label: string }[] = [
  { key: "role", label: "Role" },
  { key: "hint", label: "Hint" },
  { key: "iplTeam+country", label: "IPL Team & Nationality" },
  { key: "hint", label: "Hint" },
  { key: "hint", label: "Hint" },
];

type Props = {
  socket: Socket;
  roomCode: string;
  answer: string;
  fullName: string;
  hints: HintEntry[];
  opponentName: string;
  myRole: "creator" | "opponent";
};

export default function ChallengeGame({
  socket, roomCode, answer, fullName, hints, opponentName, myRole,
}: Props) {
  const [currentInput, setCurrentInput] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[][]>([]);
  const [letterStatus, setLetterStatus] = useState<Record<string, string>>({});
  const [shaking, setShaking] = useState(false);
  const [message, setMessage] = useState("");
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [opponentGuessCount, setOpponentGuessCount] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  const [playerList, setPlayerList] = useState<IplPlayerRow[]>(() => getInitialPlayerList());
  const toastIdRef = useRef(0);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingGuessRef = useRef<string | null>(null);

  // Flip animation state
  const [flippingRow, setFlippingRow] = useState<number | null>(null);
  const [flippingGuess, setFlippingGuess] = useState("");
  const [flippingStatuses, setFlippingStatuses] = useState<string[]>([]);
  const [currentFlipCol, setCurrentFlipCol] = useState(-1);
  const [doneFlipCols, setDoneFlipCols] = useState<Set<number>>(new Set());

  const isAnimating = flippingRow !== null;

  const validGuesses = useMemo(
    () => playerList.map((p) => p.name.toLowerCase()),
    [playerList],
  );

  useEffect(() => {
    fetchIplPlayersFromAPI().then((pl) => {
      if (pl) setPlayerList(pl);
    }).catch(() => {});
  }, []);

  // Handle guess result from server
  useEffect(() => {
    const onGuessResult = (data: { guessNumber: number; statuses: string[]; isCorrect: boolean }) => {
      const guess = pendingGuessRef.current;
      if (!guess) return;
      pendingGuessRef.current = null;

      const rowIndex = guesses.length;
      setFlippingRow(rowIndex);
      setFlippingGuess(guess);
      setFlippingStatuses(data.statuses);
      setDoneFlipCols(new Set());
      setCurrentFlipCol(0);
    };

    const onOpponentGuessed = (data: {
      guessNumber: number; correctCount: number; presentCount: number;
      totalGuesses: number; isCorrect: boolean;
    }) => {
      setOpponentGuessCount(data.totalGuesses);
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev, {
        id,
        guessNumber: data.guessNumber,
        correctCount: data.correctCount,
        presentCount: data.presentCount,
        isCorrect: data.isCorrect,
        opponentName,
      }]);
    };

    const onError = (data: { message: string }) => {
      pendingGuessRef.current = null;
      setMessage(data.message);
      setShaking(true);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => { setShaking(false); setMessage(""); }, 600);
    };

    socket.on("guess-result", onGuessResult);
    socket.on("opponent-guessed", onOpponentGuessed);
    socket.on("room-error", onError);

    return () => {
      socket.off("guess-result", onGuessResult);
      socket.off("opponent-guessed", onOpponentGuessed);
      socket.off("room-error", onError);
    };
  }, [socket, guesses.length, opponentName]);

  // Flip animation sequencer
  useEffect(() => {
    if (currentFlipCol < 0 || flippingRow === null) return;

    const timer = setTimeout(() => {
      setDoneFlipCols((prev) => new Set([...prev, currentFlipCol]));

      if (currentFlipCol < WORD_LENGTH - 1) {
        setCurrentFlipCol(currentFlipCol + 1);
      } else {
        const guess = flippingGuess;
        const rowStats = flippingStatuses;

        setGuesses((prev) => [...prev, guess]);
        setStatuses((prev) => [...prev, rowStats]);

        const STATUS_PRIORITY: Record<string, number> = { correct: 3, present: 2, absent: 1 };
        setLetterStatus((prev) => {
          const next = { ...prev };
          guess.split("").forEach((letter, i) => {
            const s = rowStats[i];
            if (!next[letter] || (STATUS_PRIORITY[s] ?? 0) > (STATUS_PRIORITY[next[letter]] ?? 0)) {
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

        const isCorrect = rowStats.every((s) => s === "correct");
        const exhausted = guesses.length + 1 >= MAX_GUESSES;
        if (isCorrect || exhausted) {
          setGameFinished(true);
        }
      }
    }, FLIP_DURATION + FLIP_STAGGER);

    return () => clearTimeout(timer);
  }, [currentFlipCol, flippingRow, flippingGuess, flippingStatuses, guesses.length]);

  const handleKey = useCallback((key: string) => {
    if (isAnimating || gameFinished) return;

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
      pendingGuessRef.current = currentInput;
      socket.emit("submit-guess", { roomCode, guess: currentInput });
      setCurrentInput("");
    } else if (key === "Backspace") {
      setCurrentInput((prev) => prev.slice(0, -1));
    } else if (/^[a-zA-Z]$/.test(key)) {
      setCurrentInput((prev) => prev.length < WORD_LENGTH ? prev + key.toLowerCase() : prev);
    }
  }, [currentInput, isAnimating, gameFinished, answer, validGuesses, socket, roomCode]);

  // Keyboard listener
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleKey("Enter");
      else if (e.key === "Backspace") handleKey("Backspace");
      else handleKey(e.key);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handleKey]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Hints
  const wrongGuessCount = guesses.filter((g) => {
    const idx = guesses.indexOf(g);
    return !statuses[idx]?.every((s) => s === "correct");
  }).length;

  const openingHintText = String(findHint(hints, "openingHint") ?? "");
  const resolveHintTier = useCallback((tier: number): { label: string; text: string } => {
    const { key, label } = HINT_LADDER[Math.min(tier, HINT_LADDER.length - 1)];
    if (key === "hint") {
      const hintTexts = collectHintTexts(hints);
      let hintSlotIdx = 0;
      for (let t = 0; t < tier; t++) {
        if (HINT_LADDER[t]?.key === "hint") hintSlotIdx++;
      }
      return { label, text: hintSlotIdx < hintTexts.length ? hintTexts[hintSlotIdx] : "" };
    }
    if (key === "iplTeam+country") {
      const team = findHint(hints, "iplTeam") ?? "";
      const country = findHint(hints, "country") ?? "";
      return { label, text: `${team} · ${country}` };
    }
    const val = findHint(hints, key);
    return { label, text: val != null ? String(val) : "" };
  }, [hints]);

  const allUnlockedHints: { label: string; text: string }[] = [
    { label: "Opening Clue", text: openingHintText },
  ];
  for (let i = 1; i <= wrongGuessCount; i++) {
    allUnlockedHints.push(resolveHintTier(i - 1));
  }

  const [activeHintIdx, setActiveHintIdx] = useState(0);
  useEffect(() => {
    setActiveHintIdx(allUnlockedHints.length - 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongGuessCount]);
  const viewingHint = allUnlockedHints[activeHintIdx] ?? allUnlockedHints[allUnlockedHints.length - 1];

  const showHintSlot = guesses.length === 0 || (wrongGuessCount >= 1 && !gameFinished);

  const defaultKeyBg = "#d3d6da";
  const emptyBg = "#fff";
  const emptyBorder = "#d3d6da";
  const filledBorder = "#888";

  return (
    <div className="ch-game">
      <OpponentToasts toasts={toasts} onDismiss={dismissToast} />

      {/* Opponent progress bar */}
      <div className="ch-game__opponent-bar">
        <span className="ch-game__opponent-avatar">{opponentName.charAt(0).toUpperCase()}</span>
        <span className="ch-game__opponent-name">{opponentName}</span>
        <div className="ch-game__opponent-dots">
          {Array.from({ length: MAX_GUESSES }).map((_, i) => (
            <span
              key={i}
              className={`ch-game__opponent-dot${i < opponentGuessCount ? " ch-game__opponent-dot--filled" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* Validation toast */}
      <div className="game-validation-layer" aria-live="polite">
        {message ? <div className="game-validation-toast">{message}</div> : null}
      </div>

      {/* Hint card */}
      {showHintSlot && viewingHint.text && (
        <div className="game-hint-slot game-hint-slot--active">
          <div className="game-hint-card" role="status">
            {allUnlockedHints.length > 1 && (
              <button
                type="button"
                className="game-hint-card__arrow game-hint-card__arrow--left"
                onClick={() => setActiveHintIdx((p) => Math.max(0, p - 1))}
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
                onClick={() => setActiveHintIdx((p) => Math.min(allUnlockedHints.length - 1, p + 1))}
                disabled={activeHintIdx === allUnlockedHints.length - 1}
                aria-label="Next clue"
              >
                <span className="game-hint-card__arrow__icon">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </span>
              </button>
            )}
            <div className="game-hint-card__content">
              <p className="game-hint-card__label">{viewingHint.label}</p>
              <p className="game-hint-card__text">{viewingHint.text}</p>
            </div>
            <div className="game-hint-card__dots">
              {allUnlockedHints.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`game-hint-card__dot${i === activeHintIdx ? " game-hint-card__dot--active" : ""}`}
                  onClick={() => setActiveHintIdx(i)}
                  aria-label={`Go to clue ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game grid */}
      <div className="game-grid-wrap">
        <div className="game-grid">
          {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
            const isCommitted = rowIndex < guesses.length;
            const isCurrent = !isAnimating && rowIndex === guesses.length;
            const isThisFlipping = flippingRow === rowIndex;

            return (
              <div
                key={rowIndex}
                className={`game-grid-row${shaking && isCurrent ? " shake" : ""}`}
              >
                {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                  let letter = "";
                  let bgColor = emptyBg;
                  let borderColor = emptyBorder;
                  let textColor = "#000";
                  let tileClass = "tile game-tile";

                  if (isCommitted) {
                    letter = guesses[rowIndex][colIndex];
                    bgColor = STATUS_COLOR[statuses[rowIndex][colIndex]];
                    borderColor = bgColor;
                    textColor = "#fff";
                  } else if (isThisFlipping) {
                    letter = flippingGuess[colIndex] || "";
                    if (doneFlipCols.has(colIndex)) {
                      bgColor = STATUS_COLOR[flippingStatuses[colIndex]];
                      borderColor = bgColor;
                      textColor = "#fff";
                    } else if (colIndex === currentFlipCol) {
                      tileClass = "tile game-tile flipping";
                      borderColor = filledBorder;
                    } else {
                      borderColor = filledBorder;
                    }
                  } else if (isCurrent) {
                    letter = currentInput[colIndex] || "";
                    borderColor = letter ? filledBorder : emptyBorder;
                    const isJustTyped = colIndex === currentInput.length - 1;
                    if (letter && isJustTyped) tileClass = "tile game-tile pop";
                  }

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={tileClass}
                      style={{
                        borderColor,
                        backgroundColor: bgColor,
                        color: textColor,
                        "--tile-bg": isThisFlipping && flippingStatuses[colIndex]
                          ? STATUS_COLOR[flippingStatuses[colIndex]] : emptyBg,
                        "--tile-border": isThisFlipping && flippingStatuses[colIndex]
                          ? STATUS_COLOR[flippingStatuses[colIndex]] : filledBorder,
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

      {/* Info notice */}
      <div className="game-shortname-notice" role="note">
        <div className="game-shortname-notice__pill">
          <span className="game-shortname-notice__tag">INFO</span>
          <span className="game-shortname-notice__divider" />
          <p className="game-shortname-notice__text">
            Only first 5 letters of each name
            <span className="game-shortname-notice__example">
              <strong>YUVRAJ</strong>
              <span className="game-shortname-notice__arrow">&rarr;</span>
              <strong>YUVRA</strong>
            </span>
          </p>
        </div>
      </div>

      {/* Keyboard */}
      {!gameFinished && (
        <div className="game-page__keyboard">
          <div className="game-keyboard" role="group" aria-label="Keyboard">
            <div className="game-keyboard-row game-keyboard-row--top">
              {"qwertyuiop".split("").map((l) => {
                const s = letterStatus[l];
                const bg = s ? STATUS_COLOR[s] : defaultKeyBg;
                return (
                  <button
                    key={l} type="button" className="game-key"
                    onClick={() => handleKey(l)}
                    style={{ background: bg, color: s ? "#fff" : "#000" }}
                  >{l.toUpperCase()}</button>
                );
              })}
            </div>
            <div className="game-keyboard-row game-keyboard-row--middle">
              <div className="game-keyboard-spacer" aria-hidden="true" />
              {"asdfghjkl".split("").map((l) => {
                const s = letterStatus[l];
                const bg = s ? STATUS_COLOR[s] : defaultKeyBg;
                return (
                  <button
                    key={l} type="button" className="game-key"
                    onClick={() => handleKey(l)}
                    style={{ background: bg, color: s ? "#fff" : "#000" }}
                  >{l.toUpperCase()}</button>
                );
              })}
              <div className="game-keyboard-spacer" aria-hidden="true" />
            </div>
            <div className="game-keyboard-row game-keyboard-row--bottom">
              <button type="button" className="game-key game-key-wide"
                onClick={() => handleKey("Enter")}
                style={{ background: defaultKeyBg, color: "#000" }}>ENTER</button>
              {"zxcvbnm".split("").map((l) => {
                const s = letterStatus[l];
                const bg = s ? STATUS_COLOR[s] : defaultKeyBg;
                return (
                  <button
                    key={l} type="button" className="game-key"
                    onClick={() => handleKey(l)}
                    style={{ background: bg, color: s ? "#fff" : "#000" }}
                  >{l.toUpperCase()}</button>
                );
              })}
              <button type="button" className="game-key game-key-wide"
                onClick={() => handleKey("Backspace")}
                style={{ background: defaultKeyBg, color: "#000" }}>&#9003;</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
