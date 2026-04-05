"use client";

import { useState } from "react";
import type { GameStats } from "./games";
import NextPuzzleTimer from "./timers";
import ReminderPrompt from "./reminder-prompt";

const STATUS_EMOJI: Record<string, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬜",
};

const WORD_LENGTH = 5;

type Props = {
  won: boolean;
  answer: string;
  guessCount: number;
  statuses: string[][];
  stats: GameStats;
  elapsedSeconds: number;
  onClose: () => void;
  /** Stumpd-specific: game title shown in share card (e.g. "Stumpd") */
  gameTitle?: string;
  /** Stumpd-specific: puzzle day number */
  puzzleDay?: number;
  /** Stumpd-specific: how many hint tokens were spent */
  hintsUsed?: number;
  /** Stumpd-specific: maximum hint tokens available */
  maxHints?: number;
};

const DISTRIBUTION = [5, 12, 28, 30, 17, 8];
const PLAYED_TODAY = 8_901;

function formatCompactCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function getTopPercent(guessCount: number): number {
  let cumulative = 0;
  for (let i = 0; i < guessCount && i < DISTRIBUTION.length; i++) {
    cumulative += DISTRIBUTION[i];
  }
  return cumulative;
}

function bestCorrectCount(statuses: string[][]): number {
  let max = 0;
  for (const row of statuses) {
    const count = row.filter(s => s === "correct").length;
    if (count > max) max = count;
  }
  return max;
}

/* ── Win sub-components ── */

function HeroBlock({ guessCount, topPercent, elapsedSeconds }: { guessCount: number; topPercent: number; elapsedSeconds: number }) {
  return (
    <div className="share-hero">
      <div className="share-hero__badge">
        <span className="share-hero__pct">Top {topPercent}%</span>
        <span className="share-hero__today">today</span>
      </div>
      <p className="share-hero__score">
        You got it in <strong>{guessCount}/6</strong>
      </p>
      <p className="share-hero__time">
        <span className="share-hero__time-icon">⏱</span> {formatElapsed(elapsedSeconds)}
      </p>
    </div>
  );
}

function SharePersonalStats({ stats }: { stats: GameStats }) {
  const winPct = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  return (
    <div className="share-personal-stats">
      <h3 className="share-personal-stats__title">Statistics</h3>
      <div className="share-personal-stats__row" role="list">
        <div className="share-personal-stats__col" role="listitem">
          <span className="share-personal-stats__val">{stats.gamesPlayed}</span>
          <span className="share-personal-stats__label">Played</span>
        </div>
        <div className="share-personal-stats__divider" aria-hidden="true" />
        <div className="share-personal-stats__col" role="listitem">
          <span className="share-personal-stats__val">{winPct}</span>
          <span className="share-personal-stats__label">Win %</span>
        </div>
        <div className="share-personal-stats__divider" aria-hidden="true" />
        <div className="share-personal-stats__col" role="listitem">
          <span className="share-personal-stats__val">{stats.currentStreak}</span>
          <span className="share-personal-stats__label share-personal-stats__label--twoline">
            Current<br />streak
          </span>
        </div>
        <div className="share-personal-stats__divider" aria-hidden="true" />
        <div className="share-personal-stats__col" role="listitem">
          <span className="share-personal-stats__val">{stats.maxStreak}</span>
          <span className="share-personal-stats__label share-personal-stats__label--twoline">
            Max<br />streak
          </span>
        </div>
      </div>
    </div>
  );
}

