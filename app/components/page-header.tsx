"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LeftSidebar from "./left-sidebar";
import { dispatchOpenHowToPlay } from "./how-to-play-open";
import { dispatchOpenHintHistory, HINT_COUNT_UPDATE_EVENT } from "./hint-history-open";
import { dispatchOpenLeaderboard, LEADERBOARD_STATE_EVENT } from "./leaderboard-open";
export { OPEN_HOW_TO_PLAY_EVENT, dispatchOpenHowToPlay } from "./how-to-play-open";
export { OPEN_HINT_HISTORY_EVENT } from "./hint-history-open";
export { OPEN_LEADERBOARD_EVENT, dispatchLeaderboardState } from "./leaderboard-open";
export { OPEN_SETTINGS_EVENT } from "./settings-modal";

type PageHeaderProps = {
  /** When false, only the logo and accent bar (matches legal/static pages). */
  showHowToPlay?: boolean;
  /** Formatted timer string (e.g. "02:35") displayed in the header on game pages. */
  timerDisplay?: string;
  /** Override the header logo image (defaults to Stumpd logo). */
  logoSrc?: string;
  logoAlt?: string;
  /** Whether the 24-hour Godmode theme is active. */
  isGodmode?: boolean;
  /** Hours remaining for Godmode (for the strip display). */
  godmodeHoursLeft?: number;
  /** First letter of user's name/email for Godmode shield. */
  userInitial?: string;
  /** Whether hard mode is active (disables green hint styling). */
  hardMode?: boolean;
};

