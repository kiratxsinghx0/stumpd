"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PageHeader, {
  OPEN_HOW_TO_PLAY_EVENT,
  OPEN_LEADERBOARD_EVENT,
  OPEN_SETTINGS_EVENT,
  dispatchLeaderboardState,
} from "../components/page-header";
import HowToPlayModal from "../components/how-to-play-modal";
import LeaderboardModal from "../components/leaderboard-modal";
import SettingsModal from "../components/settings-modal";
import StumpdHowToPlay from "../stumpd/stumpd-how-to-play";
import BadgeDetailModal from "../components/badge-detail-modal";
import { badgeImageSrc } from "../lib/badge-image-src";
import type { BadgeDef } from "../lib/user-badge-defs";
import { rowToBadgeDefs, getStreakMilestoneProgress } from "../lib/user-badge-defs";
import { fetchMyBadges, type UserBadgeRow } from "../services/badges-api";
import { fetchMyStats, fetchMyHardModeStats, getStoredToken } from "../services/auth-api";
import { fetchPuzzleToday, fetchHardModePuzzleToday } from "../services/ipl-api";
import { isGodmodeActive } from "../utils/godmode-status";
import { readStreaks } from "../stumpd/stats-storage";

function BadgeCard({
  modeId,
  badge,
  locked,
  onOpen,
  streakProgress,
}: {
  modeId: "daily" | "hard";
  badge: BadgeDef;
  locked: boolean;
  onOpen: () => void;
  streakProgress?: { current: number; target: number } | null;
}) {
  const src = badgeImageSrc(modeId, badge.id);
  const pct =
    streakProgress && streakProgress.target > 0
      ? Math.round((streakProgress.current / streakProgress.target) * 100)
      : 0;
  return (
    <button
      type="button"
      className={`badges-card badges-card--btn${locked ? " badges-card--locked" : " badges-card--earned"}`}
      aria-label={`${badge.title}${locked ? " (locked)" : ""}`}
      onClick={onOpen}
    >
      <div className={`badges-card__thumb${locked ? " badges-card__thumb--locked" : ""}`}>
        {src ? (
          <Image
            src={src}
            alt={badge.title}
            width={72}
            height={72}
            className="badges-card__img"
            loading="lazy"
            unoptimized
          />
        ) : null}
        {locked && (
          <span className="badges-card__lock" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </div>
      <div className="badges-card__body">
        <span className="badges-card__title">{badge.title}</span>
        {streakProgress ? (
          <div
            className="badges-card__streak-progress"
            aria-label={`${streakProgress.current} of ${streakProgress.target} puzzle days toward this streak badge`}
          >
            <div className="badges-card__streak-track">
              <div
                className="badges-card__streak-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="badges-card__streak-count">
              {streakProgress.current}/{streakProgress.target}
            </span>
          </div>
        ) : null}
        <span className="badges-card__hint">{badge.hint}</span>
        {!locked && badge.detail && <span className="badges-card__meta">{badge.detail}</span>}
      </div>
    </button>
  );
}

function ModeSection({
  modeId,
  title,
  subtitle,
  row,
  onOpenBadge,
  modeCurrentStreak,
}: {
  modeId: "daily" | "hard";
  title: string;
  subtitle: string;
  row: UserBadgeRow | null;
  onOpenBadge: (payload: { modeId: "daily" | "hard"; badge: BadgeDef; locked: boolean; row: UserBadgeRow | null }) => void;
  modeCurrentStreak: number;
}) {
  const defs = useMemo(() => rowToBadgeDefs(row), [row]);
  const earned = defs.filter((b) => b.earned);
  const locked = defs.filter((b) => !b.earned);

  return (
    <section
      className={`badges-mode badges-mode--${modeId}`}
      aria-labelledby={`badges-heading-${modeId}`}
    >
      <header className="badges-mode__head">
        <h2 id={`badges-heading-${modeId}`} className="badges-mode__title">
          {title}
        </h2>
        <p className="badges-mode__sub">{subtitle}</p>
      </header>

      <h3 className="badges-section-label">Earned ({earned.length})</h3>
      {earned.length === 0 ? (
        <p className="badges-empty">None yet — keep playing!</p>
      ) : (
        <ul className="badges-grid">
          {earned.map((b) => (
            <li key={b.id}>
              <BadgeCard
                modeId={modeId}
                badge={b}
                locked={false}
                onOpen={() => onOpenBadge({ modeId, badge: b, locked: false, row })}
              />
            </li>
          ))}
        </ul>
      )}

      <h3 className="badges-section-label badges-section-label--muted">Not yet earned ({locked.length})</h3>
      {locked.length === 0 ? (
        <p className="badges-empty badges-empty--done">You have every badge in this mode.</p>
      ) : (
        <ul className="badges-grid">
          {locked.map((b) => (
            <li key={b.id}>
              <BadgeCard
                modeId={modeId}
                badge={b}
                locked
                streakProgress={getStreakMilestoneProgress(b.id, true, row, modeCurrentStreak)}
                onOpen={() => onOpenBadge({ modeId, badge: b, locked: true, row })}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function BadgesPage() {
  const [loading, setLoading] = useState(true);
  const [normal, setNormal] = useState<UserBadgeRow | null>(null);
  const [hard, setHard] = useState<UserBadgeRow | null>(null);
  const [normalStreak, setNormalStreak] = useState(0);
  const [hardStreak, setHardStreak] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [badgeDetail, setBadgeDetail] = useState<{
    modeId: "daily" | "hard";
    badge: BadgeDef;
    locked: boolean;
    row: UserBadgeRow | null;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [puzzleDay, setPuzzleDay] = useState<number | undefined>(undefined);
  const [hardModePuzzleDay, setHardModePuzzleDay] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetchPuzzleToday().then((p) => setPuzzleDay(p.day)).catch(() => {});
    fetchHardModePuzzleToday().then((p) => setHardModePuzzleDay(p.day)).catch(() => {});
  }, []);

  useEffect(() => {
    const onOpenSettings = () => setShowSettings(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpenSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpenSettings);
  }, []);

  useEffect(() => {
    const onOpenLb = () => setShowLeaderboard(true);
    window.addEventListener(OPEN_LEADERBOARD_EVENT, onOpenLb);
    return () => window.removeEventListener(OPEN_LEADERBOARD_EVENT, onOpenLb);
  }, []);

  useEffect(() => {
    const onOpenHtp = () => setShowHowToPlay(true);
    window.addEventListener(OPEN_HOW_TO_PLAY_EVENT, onOpenHtp);
    return () => window.removeEventListener(OPEN_HOW_TO_PLAY_EVENT, onOpenHtp);
  }, []);

  useEffect(() => {
    dispatchLeaderboardState(showLeaderboard);
  }, [showLeaderboard]);

  useEffect(() => {
    const token = getStoredToken();
    setHasToken(!!token);
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [badgeData, statsN, statsH] = await Promise.all([
        fetchMyBadges(),
        fetchMyStats(),
        fetchMyHardModeStats(),
      ]);
      if (cancelled) return;
      if (!badgeData) {
        setError("Could not load badges.");
      } else {
        setNormal(badgeData.normal);
        setHard(badgeData.hard);
      }
      setNormalStreak(statsN?.currentStreak ?? readStreaks("normal").currentStreak);
      setHardStreak(statsH?.currentStreak ?? readStreaks("hard").currentStreak);
      setLoading(false);
    })().catch(() => {
      if (!cancelled) {
        setError("Could not load badges.");
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loggedOut = !loading && !hasToken;

  return (
    <main className="hub-page badges-page">
      <PageHeader showHowToPlay={false} logoSrc="/stumpd-logo.png" logoAlt="Stumpd" />
      <nav className="badges-topbar" aria-label="Page shortcuts">
        <Link href="/profile" className="badges-back badges-back--subnav" aria-label="Back to profile">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
        {hasToken ? (
          <Link href="/profile" className="badges-topbar__link">
            Profile
          </Link>
        ) : null}
      </nav>
      <div className="badges-shell">
        <header className="badges-header badges-header--title-block">
          <h1 className="badges-header__title">Badges</h1>
          <p className="badges-header__desc">
            Streak milestones and Stump&apos;d solves. IPL daily and hard mode each have their own set.
          </p>
        </header>

        {loading && (
          <div className="badges-loading">
            <span className="reward-spinner" />
          </div>
        )}

        {loggedOut && (
          <div className="badges-notice">
            <p className="badges-notice__text">Sign in from the game settings to see your badges.</p>
            <Link href="/" className="badges-notice__cta">
              Open Stumpd
            </Link>
          </div>
        )}

        {!loading && hasToken && error && <p className="badges-error">{error}</p>}

        {!loading && hasToken && !error && (
          <div className="badges-modes">
            <ModeSection
              modeId="daily"
              title="IPL daily"
              subtitle="Normal mode — streaks & solves"
              row={normal}
              onOpenBadge={setBadgeDetail}
              modeCurrentStreak={normalStreak}
            />
            <ModeSection
              modeId="hard"
              title="IPL hard mode"
              subtitle="Hard mode — streaks & solves"
              row={hard}
              onOpenBadge={setBadgeDetail}
              modeCurrentStreak={hardStreak}
            />
          </div>
        )}
      </div>

      {badgeDetail && (
        <BadgeDetailModal
          key={`${badgeDetail.modeId}-${badgeDetail.badge.id}-${badgeDetail.locked}`}
          modeId={badgeDetail.modeId}
          badge={badgeDetail.badge}
          locked={badgeDetail.locked}
          row={badgeDetail.row}
          onClose={() => setBadgeDetail(null)}
        />
      )}

      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        puzzleDay={puzzleDay}
        hardModePuzzleDay={hardModePuzzleDay}
        isGodmode={isGodmodeActive()}
      />
      <HowToPlayModal open={showHowToPlay} onClose={() => setShowHowToPlay(false)}>
        <StumpdHowToPlay />
      </HowToPlayModal>
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        hardMode={false}
        onToggleHardMode={() => {}}
        canEnableHardMode={false}
        canDisableHardMode={false}
        hideHardMode
      />
    </main>
  );
}
