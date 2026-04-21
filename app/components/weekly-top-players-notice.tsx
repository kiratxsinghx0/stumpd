"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { RewardEligibility } from "../services/rewards-api";

export type WeeklyTopPlayer = {
  rank: number;
  name: string;
  points?: number;
};

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_CLASS: Record<number, string> = {
  1: "weekly-notice-player-row--r1",
  2: "weekly-notice-player-row--r2",
  3: "weekly-notice-player-row--r3",
};

type Props = {
  open: boolean;
  onClose: () => void;
  players: WeeklyTopPlayer[];
  /** The logged-in user's display name (email username part), or null if not logged in */
  currentUserName?: string | null;
  /** Server-verified reward eligibility, or null if not logged in / not fetched */
  eligibility?: RewardEligibility | null;
};

export default function WeeklyTopPlayersNotice({ open, onClose, players, currentUserName, eligibility }: Props) {
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

  const isEligible = eligibility?.eligible === true;
  const alreadyClaimed = eligibility?.already_claimed === true;
  const isInTop5 = isEligible || (!!currentUserName && players.some(
    (p) => p.name.toLowerCase() === currentUserName.toLowerCase()
  ));

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
          {players.length > 0 ? (
            <div className="weekly-notice-players">
              {players.map((player, i) => {
                const isCurrentUser = !!currentUserName && player.name.toLowerCase() === currentUserName.toLowerCase();
                return (
                  <div
                    key={player.rank}
                    className={`weekly-notice-player-row ${RANK_CLASS[player.rank] ?? ""}${isCurrentUser ? " weekly-notice-player-row--you" : ""}`}
                    style={{ "--row-index": i } as React.CSSProperties}
                  >
                    <span className={`weekly-notice-rank ${i < 3 ? "weekly-notice-rank--medal" : "weekly-notice-rank--num"}`}>
                      {i < 3 ? MEDALS[i] : player.rank}
                    </span>
                    <span className="weekly-notice-name">
                      {player.name}
                      {isCurrentUser && <span className="weekly-notice-you-tag">You</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="weekly-notice-subtitle">No results from last week yet.</p>
          )}

          {isInTop5 ? (
            <div className="weekly-notice-cta">
              <p className="weekly-notice-hook">
                🎉 Congrats! You made the top 5!
              </p>
              <p className="weekly-notice-reset-info">Top 5 players win weekly rewards</p>
            </div>
          ) : (
            <div className="weekly-notice-cta">
              <p className="weekly-notice-hook">
                🔥 You could be here! Don&apos;t break your streak.
              </p>
              <p className="weekly-notice-reset-info">Top 5 players win weekly rewards &middot; Resets every Monday</p>
            </div>
          )}

          {isInTop5 && !alreadyClaimed ? (
            <Link
              href="/rewards/claim"
              className="weekly-notice-play-btn weekly-notice-claim-btn"
              onClick={onClose}
            >
              🎁 Claim Your Rewards
            </Link>
          ) : isInTop5 && alreadyClaimed ? (
            <button
              type="button"
              className="weekly-notice-play-btn weekly-notice-claimed-btn"
              onClick={onClose}
            >
              ✅ Reward Claimed
            </button>
          ) : (
            <button
              type="button"
              className="weekly-notice-play-btn"
              onClick={onClose}
            >
              Let&apos;s Play!
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