/** Launch social proof — compact grid so the modal stays scannable */
function ShareCommunityPulse({
  variant,
  beatPercent,
  guessedInPercent,
  guessCount,
}: {
  variant: "win" | "loss";
  beatPercent?: number;
  guessedInPercent?: number;
  guessCount?: number;
}) {
  if (variant === "win" && beatPercent != null && guessedInPercent != null && guessCount != null) {
    return (
      <div className="share-community-pulse">
        <p className="share-community-pulse__eyebrow">Live from today&apos;s players</p>
        <div className="share-community-pulse__grid">
          <div className="share-community-pulse__cell">
            <span className="share-community-pulse__value">{formatCompactCount(PLAYED_TODAY)}</span>
            <span className="share-community-pulse__label">played today</span>
          </div>
          <div className="share-community-pulse__cell">
            <span className="share-community-pulse__value">{beatPercent}%</span>
            <span className="share-community-pulse__label">you beat</span>
          </div>
          <div className="share-community-pulse__cell">
            <span className="share-community-pulse__value">{guessedInPercent}%</span>
            <span className="share-community-pulse__label">solved in {guessCount}</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="share-community-pulse share-community-pulse--loss">
      <p className="share-community-pulse__eyebrow">You&apos;re not alone</p>
      <div className="share-community-pulse__grid">
        <div className="share-community-pulse__cell">
          <span className="share-community-pulse__value">18%</span>
          <span className="share-community-pulse__label">solved today</span>
        </div>
        <div className="share-community-pulse__cell">
          <span className="share-community-pulse__value">5+</span>
          <span className="share-community-pulse__label">tries for most</span>
        </div>
        <div className="share-community-pulse__cell">
          <span className="share-community-pulse__value">{formatCompactCount(PLAYED_TODAY)}</span>
          <span className="share-community-pulse__label">played today</span>
        </div>
      </div>
    </div>
  );
}

function DistributionChart({ userGuess, won }: { userGuess: number; won: boolean }) {
  const maxVal = Math.max(...DISTRIBUTION);
  return (
    <div className="share-dist share-dist--compact">
      <h3 className="share-dist__title">Guess Distribution</h3>
      {DISTRIBUTION.map((pct, i) => {
        const num = i + 1;
        const isHl = won && num === userGuess;
        const barW = Math.max((pct / maxVal) * 100, 8);
        return (
          <div
            key={num}
            className={`share-dist__row${isHl ? " share-dist__row--hl" : ""}`}
            style={{ "--row-delay": `${i * 60}ms` } as React.CSSProperties}
          >
            <span className="share-dist__num">{num}</span>
            <div className="share-dist__track">
              <div
                className={`share-dist__bar${isHl ? " share-dist__bar--hl" : ""}`}
                style={{ "--bar-w": `${barW}%`, "--bar-delay": `${300 + i * 80}ms` } as React.CSSProperties}
              />
            </div>
            <span className="share-dist__pct">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Loss sub-components ── */

function LossHero({ correctLetters, elapsedSeconds }: { correctLetters: number; elapsedSeconds: number }) {
  return (
    <div className="share-loss-hero">
      <div className="share-loss-hero__badge">
        <span className="share-loss-hero__count">{correctLetters}/{WORD_LENGTH}</span>
        <span className="share-loss-hero__label">letters right</span>
      </div>
      <p className="share-loss-hero__msg">You were so close!</p>
      <p className="share-loss-hero__time">
        <span className="share-loss-hero__time-icon">⏱</span> {formatElapsed(elapsedSeconds)}
      </p>
    </div>
  );
}

/* ── Shared ── */

const STATUS_TILE_COLOR: Record<string, string> = {
  correct: "#6aaa64",
  present: "#c9b458",
  absent:  "#d3d6da",
};

function SharePreviewCard({
  statuses,
  guessCount,
  summaryLine,
  gameTitle,
  puzzleDay,
  hintsUsed,
  maxHints,
}: {
  statuses: string[][];
  guessCount: number;
  summaryLine: string;
  gameTitle?: string;
  puzzleDay?: number;
  hintsUsed?: number;
  maxHints?: number;
}) {
  const rows = statuses.slice(0, guessCount);
  const isStumpd = !!gameTitle;
  return (
    <div className={`share-preview-card share-preview-card--compact${isStumpd ? " share-preview-card--stumpd" : ""}`}>
      {isStumpd && (
        <div className="share-preview-card__stumpd-header">
          <span className="share-preview-card__stumpd-title">
            {gameTitle} #{puzzleDay ?? "?"}
          </span>
          {hintsUsed != null && maxHints != null && (
            <span className="share-preview-card__stumpd-hints">
              Hints used: {hintsUsed}/{maxHints}
            </span>
          )}
        </div>
      )}
      <div className="share-preview-card__grid">
        {rows.map((row, r) => (
          <div key={r} className="share-preview-card__row">
            {row.map((s, c) => (
              <span
                key={c}
                className="share-preview-card__tile"
                style={{ background: STATUS_TILE_COLOR[s] ?? "#d3d6da" }}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="share-preview-card__summary">{summaryLine}</p>
      <p className="share-preview-card__url">playstumpd.com</p>
    </div>
  );
}

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ShareModal({ won, answer, guessCount, statuses, stats, elapsedSeconds, onClose, gameTitle, puzzleDay, hintsUsed, maxHints }: Props) {
  void answer;
  const [copied, setCopied] = useState(false);
  const isStumpd = !!gameTitle;

  const topPercent = getTopPercent(guessCount);
  const beatPercent = 100 - topPercent;
  const guessedInPercent = DISTRIBUTION[guessCount - 1] ?? 10;
  const correctLetters = bestCorrectCount(statuses);

  const emojiGrid = statuses
    .slice(0, guessCount)
    .map(row => row.map(s => STATUS_EMOJI[s]).join(""))
    .join("\n");

  const timeStr = formatElapsed(elapsedSeconds);
  const summaryLine = isStumpd
    ? (won
      ? `${guessCount}/6 | ⏱ ${timeStr}`
      : `X/6 | ${correctLetters}/${WORD_LENGTH} letters | ⏱ ${timeStr}`)
    : (won
      ? `${guessCount}/6 | Top ${topPercent}% | ⏱ ${timeStr}`
      : `X/6 | ${correctLetters}/${WORD_LENGTH} letters | ⏱ ${timeStr}`);

  const handleCopy = () => {
    let full: string;
    if (isStumpd) {
      const header = `🏏 ${gameTitle} #${puzzleDay ?? "?"}`;
      const hintsLine = hintsUsed != null && maxHints != null ? `\nHints used: ${hintsUsed}/${maxHints}` : "";
      const scoreLine = won
        ? `${guessCount}/6 | ⏱ ${timeStr}`
        : `X/6 | ${correctLetters}/${WORD_LENGTH} letters | ⏱ ${timeStr}`;
      full = `${header}${hintsLine}\n${scoreLine}\n\n${emojiGrid}\n\nCan you beat me?\n${window.location.href}`;
    } else {
      full = won
        ? ["🏏 Stumpd", `${guessCount}/6 | Top ${topPercent}% | ⏱ ${timeStr}`, "", "", emojiGrid, "", "", "🏆 Can you beat me?", window.location.href].join("\n")
        : ["🏏 Stumpd", `X/6 — Almost had it! | ⏱ ${timeStr}`, "", "", emojiGrid, "", "", "🏆 Can you beat me?", window.location.href].join("\n");
    }

    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="share-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="share-modal-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button type="button" className="share-modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="share-modal-header">
          {won ? (
            <div className="share-star-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
              </svg>
            </div>
          ) : (
            <div className="share-loss-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="15" x2="16" y2="15" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
          )}
          <h2 className="share-modal-title">
            {won ? "Congratulations!" : "Almost had it!"}
          </h2>
          {won && (
            <p className="share-modal-subtitle">
              You cracked it — <span className="share-modal-subtitle--accent">worth flexing.</span>
            </p>
          )}
          {!won && (
            <p className="share-modal-subtitle">
              Tough puzzle — <span className="share-modal-subtitle--accent">still worth the challenge.</span>
            </p>
          )}
        </div>

        <div className="share-modal-scroll">
          {won ? (
            <>
              <HeroBlock guessCount={guessCount} topPercent={topPercent} elapsedSeconds={elapsedSeconds} />
              <SharePersonalStats stats={stats} />
              <ShareCommunityPulse
                variant="win"
                beatPercent={beatPercent}
                guessedInPercent={guessedInPercent}
                guessCount={guessCount}
              />
              <DistributionChart userGuess={guessCount} won={won} />
            </>
          ) : (
            <>
              <LossHero correctLetters={correctLetters} elapsedSeconds={elapsedSeconds} />
              <SharePersonalStats stats={stats} />
              <ShareCommunityPulse variant="loss" />
              <div className="share-loss-timer">
                <NextPuzzleTimer />
              </div>
            </>
          )}

          <SharePreviewCard
            statuses={statuses}
            guessCount={guessCount}
            summaryLine={summaryLine}
            gameTitle={gameTitle}
            puzzleDay={puzzleDay}
            hintsUsed={hintsUsed}
            maxHints={maxHints}
          />
        </div>

        <div className="share-modal-sticky-cta">
          <p className="share-cta-primer">
            {copied
              ? "Paste anywhere — let the grid do the talking."
              : won
                ? "You did the hard part. One tap ships the proof."
                : "Share the grid — dare someone to beat your read."}
          </p>
          <button
            type="button"
            className={`share-modal-share-btn${copied ? " share-modal-share-btn--copied" : ""}`}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                Share Result
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </>
            )}
          </button>
          <div className="share-modal-footnotes">
            <p className="share-modal-share-sub share-modal-footnote-pop">
              {copied
                ? "Your streak and stats stay on this device — the grid is what travels."
                : won
                  ? "Bragging rights included."
                  : "Tag the friend who thinks they're sharper."}
            </p>
            <ReminderPrompt variant="inline" />
          </div>
        </div>
      </div>
    </div>
  );
}
