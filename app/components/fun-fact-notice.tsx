"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  funFact: string;
};

export default function FunFactNotice({ open, onClose, funFact }: Props) {
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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="funfact-notice-root">
      <div
        className="funfact-notice-backdrop"
        onClick={onClose}
        role="presentation"
        aria-hidden
      />
      <div
        className="funfact-notice-card"
        role="dialog"
        aria-modal="true"
        aria-label="Fun fact"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="funfact-notice-header">
          <span className="funfact-notice-emoji">💡</span>
          <h2 className="funfact-notice-title">Did You Know?</h2>
          <p className="funfact-notice-subtitle">Yesterday&apos;s Stumpd Answer</p>
        </div>

        <div className="funfact-notice-content">
          <p className="funfact-notice-text">{funFact}</p>

          <button
            type="button"
            className="funfact-notice-play-btn"
            onClick={onClose}
          >
            Let&apos;s Play!
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
