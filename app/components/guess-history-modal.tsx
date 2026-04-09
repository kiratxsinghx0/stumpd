"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

type HintEntry = {
  label: string;
  text: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  hints: HintEntry[];
  totalHints: number;
  answerRevealed: boolean;
  answerDisplay: string;
};

export default function GuessHistoryModal({
  open,
  onClose,
  hints,
  totalHints,
  answerRevealed,
  answerDisplay,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const lockedCount = Math.max(0, totalHints - hints.length);

  return createPortal(
    <div className="hint-history-modal-root">
      <div
        className="hint-history-modal-backdrop"
        onClick={onClose}
        role="presentation"
        aria-hidden
      />
      <div
        className="hint-history-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Hint history"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="hint-history-modal-close"
          onClick={onClose}
          aria-label="Close hint history"
        >
          ✕
        </button>

        <h2 className="hint-history-modal-title">Your Clues</h2>
        <p className="hint-history-modal-subtitle">
          {hints.length === 0
            ? "Start guessing to unlock clues"
            : `${hints.length} of ${totalHints} clues unlocked`}
        </p>

        <div className="hint-history-modal-progress">
          <div
            className="hint-history-modal-progress__bar"
            style={{ width: `${totalHints > 0 ? (hints.length / totalHints) * 100 : 0}%` }}
          />
        </div>

        {hints.length === 0 ? (
          <div className="hint-history-modal-empty-state">
            <span className="hint-history-modal-empty-state__icon">💡</span>
            <p className="hint-history-modal-empty-state__text">
              Each wrong guess reveals a new clue to help you find the cricketer.
            </p>
          </div>
        ) : (
          <div className="hint-history-modal-hints">
            {hints.map((h, i) => (
              <div key={i} className="hint-history-modal-hint-row">
                <span className="hint-history-modal-hint-num">{i + 1}</span>
                <div className="hint-history-modal-hint-body">
                  <span className="hint-history-modal-hint-label">
                    {h.label}
                  </span>
                  <span className="hint-history-modal-hint-text">
                    {h.text}
                  </span>
                </div>
              </div>
            ))}

            {lockedCount > 0 &&
              Array.from({ length: lockedCount }).map((_, i) => (
                <div key={`locked-${i}`} className="hint-history-modal-hint-row hint-history-modal-hint-row--locked">
                  <span className="hint-history-modal-hint-num hint-history-modal-hint-num--locked">
                    {hints.length + i + 1}
                  </span>
                  <div className="hint-history-modal-hint-body">
                    <span className="hint-history-modal-hint-text hint-history-modal-hint-text--locked">
                      Guess to unlock
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {answerRevealed && (
          <div className="hint-history-modal-answer">
            <span className="hint-history-modal-hint-num hint-history-modal-hint-num--answer">✓</span>
            <div className="hint-history-modal-hint-body">
              <span className="hint-history-modal-hint-label">Answer</span>
              <span className="hint-history-modal-hint-text hint-history-modal-hint-text--answer">
                {answerDisplay}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
