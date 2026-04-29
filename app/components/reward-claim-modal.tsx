"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Full claim flow in a dialog (same-origin iframe keeps auth). */
export default function RewardClaimModal({ open, onClose }: Props) {
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
        className="how-to-play-modal-card reward-claim-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-claim-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="reward-claim-modal-title" className="sr-only">
          Claim your reward
        </h2>
        <button
          type="button"
          className="how-to-play-modal-close"
          onClick={onClose}
          aria-label="Close claim reward"
        >
          ✕
        </button>
        <div className="how-to-play-modal-scroll reward-claim-modal-scroll">
          <iframe
            title="Claim your reward"
            src="/rewards/claim"
            className="reward-claim-modal__iframe"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
