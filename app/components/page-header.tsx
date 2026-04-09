"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import LeftSidebar from "./left-sidebar";
import { dispatchOpenHowToPlay } from "./how-to-play-open";
import { dispatchOpenHintHistory, HINT_COUNT_UPDATE_EVENT } from "./hint-history-open";
import { dispatchOpenLeaderboard } from "./leaderboard-open";

export { OPEN_HOW_TO_PLAY_EVENT, dispatchOpenHowToPlay } from "./how-to-play-open";
export { OPEN_HINT_HISTORY_EVENT } from "./hint-history-open";
export { OPEN_LEADERBOARD_EVENT } from "./leaderboard-open";

type PageHeaderProps = {
  /** When false, only the logo and accent bar (matches legal/static pages). */
  showHowToPlay?: boolean;
  /** Formatted timer string (e.g. "02:35") displayed in the header on game pages. */
  timerDisplay?: string;
  /** Override the header logo image (defaults to Stumpd logo). */
  logoSrc?: string;
  logoAlt?: string;
};

export default function PageHeader({
  showHowToPlay = true,
  timerDisplay,
  logoSrc = "/stumpd-logo.png",
  logoAlt = "Stumpd",
}: PageHeaderProps) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [hintCount, setHintCount] = useState(0);

  useEffect(() => {
    const onCount = (e: Event) => setHintCount((e as CustomEvent<number>).detail);
    window.addEventListener(HINT_COUNT_UPDATE_EVENT, onCount);
    return () => window.removeEventListener(HINT_COUNT_UPDATE_EVENT, onCount);
  }, []);

  const logo = (
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
          <h1 className="page-title-logo-wrap">{logo}</h1>
        ) : (
          <div className="page-title-logo-wrap">{logo}</div>
        )}
        <div className="page-header-bar__side page-header-bar__side--end">
          <nav
            className="page-header-toolbar"
            aria-label="Help and legal"
          >
            {showHowToPlay ? (
              <button
                type="button"
                className="page-header-icon-btn page-header-hint-btn"
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
            {showHowToPlay ? (
              <button
                type="button"
                className="page-header-icon-btn page-header-leaderboard-btn"
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
                  <path
                    d="M6 9H2v12h4V9zm6-6h-4v18h4V3zm6 10h-4v8h4v-8z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            ) : null}
            {showHowToPlay ? (
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
            ) : (
              <Link
                href="/how-to-play"
                className="page-header-icon-btn page-header-howtoplay-btn"
                aria-label="How to play"
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
              </Link>
            )}
          </nav>
        </div>
      </div>
      <div className="page-title-accent" aria-hidden="true" />
      <LeftSidebar
        open={leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
      />
    </header>
  );
}
