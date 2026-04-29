"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { UserBadgeRow } from "../services/badges-api";
import { badgeImageSrc } from "../lib/badge-image-src";

export type BadgeDefLite = {
  id: string;
  title: string;
  hint: string;
  earned: boolean;
  detail?: string;
};

function lastEarnedIso(row: UserBadgeRow | null, badgeId: string): string | null {
  if (!row) return null;
  if (badgeId.startsWith("streak-")) {
    const days = badgeId.replace("streak-", "");
    const key = `streak_${days}_earned_at` as keyof UserBadgeRow;
    const v = row[key];
    return typeof v === "string" && v.length > 0 ? v : null;
  }
  if (badgeId === "stumpd-1") {
    return row.stumpd_in_one_last_at && String(row.stumpd_in_one_last_at).length > 0
      ? String(row.stumpd_in_one_last_at)
      : null;
  }
  if (badgeId === "stumpd-2") {
    return row.stumpd_in_two_last_at && String(row.stumpd_in_two_last_at).length > 0
      ? String(row.stumpd_in_two_last_at)
      : null;
  }
  return null;
}

function formatLastEarnedLine(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const part = d
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
  return `LAST EARNED ${part}`;
}

function stumpdCount(row: UserBadgeRow | null, badgeId: string): number {
  if (!row) return 0;
  if (badgeId === "stumpd-1") return Number(row.stumpd_in_one_count) || 0;
  if (badgeId === "stumpd-2") return Number(row.stumpd_in_two_count) || 0;
  return 0;
}

function buildDescription(
  badge: BadgeDefLite,
  locked: boolean,
  modeId: "daily" | "hard",
  row: UserBadgeRow | null,
): string {
  const modeLabel = modeId === "daily" ? "IPL daily" : "IPL hard mode";
  if (locked) {
    return `${badge.hint} Play ${modeLabel} to earn this badge.`;
  }
  if (badge.id === "stumpd-1") {
    const n = stumpdCount(row, badge.id);
    if (n <= 0) return badge.hint;
    return `You earned this badge ${n} time${n === 1 ? "" : "s"} by solving in one guess (${modeLabel}).`;
  }
  if (badge.id === "stumpd-2") {
    const n = stumpdCount(row, badge.id);
    if (n <= 0) return badge.hint;
    return `You earned this badge ${n} time${n === 1 ? "" : "s"} by solving in two guesses (${modeLabel}).`;
  }
  if (badge.id.startsWith("streak-")) {
    const days = badge.id.replace("streak-", "");
    return `You earned this badge by reaching a ${days}-day win streak on ${modeLabel}.`;
  }
  return badge.hint;
}

/** Pixel offsets from halo center — Wordle-style confetti squares */
const CONFETTI_PRESETS = [
  { x: -92, y: -48, s: 5, d: 0, r: -8 },
  { x: 78, y: -62, s: 4, d: 0.12, r: 15 },
  { x: -38, y: 72, s: 5, d: 0.28, r: -12 },
  { x: 95, y: 38, s: 4, d: 0.05, r: 22 },
  { x: -72, y: 58, s: 3, d: 0.4, r: 5 },
  { x: 52, y: -78, s: 4, d: 0.22, r: -18 },
  { x: 12, y: -95, s: 5, d: 0.18, r: 10 },
  { x: -105, y: 18, s: 4, d: 0.33, r: -5 },
  { x: 88, y: -28, s: 3, d: 0.45, r: 20 },
  { x: -55, y: -82, s: 4, d: 0.08, r: -25 },
  { x: 28, y: 88, s: 5, d: 0.52, r: 8 },
  { x: -18, y: 102, s: 3, d: 0.38, r: -15 },
  { x: 108, y: -8, s: 4, d: 0.6, r: 12 },
  { x: -48, y: 22, s: 4, d: 0.15, r: -30 },
  { x: 62, y: 68, s: 3, d: 0.48, r: 6 },
  { x: -88, y: -88, s: 4, d: 0.25, r: 18 },
] as const;

const RAY_COUNT = 18;

type Props = {
  modeId: "daily" | "hard";
  badge: BadgeDefLite;
  locked: boolean;
  row: UserBadgeRow | null;
  onClose: () => void;
};

export default function BadgeDetailModal({ modeId, badge, locked, row, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const src = badgeImageSrc(modeId, badge.id);
  const iso = lastEarnedIso(row, badge.id);
  const eyebrow = !locked && iso ? formatLastEarnedLine(iso) : null;
  const count = stumpdCount(row, badge.id);
  const showPill = !locked && (badge.id === "stumpd-1" || badge.id === "stumpd-2") && count > 0;
  const glowClass =
    locked ? "" : modeId === "daily" ? "badge-detail__hero--glow-daily" : "badge-detail__hero--glow-hard";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const desc = buildDescription(badge, locked, modeId, row);

  return (
    <div className="badge-detail-backdrop" onClick={onClose} role="presentation">
      <div
        className="badge-detail-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className="badge-detail-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {eyebrow && <p className="badge-detail__eyebrow">{eyebrow}</p>}

        {!locked && (
          <div
            className={`badge-detail__burst-wrap badge-detail__burst-wrap--${modeId}`}
            aria-hidden
          >
            <div
              className={`badge-detail__burst-hub${eyebrow ? " badge-detail__burst-hub--with-eyebrow" : " badge-detail__burst-hub--no-eyebrow"}`}
            >
              {Array.from({ length: RAY_COUNT }, (_, i) => (
                <span
                  key={i}
                  className="badge-detail__ray"
                  style={{ "--a": `${(360 / RAY_COUNT) * i}deg` } as CSSProperties}
                />
              ))}
            </div>
          </div>
        )}

        <div className={["badge-detail__hero", glowClass].filter(Boolean).join(" ")}>
          {!locked && (
            <div className="badge-detail__halo" aria-hidden>
              <div className="badge-detail__ring badge-detail__ring--1" />
              <div className="badge-detail__ring badge-detail__ring--2" />
              <div className="badge-detail__ring badge-detail__ring--3" />
              <div className="badge-detail__halo-inner" />
              <div className="badge-detail__confetti" aria-hidden>
                {CONFETTI_PRESETS.map((c, i) => (
                  <span
                    key={i}
                    className="badge-detail__confetti-bit"
                    style={
                      {
                        "--cx": `${c.x}px`,
                        "--cy": `${c.y}px`,
                        "--sz": `${c.s}px`,
                        "--rot": `${c.r}deg`,
                        animationDelay: `${c.d}s`,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            </div>
          )}
          {src ? (
            <div className="badge-detail__img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element -- natural aspect ratio from /public/badges */}
              <img src={src} alt={badge.title} className="badge-detail__img" decoding="async" />
            </div>
          ) : null}
        </div>

        <div className="badge-detail__title-row">
          <h2 id="badge-detail-title" className="badge-detail__title">
            {badge.title}
          </h2>
          {showPill && <span className="badge-detail__pill">×{count}</span>}
        </div>

        <p className="badge-detail__desc">{desc}</p>

        <button
          type="button"
          className="badge-detail__done"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
