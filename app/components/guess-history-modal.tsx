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
  answerRevealed: boolean;
  answerDisplay: string;
};

export default function GuessHistoryModal({
  open,
  onClose,
  hints,
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

        <h2 className="hint-history-modal-title">Hints</h2>

        {hints.length === 0 ? (
          <p className="hint-history-modal-empty">
            No hints unlocked yet.
          </p>
        ) : (
          <>
            <div className="hint-history-modal-hints">
              {hints.map((h, i) => (
                <div key={i} className="hint-history-modal-hint-row">
                  <span className="hint-history-modal-hint-label">
                    {h.label}
                  </span>
                  <span className="hint-history-modal-hint-text">
                    {h.text}
                  </span>
                </div>
              ))}
            </div>

            {answerRevealed && (
              <div className="hint-history-modal-answer">
                <span className="hint-history-modal-hint-label">Answer</span>
                <span className="hint-history-modal-hint-text hint-history-modal-hint-text--answer">
                  {answerDisplay}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
