"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export type ToastEntry = {
  id: number;
  guessNumber: number;
  correctCount: number;
  presentCount: number;
  isCorrect: boolean;
  opponentName: string;
};

function buildMessage(entry: ToastEntry): string {
  const { guessNumber, correctCount, presentCount, isCorrect, opponentName } = entry;
  const name = opponentName.split(" ")[0];

  if (isCorrect) return `${name} got it — guess #${guessNumber}!`;
  if (guessNumber === 6) return `${name} didn't get it — 6/6`;

  const parts: string[] = [];
  if (correctCount > 0) parts.push(`${correctCount} right spot`);
  if (presentCount > 0) parts.push(`${presentCount} wrong spot`);
  const detail = parts.length > 0 ? parts.join(", ") : "no matches";

  return `${name} #${guessNumber} — ${detail}`;
}

function getToastColor(entry: ToastEntry): string {
  if (entry.isCorrect) return "ch-toast--winner";
  if (entry.correctCount >= 3) return "ch-toast--hot";
  if (entry.correctCount >= 1 || entry.presentCount >= 2) return "ch-toast--warm";
  return "ch-toast--cold";
}

type Props = {
  toasts: ToastEntry[];
  onDismiss: (id: number) => void;
};

export default function OpponentToasts({ toasts, onDismiss }: Props) {
  return (
    <div className="ch-toasts">
      {toasts.map((t) => (
        <SingleToast key={t.id} entry={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function SingleToast({ entry, onDismiss }: { entry: ToastEntry; onDismiss: (id: number) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(entry.id), 400);
    }, 3500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [entry.id, onDismiss]);

  const handleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => onDismiss(entry.id), 400);
  }, [entry.id, onDismiss]);

  return (
    <div
      className={`ch-toast ${getToastColor(entry)}${exiting ? " ch-toast--exit" : ""}`}
      onClick={handleDismiss}
      role="alert"
    >
      <span className="ch-toast__avatar">{entry.opponentName.charAt(0).toUpperCase()}</span>
      <p className="ch-toast__msg">{buildMessage(entry)}</p>
    </div>
  );
}
