"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export default function HowToPlayModal({ open, onClose, children }: Props) {
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
    <div className="how-to-play-modal-root">
      <div
        className="how-to-play-modal-backdrop"
        onClick={onClose}
        role="presentation"
        aria-hidden
      />
      <div
        className="how-to-play-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="how-to-play-modal-close"
          onClick={onClose}
          aria-label="Close how to play"
        >
          ✕
        </button>
        <div className="how-to-play-modal-scroll">
          <div className="how-to-play-page how-to-play-modal--embedded">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
