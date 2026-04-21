"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchRewardEligibility, fetchWeeklyWinners, submitRewardClaim } from "../../services/rewards-api";
import type { RewardEligibility, WeeklyWinner } from "../../services/rewards-api";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const SUFFIXES: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };

type ClaimState = "idle" | "submitting" | "success" | "error";

export default function RewardClaimPage() {
  const [eligibility, setEligibility] = useState<RewardEligibility | null>(null);
  const [winners, setWinners] = useState<WeeklyWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [igUsername, setIgUsername] = useState("");
  const [redditUsername, setRedditUsername] = useState("");
  const [upiId, setUpiId] = useState("");
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetchRewardEligibility(),
      fetchWeeklyWinners(),
    ]).then(([eligData, winnersData]) => {
      setEligibility(eligData);
      setWinners(winnersData.winners.slice(0, 5));
      if (eligData?.already_claimed) setClaimState("success");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    const ig = igUsername.trim();
    const reddit = redditUsername.trim();
    const upi = upiId.trim();

    if (!ig || !reddit || !upi) {
      setMessage("Please fill in all fields.");
      setClaimState("error");
      return;
    }

    setClaimState("submitting");
    setMessage("");

    try {
      const res = await submitRewardClaim({
        instagram_username: ig,
        reddit_username: reddit,
        upi_id: upi,
      });

      if (res.success) {
        setClaimState("success");
        setMessage(res.message);
      } else {
        setClaimState("error");
        setMessage(res.message || "Something went wrong. Please try again.");
      }
    } catch {
      setClaimState("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="reward-page">
        <div className="reward-card">
          <div className="reward-loading">
            <span className="reward-spinner" />
          </div>
        </div>
      </main>
    );
  }

  const isEligible = eligibility?.eligible === true;
  const myRank = eligibility?.rank ?? null;
  const myAmount = eligibility?.amount ?? null;
  const myLastWeekRank = eligibility?.last_week_rank ?? eligibility?.rank ?? null;
  const showTop100Standout =
    !isEligible &&
    myLastWeekRank != null &&
    myLastWeekRank >= 6 &&
    myLastWeekRank <= 100;

  return (
    <main className={`reward-page${!isEligible ? " reward-page--ne" : ""}`}>
      <div className={`reward-card${!isEligible ? " reward-card--ne" : ""}`}>
        {isEligible && (
          <Link href="/" className="reward-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to game
          </Link>
        )}

        {isEligible && myRank != null && (
          <div className="reward-rank-badge">
            <svg className="reward-rank-badge__laurel reward-rank-badge__laurel--left" viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 110C30 110 8 90 8 60C8 30 30 10 30 10" stroke="currentColor" strokeWidth="2" fill="none" />
              <ellipse cx="18" cy="30" rx="8" ry="12" transform="rotate(-30 18 30)" fill="currentColor" opacity="0.85" />
              <ellipse cx="12" cy="50" rx="8" ry="12" transform="rotate(-15 12 50)" fill="currentColor" opacity="0.8" />
              <ellipse cx="10" cy="72" rx="8" ry="12" transform="rotate(5 10 72)" fill="currentColor" opacity="0.75" />
              <ellipse cx="14" cy="92" rx="8" ry="11" transform="rotate(20 14 92)" fill="currentColor" opacity="0.7" />
              <circle cx="30" cy="112" r="3" fill="currentColor" opacity="0.6" />
            </svg>
            <div className="reward-rank-badge__number">
              <span className="reward-rank-badge__digit">{myRank}</span>
              <span className="reward-rank-badge__suffix">
                {myRank === 1 ? "st" : myRank === 2 ? "nd" : myRank === 3 ? "rd" : "th"}
              </span>
            </div>
            <svg className="reward-rank-badge__laurel reward-rank-badge__laurel--right" viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 110C30 110 52 90 52 60C52 30 30 10 30 10" stroke="currentColor" strokeWidth="2" fill="none" />
              <ellipse cx="42" cy="30" rx="8" ry="12" transform="rotate(30 42 30)" fill="currentColor" opacity="0.85" />
              <ellipse cx="48" cy="50" rx="8" ry="12" transform="rotate(15 48 50)" fill="currentColor" opacity="0.8" />
              <ellipse cx="50" cy="72" rx="8" ry="12" transform="rotate(-5 50 72)" fill="currentColor" opacity="0.75" />
              <ellipse cx="46" cy="92" rx="8" ry="11" transform="rotate(-20 46 92)" fill="currentColor" opacity="0.7" />
              <circle cx="30" cy="112" r="3" fill="currentColor" opacity="0.6" />
            </svg>
          </div>
        )}

        {isEligible && (
          <div className="reward-header">
            <h1 className="reward-header__title">Claim Your Reward</h1>
          </div>
        )}

        {isEligible ? (
          <>
            <div className="reward-tiers">
              {winners.map((w) => {
                const isYou = w.rank === myRank;
                return (
                  <div
                    key={w.rank}
                    className={`reward-tier${isYou ? " reward-tier--you" : ""}`}
                  >
                    <span className="reward-tier__rank">
                      {MEDALS[w.rank] ?? w.rank}
                    </span>
                    <span className="reward-tier__label">
                      {w.rank}{SUFFIXES[w.rank] || "th"}
                    </span>
                    <span className="reward-tier__dash">&mdash;</span>
                    <span className="reward-tier__name">{w.email}</span>
                    {isYou && <span className="reward-tier__you">You</span>}
                  </div>
                );
              })}
            </div>

            <div className="reward-congrats">
              <p className="reward-congrats__text">
                You finished <strong>#{myRank}</strong> this week!
              </p>
              <p className="reward-congrats__sub">
                {claimState === "success"
                  ? "Your claim has been submitted."
                  : `Claim your ₹${myAmount} below.`}
              </p>
            </div>

            {claimState === "success" ? (
              <div className="reward-success">
                <span className="reward-success__icon">✅</span>
                <p className="reward-success__text">
                  {message || "Reward claimed! We'll verify your follows and send the reward within 48 hours."}
                </p>
                <Link href="/" className="reward-btn reward-btn--done">
                  Back to Game
                </Link>
              </div>
            ) : (
              <>
                <div className="reward-follow">
                  <p className="reward-follow__label">To be eligible, you must:</p>
                  <div className="reward-follow__links">
                    <a
                      href="https://www.instagram.com/playstumpd/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="reward-follow__link reward-follow__link--ig"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      Instagram
                    </a>
                    <a
                      href="https://www.reddit.com/r/playstumpd/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="reward-follow__link reward-follow__link--reddit"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 000-.462.342.342 0 00-.461 0c-.545.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.345.345 0 00-.206-.095z"/></svg>
                      Reddit
                    </a>
                  </div>
                  <a
                    href="https://www.reddit.com/r/playstumpd/submit/?type=IMAGE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reward-follow__post-link"
                  >
                    Post your win on r/PlayStumpd
                    <span className="reward-follow__required">Required</span>
                  </a>
                </div>

                <div className="reward-form">
                  <div className="reward-field">
                    <label className="reward-field__label" htmlFor="rc-ig">Instagram username</label>
                    <input
                      id="rc-ig"
                      className="reward-field__input"
                      type="text"
                      placeholder="e.g. your_username"
                      value={igUsername}
                      onChange={(e) => setIgUsername(e.target.value)}
                      maxLength={60}
                      autoComplete="off"
                      disabled={claimState === "submitting"}
                    />
                  </div>
                  <div className="reward-field">
                    <label className="reward-field__label" htmlFor="rc-reddit">Reddit username</label>
                    <input
                      id="rc-reddit"
                      className="reward-field__input"
                      type="text"
                      placeholder="e.g. u/your_username"
                      value={redditUsername}
                      onChange={(e) => setRedditUsername(e.target.value)}
                      maxLength={60}
                      autoComplete="off"
                      disabled={claimState === "submitting"}
                    />
                  </div>
                  <div className="reward-field">
                    <label className="reward-field__label" htmlFor="rc-upi">UPI ID</label>
                    <input
                      id="rc-upi"
                      className="reward-field__input"
                      type="text"
                      placeholder="e.g. name@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      maxLength={100}
                      autoComplete="off"
                      disabled={claimState === "submitting"}
                    />
                  </div>
                </div>

                {message && claimState === "error" && (
                  <p className="reward-error">{message}</p>
                )}

                <button
                  type="button"
                  className="reward-btn"
                  onClick={handleSubmit}
                  disabled={claimState === "submitting"}
                >
                  {claimState === "submitting" ? (
                    <span className="reward-spinner reward-spinner--sm" />
                  ) : (
                    `Submit Claim`
                  )}
                </button>

                <p className="reward-disclaimer">
                  ⏳ Reward sent within 48hrs after follow verification.
                </p>
              </>
            )}
          </>
        ) : (
          <div className="reward-not-eligible">
            <div className="reward-ne-banner">
              <span className="reward-ne-banner__trophy">🏆</span>
              <h2 className="reward-ne-banner__title">Last Week&apos;s Top 5</h2>
              <p className="reward-ne-banner__sub">These players dominated the leaderboard</p>
            </div>

            {winners.length > 0 && (
              <div className="reward-ne-players">
                {winners.map((w, i) => (
                  <div
                    key={w.rank}
                    className={`reward-ne-row reward-ne-row--r${w.rank}`}
                    style={{ animationDelay: `${i * 80}ms` } as React.CSSProperties}
                  >
                    <span className="reward-ne-row__medal">
                      {MEDALS[w.rank] ?? <span className="reward-ne-row__num">{w.rank}</span>}
                    </span>
                    <span className="reward-ne-row__name">{w.email}</span>
                    <span className="reward-ne-row__pts">{w.points.toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
            )}

            {showTop100Standout && (
              <div className="reward-ne-you-block">
                <p className="reward-ne-you-block__label">Your position last week</p>
                <div className="reward-ne-row reward-ne-row--top100">
                  <span className="reward-ne-row__medal">
                    <span className="reward-ne-row__num reward-ne-row__num--top100">{myLastWeekRank}</span>
                  </span>
                  <span className="reward-ne-row__name">You</span>
                  <span className="reward-ne-row__pts reward-ne-row__pts--top100">Top 100</span>
                </div>
              </div>
            )}

            <div className="reward-ne-divider" />

            {showTop100Standout ? (
              <p className="reward-ne-your-rank">
                Break into the <strong>top 5</strong> next week to win exclusive rewards!
              </p>
            ) : eligibility && (eligibility.last_week_rank != null || eligibility.rank != null) ? (
              <p className="reward-ne-your-rank">
                Your rank last week:{" "}
                <strong>#{eligibility.last_week_rank ?? eligibility.rank}</strong> &mdash; keep climbing!
              </p>
            ) : (
              <p className="reward-ne-your-rank">
                Top 5 players each week win exclusive rewards!
              </p>
            )}

            <Link href="/" className="reward-btn">
              Play Today&apos;s Puzzle
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
