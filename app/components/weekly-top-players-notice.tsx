"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

type TopPlayer = {
  rank: number;
  name: string;
};

const WEEKLY_TOP_PLAYERS: TopPlayer[] = [
  { rank: 1, name: "sufyanafridi707" },
  { rank: 2, name: "mayanknarang612" },
  { rank: 3, name: "anmolshrivastava27" },
  { rank: 4, name: "nitishsaini963" },
  { rank: 5, name: "okarinkaiser" },
];

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_CLASS: Record<number, string> = {
  1: "weekly-notice-player-row--r1",
  2: "weekly-notice-player-row--r2",
  3: "weekly-notice-player-row--r3",
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function WeeklyTopPlayersNotice({ open, onClose }: Props) {
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
    <div className="weekly-notice-root">
      <div
        className="weekly-notice-backdrop"
        onClick={onClose}
        role="presentation"
        aria-hidden
      />
      <div
        className="weekly-notice-card"
        role="dialog"
        aria-modal="true"
        aria-label="Weekly top players"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="weekly-notice-close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="weekly-notice-header">
          <span className="weekly-notice-header-trophy">🏆</span>
          <h2 className="weekly-notice-title">Last Week&apos;s Champions</h2>
          <p className="weekly-notice-subtitle">Top Players of the Week</p>
        </div>

        <div className="weekly-notice-content">
          <div className="weekly-notice-players">
            {WEEKLY_TOP_PLAYERS.map((player, i) => (
              <div
                key={player.rank}
                className={`weekly-notice-player-row ${RANK_CLASS[player.rank] ?? ""}`}
                style={{ "--row-index": i } as React.CSSProperties}
              >
                <span className={`weekly-notice-rank ${i < 3 ? "weekly-notice-rank--medal" : "weekly-notice-rank--num"}`}>
                  {i < 3 ? MEDALS[i] : player.rank}
                </span>
                <span className="weekly-notice-name">{player.name}</span>
              </div>
            ))}
          </div>

          <div className="weekly-notice-cta">
            <p className="weekly-notice-hook">
              🔥 You could be here! Don&apos;t break your streak.
            </p>
            <p className="weekly-notice-reset-info">Resets every Monday</p>
          </div>

          <button
            type="button"
            className="weekly-notice-play-btn"
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
