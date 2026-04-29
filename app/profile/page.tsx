"use client";

import { useEffect, useState } from "react";
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
import { fetchLastWeekLeaderboard, type PeriodEntry } from "../services/leaderboard-api";
import { fetchRewardEligibility, isRewardClaimLocked, type RewardEligibility } from "../services/rewards-api";
import { fetchPuzzleToday, fetchHardModePuzzleToday } from "../services/ipl-api";
import { getStoredToken, getStoredUser } from "../services/auth-api";
import { isGodmodeActive } from "../utils/godmode-status";

const MEDAL_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function displayName(email: string): string {
  return email.split("@")[0];
}

/** e.g. 1 -> "1st", 8 -> "8th" */
function ordinalPlace(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [lastWeekTop, setLastWeekTop] = useState<PeriodEntry[]>([]);
  const [leaderboardLastWeekRank, setLeaderboardLastWeekRank] = useState<number | null>(null);
  const [rewardEligibility, setRewardEligibility] = useState<RewardEligibility | null>(null);
  const [puzzleDay, setPuzzleDay] = useState<number | undefined>(undefined);
  const [hardModePuzzleDay, setHardModePuzzleDay] = useState<number | undefined>(undefined);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbKey, setLbKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    const onOpenSettings = () => setShowSettings(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpenSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpenSettings);
  }, []);

  useEffect(() => {
    const onOpenLb = () => {
      setLbKey((k) => k + 1);
      setLbOpen(true);
    };
    window.addEventListener(OPEN_LEADERBOARD_EVENT, onOpenLb);
    return () => window.removeEventListener(OPEN_LEADERBOARD_EVENT, onOpenLb);
  }, []);

  useEffect(() => {
    const onOpenHtp = () => setShowHowToPlay(true);
    window.addEventListener(OPEN_HOW_TO_PLAY_EVENT, onOpenHtp);
    return () => window.removeEventListener(OPEN_HOW_TO_PLAY_EVENT, onOpenHtp);
  }, []);

  useEffect(() => {
    dispatchLeaderboardState(lbOpen);
  }, [lbOpen]);

  useEffect(() => {
    const token = getStoredToken();
    setHasToken(!!token);
    const user = getStoredUser();
    setEmail(user?.email ?? null);
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.allSettled([
      fetchLastWeekLeaderboard(),
      fetchPuzzleToday(),
      fetchHardModePuzzleToday(),
      fetchRewardEligibility(),
    ]).then((results) => {
      let boardRank: number | null = null;
      if (results[0].status === "fulfilled") {
        const rows = results[0].value;
        setLastWeekTop(rows.slice(0, 10));
        if (user?.email) {
          const match = rows.find((r) => r.email === user.email);
          if (match) boardRank = match.rank;
        }
      }
      if (results[1].status === "fulfilled") {
        setPuzzleDay(results[1].value.day);
      }
      if (results[2].status === "fulfilled") {
        setHardModePuzzleDay(results[2].value.day);
      }
      const elig = results[3].status === "fulfilled" ? results[3].value : null;
      setRewardEligibility(elig);
      const apiRank = elig?.last_week_rank ?? null;
      setLeaderboardLastWeekRank(apiRank ?? boardRank);
    }).finally(() => setLoading(false));
  }, []);

  const openLeaderboard = () => {
    setLbKey((k) => k + 1);
    setLbOpen(true);
  };

  const prizePoolRank =
    rewardEligibility?.rank != null &&
    rewardEligibility.rank >= 1 &&
    rewardEligibility.rank <= 10
      ? rewardEligibility.rank
      : null;
  const inLeaderboardTop10 =
    leaderboardLastWeekRank != null &&
    leaderboardLastWeekRank >= 1 &&
    leaderboardLastWeekRank <= 10;
  const showTop10RankLine = prizePoolRank != null || inLeaderboardTop10;
  const claimLocked = isRewardClaimLocked(rewardEligibility);
  const showClaimRewards = rewardEligibility?.eligible === true && !claimLocked;
  const showClaimedEditableNote =
    rewardEligibility?.eligible === true &&
    rewardEligibility.already_claimed === true &&
    !claimLocked;
  const showClaimFinalizedNote = rewardEligibility?.eligible === true && claimLocked;

  const loggedOut = !loading && !hasToken;

  return (
    <main className="hub-page badges-page profile-page">
      <PageHeader showHowToPlay={false} logoSrc="/stumpd-logo.png" logoAlt="Stumpd" />
      <nav className="badges-topbar" aria-label="Page shortcuts">
        <Link href="/" className="badges-back badges-back--subnav" aria-label="Back to Stumpd home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
        {hasToken ? (
          <Link href="/badges" className="badges-topbar__link">
            Badges
          </Link>
        ) : null}
      </nav>
      <div className="badges-shell profile-shell">
        <header className="badges-header profile-header badges-header--title-block">
          <h1 className="badges-header__title">Profile</h1>
        </header>

        {loading && (
          <div className="badges-loading">
            <span className="reward-spinner" />
          </div>
        )}

        {loggedOut && (
          <div className="badges-notice">
            <p className="badges-notice__text">Sign in from the game settings to view your profile.</p>
            <Link href="/" className="badges-notice__cta">
              Open Stumpd
            </Link>
          </div>
        )}

        {!loading && hasToken && (
          <>
            <section className="profile-card profile-card--email" aria-labelledby="profile-email-heading">
              <div className="profile-email-head">
                <div className="profile-email-head__icon-wrap" aria-hidden>
                  <span className="profile-email-head__icon">✉️</span>
                </div>
                <div className="profile-email-head__body">
                  <h2 id="profile-email-heading" className="profile-card__label profile-card__label--email">
                    Email
                  </h2>
                  <p className="profile-email">{email ?? "—"}</p>
                </div>
              </div>
            </section>

            <div className="profile-actions">
              <Link href="/badges" className="profile-action-card profile-action-card--link">
                <span className="profile-action-card__icon-wrap profile-action-card__icon-wrap--badges" aria-hidden>
                  <span className="profile-action-card__icon">🏅</span>
                </span>
                <div className="profile-action-card__text">
                  <span className="profile-action-card__title">Badges</span>
                  <span className="profile-action-card__sub">Streaks &amp; Stump&apos;d milestones</span>
                </div>
                <span className="profile-action-card__chev-wrap" aria-hidden>
                  <svg className="profile-action-card__chev" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>

              <button type="button" className="profile-action-card profile-action-card--btn" onClick={openLeaderboard}>
                <span className="profile-action-card__icon-wrap profile-action-card__icon-wrap--lb" aria-hidden>
                  <span className="profile-action-card__icon profile-action-card__icon--lb">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="13" width="5" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
                      <rect x="9.5" y="5" width="5" height="16" rx="1" stroke="currentColor" strokeWidth="2" />
                      <rect x="16" y="9" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </span>
                </span>
                <div className="profile-action-card__text">
                  <span className="profile-action-card__title">Leaderboard</span>
                  <span className="profile-action-card__sub">Today, week, month &amp; all-time</span>
                </div>
                <span className="profile-action-card__chev-wrap" aria-hidden>
                  <svg className="profile-action-card__chev" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </div>

            <section className="profile-card profile-card--top5" aria-labelledby="profile-top10-heading">
              <div className="profile-weekly-head">
                <div className="profile-weekly-head__icon-wrap" aria-hidden>
                  <span className="profile-weekly-head__icon">🏆</span>
                </div>
                <div className="profile-weekly-head__text">
                  <h2 id="profile-top10-heading" className="profile-card__label profile-card__label--weekly">
                    Last week — top 10
                  </h2>
                  <p className="profile-card__hint profile-card__hint--weekly">
                    Final standings from the most recent completed week.
                  </p>
                </div>
              </div>
              {showTop10RankLine && (
                <div className="profile-your-rank" role="status">
                  <div className="profile-your-rank__spotlight" aria-hidden>
                    {prizePoolRank != null ? (
                      <>
                        <span className="profile-your-rank__spotlight-label">Prize pool</span>
                        <span className="profile-your-rank__spotlight-num">#{prizePoolRank}</span>
                      </>
                    ) : (
                      <>
                        <span className="profile-your-rank__spotlight-label">You placed</span>
                        <span className="profile-your-rank__spotlight-num">{ordinalPlace(leaderboardLastWeekRank!)}</span>
                      </>
                    )}
                  </div>
                  <p className="profile-your-rank__copy">
                    {prizePoolRank != null ? (
                      <>
                        You&apos;re in last week&apos;s weekly winners — top 10 prizes.
                      </>
                    ) : (
                      <>
                        You finished in the top 10 on last week&apos;s leaderboard.
                      </>
                    )}
                  </p>
                </div>
              )}
              {showClaimRewards && (
                <div className="profile-claim-row">
                  <Link href="/rewards/claim" className="profile-claim-btn">
                    <span className="profile-claim-btn__gift" aria-hidden>
                      🎁
                    </span>
                    <span className="profile-claim-btn__center">
                      <span className="profile-claim-btn__title">
                        {rewardEligibility?.already_claimed ? "Update reward claim" : "Claim your rewards"}
                      </span>
                      <span className="profile-claim-btn__sub">
                        {rewardEligibility?.already_claimed
                          ? "Edit checklist & payout details"
                          : "Secure your weekly prize"}
                      </span>
                    </span>
                    <svg className="profile-claim-btn__chev" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              )}
              {showClaimedEditableNote && (
                <p className="profile-card__hint profile-claimed-note">
                  Submitted — you can still update your claim on the claim page until it&apos;s paid or closed.
                </p>
              )}
              {showClaimFinalizedNote && (
                <p className="profile-card__hint profile-claimed-note">
                  Your reward claim for this week is finalized ({rewardEligibility?.claim_status}).
                </p>
              )}
              {lastWeekTop.length === 0 ? (
                <p className="profile-empty">No leaderboard data yet.</p>
              ) : (
                <ol className="profile-top5-list">
                  {lastWeekTop.map((row) => {
                    const isYou = !!email && row.email === email;
                    const medal = MEDAL_EMOJI[row.rank];
                    return (
                      <li
                        key={row.rank}
                        className={`profile-top5-row${isYou ? " profile-top5-row--you" : ""}${medal ? " profile-top5-row--podium" : ""}`}
                      >
                        <span
                          className={`profile-top5-rank${medal ? " profile-top5-rank--medal" : " profile-top5-rank--pill"}`}
                          aria-hidden
                        >
                          {medal ?? row.rank}
                        </span>
                        <span className="profile-top5-name">
                          {displayName(row.email)}
                          {isYou ? <span className="profile-top5-you">You</span> : null}
                        </span>
                        <span className="profile-top5-stat">{row.games_won} wins</span>
                        <span className="profile-top5-pts">{(row.points ?? 0).toLocaleString()} pts</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </>
        )}
      </div>

      <LeaderboardModal
        open={lbOpen}
        onClose={() => setLbOpen(false)}
        puzzleDay={puzzleDay}
        hardModePuzzleDay={hardModePuzzleDay}
        invalidateKey={lbKey}
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