export default function PageHeader({
  showHowToPlay = true,
  timerDisplay,
  logoSrc = "/stumpd-logo.png",
  logoAlt = "Stumpd",
  isGodmode = false,
  godmodeHoursLeft = 0,
  userInitial = "",
  hardMode = false,
}: PageHeaderProps) {
  const pathname = usePathname();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [lbOpen, setLbOpen] = useState(false);

  useEffect(() => {
    const onCount = (e: Event) => {
      const val = (e as CustomEvent<number>).detail;
      if (typeof val === "number" && !Number.isNaN(val)) setHintCount(val);
    };
    window.addEventListener(HINT_COUNT_UPDATE_EVENT, onCount);
    return () => window.removeEventListener(HINT_COUNT_UPDATE_EVENT, onCount);
  }, []);

  useEffect(() => {
    const onLbState = (e: Event) => {
      const val = (e as CustomEvent<boolean>).detail;
      if (typeof val === "boolean") setLbOpen(val);
    };
    window.addEventListener(LEADERBOARD_STATE_EVENT, onLbState);
    return () => window.removeEventListener(LEADERBOARD_STATE_EVENT, onLbState);
  }, []);

  const godmodeShield = isGodmode ? (
    <div className="godmode-crest" aria-label="Godmode Activated">
      <svg className="godmode-crest__shield" viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shieldGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5d061" />
            <stop offset="50%" stopColor="#c9a227" />
            <stop offset="100%" stopColor="#a67c00" />
          </linearGradient>
          <linearGradient id="shieldInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <path d="M40 2 L76 18 C76 18 78 56 40 92 C2 56 4 18 4 18 Z" fill="url(#shieldGold)" />
        <path d="M40 10 L68 23 C68 23 70 54 40 84 C10 54 12 23 12 23 Z" fill="url(#shieldInner)" />
        <text x="40" y="58" textAnchor="middle" fill="#f5d061" fontSize="34" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">{userInitial || "G"}</text>
      </svg>
    </div>
  ) : null;

  const logoImage = (
    <Image
      className="page-title-logo"
      src={logoSrc}
      alt={logoAlt}
      width={1024}
      height={682}
      priority
      sizes="(max-width: 360px) 90vw, 18rem"
    />
  );

  const logo = (
    <Link href="/" className="page-title-logo-link" aria-label="Back to home">
      {logoImage}
    </Link>
  );

  return (
    <header
      className={showHowToPlay ? "page-header page-header--game" : "page-header"}
    >
      <div className="page-header-bar">
        <div className="page-header-bar__side page-header-bar__side--start">
          <button
            type="button"
            className="page-header-icon-btn page-header-menu-btn"
            aria-label="Open menu"
            aria-expanded={leftSidebarOpen}
            aria-controls="left-sidebar-panel"
            onClick={() => setLeftSidebarOpen(true)}
          >
            <svg
              className="page-header-icon-btn__glyph"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {showHowToPlay && timerDisplay != null ? (
            <div className="page-header-timer" role="timer" aria-label={`Timer: ${timerDisplay}`}>
              <svg
                className="page-header-timer__icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="14" r="8" />
                <path d="M12 10v4l2 2" />
                <path d="M12 2v4" />
                <path d="M10 2h4" />
              </svg>
              <span className="page-header-timer__time">{timerDisplay}</span>
            </div>
          ) : null}
        </div>
        {showHowToPlay ? (
          <h1 className="page-title-logo-wrap">{godmodeShield ?? logo}</h1>
        ) : (
          <div className="page-title-logo-wrap">{godmodeShield ?? logo}</div>
        )}
        <div className="page-header-bar__side page-header-bar__side--end">
          <nav
            className="page-header-toolbar"
            aria-label="Help and legal"
          >
            {showHowToPlay ? (
              <button
                type="button"
                className={`page-header-icon-btn${hardMode ? "" : " page-header-hint-btn"}`}
                aria-label="View hints"
                onClick={() => dispatchOpenHintHistory()}
              >
                <svg
                  className="page-header-icon-btn__glyph"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M9 21h6M12 3a6 6 0 0 0-6 6c0 2.1 1.1 3.8 2.5 5 .7.6 1.2 1.5 1.5 2.5h4c.3-1 .8-1.9 1.5-2.5C16.9 12.8 18 11.1 18 9a6 6 0 0 0-6-6z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {hintCount > 0 && (
                  <span className="page-header-hint-badge" aria-hidden>
                    {hintCount}
                  </span>
                )}
              </button>
            ) : null}
            <Link
              href="/"
              className="page-header-icon-btn page-header-home-btn"
              aria-label="Home"
            >
              <svg
                className="page-header-icon-btn__glyph"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <button
              type="button"
              className={`page-header-icon-btn page-header-leaderboard-btn${lbOpen ? " page-header-leaderboard-btn--active" : ""}`}
              aria-label="Leaderboard"
              onClick={() => dispatchOpenLeaderboard()}
            >
              <svg
                className="page-header-icon-btn__glyph"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <rect x="3" y="13" width="5" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
                <rect x="9.5" y="5" width="5" height="16" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
                <rect x="16" y="9" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </button>
            <button
              type="button"
              className="page-header-icon-btn page-header-howtoplay-btn"
              aria-label="How to play"
              onClick={() => dispatchOpenHowToPlay()}
            >
              <svg
                className="page-header-icon-btn__glyph"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.5.3-.7.6-.7 1.1V14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="17" r="1" fill="currentColor" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
      <div className={`page-title-accent${isGodmode ? " page-title-accent--godmode" : ""}`} aria-hidden="true" />
      {isGodmode && godmodeHoursLeft > 0 && (
        <div className="godmode-strip">
          <svg className="godmode-strip__crown" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M2 16L4 6l5 4 3-7 3 7 5-4 2 10H2z" fill="#3a2a00" stroke="#3a2a00" strokeWidth="1" strokeLinejoin="round" />
            <path d="M3 18h18v2H3z" fill="#3a2a00" rx="1" />
          </svg>
          <span className="godmode-strip__text">Godmode</span>
          <span className="godmode-strip__timer">{godmodeHoursLeft}h left</span>
        </div>
      )}
      <LeftSidebar
        open={leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
      />
    </header>
  );
}
