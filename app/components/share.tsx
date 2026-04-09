"use client";

import { useState, useEffect, useRef } from "react";
import type { GameStats, LiveStats } from "./games";
import NextPuzzleTimer from "./timers";
import ReminderPrompt from "./reminder-prompt";
import { register, login, isLoggedIn, postGameResult } from "../services/auth-api";
import type { GameResultPayload } from "../services/auth-api";
import { readStats } from "../stumpd/stats-storage";
import { getAccuracyBadge } from "../utils/accuracy-badge";
import { SITE_URL } from "../../lib/site";
import { fetchTodayLeaderboard } from "../services/leaderboard-api";
import type { TodayEntry } from "../services/leaderboard-api";
import { dispatchOpenLeaderboard } from "./leaderboard-open";

const STATUS_EMOJI: Record<string, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬜",
};

const WORD_LENGTH = 5;

const FALLBACK_DISTRIBUTION = [5, 12, 28, 30, 17, 8];
const FALLBACK_PLAYED_TODAY = 8_901;

type Props = {
  won: boolean;
  answer: string;
  guessCount: number;
  statuses: string[][];
  stats: GameStats;
  elapsedSeconds: number;
  onClose: () => void;
  gameTitle?: string;
  puzzleDay?: number;
  hintsUsed?: number;
  maxHints?: number;
  liveStats?: LiveStats | null;
  gameResultPayload?: GameResultPayload | null;
  onAuthChange?: () => Promise<void> | void;
  todayRank?: number;
};

function formatCompactCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function getTopPercent(guessCount: number, dist: number[]): number {
  let cumulative = 0;
  for (let i = 0; i < guessCount && i < dist.length; i++) {
    cumulative += dist[i];
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
  const badge = getAccuracyBadge(true, guessCount);
  return (
    <div className="share-hero">
      <div className="share-hero__badge">
        <span className="share-hero__pct">Top {topPercent}%</span>
        <span className="share-hero__today">today</span>
      </div>
      <p className="share-hero__score">
        You got it in <strong>{guessCount}/6</strong> — <span className="share-hero__accuracy">{badge.label} {badge.emoji}</span>
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

function ShareCommunityPulse({
  variant,
  beatPercent,
  guessedInPercent,
  guessCount,
  playedToday,
  solvedPercent,
}: {
  variant: "win" | "loss";
  beatPercent?: number;
  guessedInPercent?: number;
  guessCount?: number;
  playedToday: number;
  solvedPercent: number;
}) {
  if (variant === "win" && beatPercent != null && guessedInPercent != null && guessCount != null) {
    return (
      <div className="share-community-pulse">
        <p className="share-community-pulse__eyebrow">Live from today&apos;s players</p>
        <div className="share-community-pulse__grid">
          <div className="share-community-pulse__cell">
            <span className="share-community-pulse__value">{formatCompactCount(playedToday)}</span>
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

  const modeLabel = "5+";

  return (
    <div className="share-community-pulse share-community-pulse--loss">
      <p className="share-community-pulse__eyebrow">You&apos;re not alone</p>
      <div className="share-community-pulse__grid">
        <div className="share-community-pulse__cell">
          <span className="share-community-pulse__value">{solvedPercent}%</span>
          <span className="share-community-pulse__label">solved today</span>
        </div>
        <div className="share-community-pulse__cell">
          <span className="share-community-pulse__value">{modeLabel}</span>
          <span className="share-community-pulse__label">tries for most</span>
        </div>
        <div className="share-community-pulse__cell">
          <span className="share-community-pulse__value">{formatCompactCount(playedToday)}</span>
          <span className="share-community-pulse__label">played today</span>
        </div>
      </div>
    </div>
  );
}

function DistributionChart({ userGuess, won, distribution }: { userGuess: number; won: boolean; distribution: number[] }) {
  const maxVal = Math.max(...distribution) || 1;
  return (
    <div className="share-dist share-dist--compact">
      <h3 className="share-dist__title">Guess Distribution</h3>
      {distribution.map((pct, i) => {
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

function MiniTodayLeaderboard({ puzzleDay, refreshKey }: { puzzleDay?: number; refreshKey?: number }) {
  const [rows, setRows] = useState<TodayEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (puzzleDay == null) return;
    let cancelled = false;
    setLoaded(false);
    fetchTodayLeaderboard(puzzleDay)
      .then((d) => { if (!cancelled) setRows(d.slice(0, 5)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [puzzleDay, refreshKey]);

  if (!loaded || rows.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="share-mini-lb">
      <p className="share-mini-lb__eyebrow">Today&apos;s Top Players</p>
      <table className="share-mini-lb__table">
        <thead>
          <tr>
            <th className="share-mini-lb__th share-mini-lb__th--rank">#</th>
            <th className="share-mini-lb__th share-mini-lb__th--email">Player</th>
            <th className="share-mini-lb__th share-mini-lb__th--num">Guesses</th>
            <th className="share-mini-lb__th share-mini-lb__th--num">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const m = r.time_seconds != null ? Math.floor(r.time_seconds / 60) : 0;
            const s = r.time_seconds != null ? r.time_seconds % 60 : 0;
            const timeStr = r.time_seconds != null ? `${m}:${String(s).padStart(2, "0")}` : "—";
            return (
              <tr key={r.rank} className={r.rank <= 3 ? "share-mini-lb__row share-mini-lb__row--top" : "share-mini-lb__row"}>
                <td className="share-mini-lb__td share-mini-lb__td--rank">
                  {r.rank <= 3 ? medals[r.rank - 1] : r.rank}
                </td>
                <td className="share-mini-lb__td share-mini-lb__td--email">{r.email.split("@")[0]}</td>
                <td className="share-mini-lb__td share-mini-lb__td--num">{r.num_guesses}/6</td>
                <td className="share-mini-lb__td share-mini-lb__td--num">{timeStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button
        type="button"
        className="share-mini-lb__more"
        onClick={() => dispatchOpenLeaderboard()}
      >
        View full leaderboard
      </button>
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
      <p className="share-loss-hero__msg"><span className="share-hero__accuracy share-hero__accuracy--loss">Golden Duck 🦆</span></p>
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

function LeaderboardNudge({ won }: { won: boolean }) {
  if (isLoggedIn()) return null;
  return (
    <div className="share-lb-nudge">
      <span className="share-lb-nudge__icon" aria-hidden>&#127942;</span>
      <p className="share-lb-nudge__text">
        {won
          ? "You're eligible for the leaderboard! Log in to claim your spot."
          : "Log in to track your progress on the leaderboard."}
      </p>
    </div>
  );
}

function SignupPrompt({
  gameResultPayload,
  onAuthChange,
}: {
  gameResultPayload?: GameResultPayload | null;
  onAuthChange?: () => Promise<void> | void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("register");

  const passwordTooShort = passwordTouched && password.length > 0 && password.length < 6;

  if (isLoggedIn() || done) {
    return done ? (
      <div className="share-signup share-signup--done">
        <p className="share-signup__success">Stats saved to your account!</p>
      </div>
    ) : null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setPasswordTouched(true);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const localStats = readStats();
      if (mode === "register") {
        await register(email, password, gameResultPayload ?? undefined, localStats);
      } else {
        await login(email, password, localStats);
      }
      setDone(true);
      onAuthChange?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (mode === "register" && msg.includes("already registered")) {
        setError("Email already registered — try logging in instead");
        setMode("login");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="share-signup">
      <p className="share-signup__eyebrow">
        {mode === "register" ? "Save progress across devices" : "Welcome back"}
      </p>
      <form className="share-signup__form" onSubmit={handleSubmit}>
        <input
          className="share-signup__input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <div className="share-signup__field">
          <input
            className={`share-signup__input${passwordTooShort ? " share-signup__input--invalid" : ""}`}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            required
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
          {passwordTooShort && (
            <p className="share-signup__hint">
              {6 - password.length} more character{6 - password.length !== 1 ? "s" : ""} needed
            </p>
          )}
        </div>
        {error && <p className="share-signup__error">{error}</p>}
        <button
          type="submit"
          className="share-signup__btn"
          disabled={loading}
        >
          {loading ? "..." : mode === "register" ? "Save & Continue" : "Log in"}
        </button>
      </form>
      <button
        type="button"
        className="share-signup__toggle"
        onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); setPasswordTouched(false); }}
      >
        {mode === "register" ? "Already have an account? Log in" : "New here? Create account"}
      </button>
    </div>
  );
}

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ShareModal({ won, answer, guessCount, statuses, stats, elapsedSeconds, onClose, gameTitle, puzzleDay, hintsUsed, maxHints, liveStats, gameResultPayload, onAuthChange, todayRank }: Props) {
  void answer;
  const [copied, setCopied] = useState(false);
  const [lbRefreshKey, setLbRefreshKey] = useState(0);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current); }, []);
  const isStumpd = !!gameTitle;
  const badge = getAccuracyBadge(won, guessCount);

  const dist = liveStats?.distribution ?? FALLBACK_DISTRIBUTION;
  const playedToday = liveStats?.totalPlayed ?? FALLBACK_PLAYED_TODAY;
  const totalWon = liveStats?.totalWon ?? 0;
  const solvedPercent = playedToday > 0 ? Math.round((totalWon / playedToday) * 100) : 18;

  const topPercent = getTopPercent(guessCount, dist);
  const beatPercent = 100 - topPercent;
  const guessedInPercent = dist[guessCount - 1] ?? 10;
  const correctLetters = bestCorrectCount(statuses);

  const gridRows = statuses
    .slice(0, guessCount)
    .map(row => row.map(s => STATUS_EMOJI[s]).join(""));

  const timeStr = formatElapsed(elapsedSeconds);
  const summaryLine = isStumpd
    ? (won
      ? `${guessCount}/6 | ⏱ ${timeStr}`
      : `X/6 | ${correctLetters}/${WORD_LENGTH} letters | ⏱ ${timeStr}`)
    : (won
      ? `${guessCount}/6 | Top ${topPercent}% | ⏱ ${timeStr}`
      : `X/6 | ${correctLetters}/${WORD_LENGTH} letters | ⏱ ${timeStr}`);

  const handleCopy = () => {
    const header = `🏏 Stumpd #${puzzleDay ?? "?"}`;
    const streakLine = stats.currentStreak > 1 ? `🔥 ${stats.currentStreak}-day streak` : "";
    const srDenom = guessCount + elapsedSeconds / 60;
    const strikeRate = srDenom > 0 ? Math.round((WORD_LENGTH * 100) / srDenom) : 0;

    // Trailing double-space on each non-blank line produces a markdown <br>,
    // so line breaks survive Reddit / Discord / any markdown renderer.
    const fmt = (lines: (string | undefined)[]) =>
      lines
        .filter((l): l is string => l !== undefined)
        .map(l => (l === "" ? "" : l + "  "))
        .join("\n");

    let full: string;
    if (won) {
      const ballsWord = guessCount === 1 ? "ball" : "balls";
      const chaseLine = guessCount === 6
        ? "Last-ball finish!"
        : `Chased it in ${guessCount} ${ballsWord}`;
      const hintsFlex = hintsUsed === 0 ? " · No hints" : "";
      const lbLine = todayRank && todayRank > 0 && todayRank <= 10
        ? `📊 #${todayRank} on today's leaderboard`
        : undefined;
      full = fmt([
        header,
        "",
        `${badge.emoji} ${badge.label}`,
        `${chaseLine}${hintsFlex}`,
        `⚡ SR: ${strikeRate} | ⏱ ${timeStr}`,
        streakLine || undefined,
        lbLine,
        "",
        ...gridRows,
        "",
        "Can you beat me?",
        SITE_URL,
      ]);
    } else {
      full = fmt([
        header,
        "",
        `🦆 Golden Duck · Bowled out · ${correctLetters}/${WORD_LENGTH} letters`,
        `⏱ ${timeStr}`,
        "",
        ...gridRows,
        "",
        "Tomorrow's a new innings",
        SITE_URL,
      ]);
    }

    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2500);
    }).catch(() => { /* clipboard permission denied or unavailable */ });
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
        </div>

        <div className="share-modal-scroll">
          {won ? (
            <>
              <HeroBlock guessCount={guessCount} topPercent={topPercent} elapsedSeconds={elapsedSeconds} />
              <LeaderboardNudge won={won} />
              <SignupPrompt
                gameResultPayload={gameResultPayload}
                onAuthChange={async () => { await onAuthChange?.(); setLbRefreshKey(k => k + 1); }}
              />
              <SharePersonalStats stats={stats} />
              <ShareCommunityPulse
                variant="win"
                beatPercent={beatPercent}
                guessedInPercent={guessedInPercent}
                guessCount={guessCount}
                playedToday={playedToday}
                solvedPercent={solvedPercent}
              />
              <MiniTodayLeaderboard puzzleDay={puzzleDay} refreshKey={lbRefreshKey} />
              <DistributionChart userGuess={guessCount} won={won} distribution={dist} />
            </>
          ) : (
            <>
              <LossHero correctLetters={correctLetters} elapsedSeconds={elapsedSeconds} />
              <LeaderboardNudge won={won} />
              <SignupPrompt
                gameResultPayload={gameResultPayload}
                onAuthChange={async () => { await onAuthChange?.(); setLbRefreshKey(k => k + 1); }}
              />
              <SharePersonalStats stats={stats} />
              <ShareCommunityPulse
                variant="loss"
                playedToday={playedToday}
                solvedPercent={solvedPercent}
              />
              <MiniTodayLeaderboard puzzleDay={puzzleDay} refreshKey={lbRefreshKey} />
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
