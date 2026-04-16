"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "./components/page-header";
import HardModeTransition from "./components/hard-mode-transition";
import { readStreaks } from "./stumpd/stats-storage";
import { fetchLiveStats } from "./services/live-stats-api";
import { fetchMyStats, fetchMyHardModeStats } from "./services/auth-api";

const GAME_MODES = [
  {
    id: "daily",
    title: "Daily Stumpd",
    description: "Today's mystery cricketer is waiting. Can you crack it in 6?",
    href: "/stumpd",
    badge: "Daily",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "hard",
    title: "Hard Mode",
    description: "No clues. No hints. Pure name matching for the elite.",
    href: "/stumpd?mode=hard",
    badge: "Challenge",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "archive",
    title: "Archive",
    description: "Missed a day? Play any past Stumpd puzzle.",
    href: "/archive",
    badge: "Browse",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  // {
  //   id: "multiplayer",
  //   title: "Multiplayer",
  //   description: "Challenge your friends and compete in real time.",
  //   href: "/multiplayer",
  //   badge: "Coming Soon",
  //   icon: (
  //     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
  //       <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  //       <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
  //       <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  //       <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  //     </svg>
  //   ),
  // },
];

export default function HomePage() {
  const router = useRouter();
  const [normalStreak, setNormalStreak] = useState<number | null>(null);
  const [hardStreak, setHardStreak] = useState<number | null>(null);
  const [totalPlayed, setTotalPlayed] = useState<number | null>(null);
  const [hmTransition, setHmTransition] = useState(false);
  const [hmTransOrigin, setHmTransOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    try {
      const token = localStorage.getItem("stumpd_auth_token");
      const ts = localStorage.getItem("stumpdpuzzle_hmChampionTs");
      const expired = !token || !ts || (Date.now() - Number(ts)) >= 24 * 60 * 60 * 1000;
      if (expired) {
        document.documentElement.classList.remove("godmode-early");
        document.documentElement.style.removeProperty("background-color");
        document.documentElement.style.removeProperty("color-scheme");
        document.body.classList.remove("body--godmode");
        if (ts && !token) localStorage.removeItem("stumpdpuzzle_hmChampionTs");
      }
    } catch {}
  }, []);

  useEffect(() => {
    const localNormal = readStreaks("normal");
    const localHard = readStreaks("hard");
    setNormalStreak(localNormal.currentStreak);
    setHardStreak(localHard.currentStreak);

    fetchMyStats().then((stats) => {
      if (stats) setNormalStreak(stats.currentStreak);
    });
    fetchMyHardModeStats().then((stats) => {
      if (stats) setHardStreak(stats.currentStreak);
    });

    fetchLiveStats().then((live) => {
      if (live.totalPlayed > 0) setTotalPlayed(live.totalPlayed);
    });
  }, []);

  return (
    <main className="hub-page">
      <PageHeader showHowToPlay={false} />

      <div className="hub-grid">
        {GAME_MODES.map((mode, i) => {
          const inner = (
            <>
              <span className="hub-card__badge">{mode.badge}</span>
              <span className="hub-card__icon">{mode.icon}</span>
              <h2 className="hub-card__title">{mode.title}</h2>
              <p className="hub-card__desc">{mode.description}</p>
              {mode.id === "daily" && normalStreak !== null && (
                normalStreak > 0 ? (
                  <p className="hub-card__streak hub-card__streak--active">
                    🔥 {normalStreak} day streak
                  </p>
                ) : (
                  <p className="hub-card__streak hub-card__streak--none">
                    😴 No streak yet — start one today!
                  </p>
                )
              )}
              {mode.id === "hard" && hardStreak !== null && (
                hardStreak > 0 ? (
                  <p className="hub-card__streak hub-card__streak--active">
                    🔥 {hardStreak} day streak
                  </p>
                ) : (
                  <p className="hub-card__streak hub-card__streak--none">
                    😴 No streak yet — start one today!
                  </p>
                )
              )}
              <span className="hub-card__cta">
                Play
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </>
          );

          if (mode.id === "hard") {
            return (
              <div
                key={mode.href}
                className={`hub-card hub-card--${mode.id}`}
                style={{ animationDelay: `${i * 0.06}s`, cursor: "pointer" }}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  if (hmTransition) return;
                  setHmTransOrigin({ x: e.clientX, y: e.clientY });
                  setHmTransition(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHmTransOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                    setHmTransition(true);
                  }
                }}
              >
                {inner}
              </div>
            );
          }

          if (mode.id === "daily") {
            return (
              <Link
                key={mode.href}
                href={mode.href}
                className={`hub-card hub-card--${mode.id}`}
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => {
                  try { localStorage.setItem("stumpdpuzzle_hardMode", "0"); } catch {}
                }}
              >
                {inner}
              </Link>
            );
          }

          return (
            <Link
              key={mode.href}
              href={mode.href}
              className={`hub-card hub-card--${mode.id}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {inner}
            </Link>
          );
        })}
      </div>

      <HardModeTransition
        active={hmTransition}
        originX={hmTransOrigin.x}
        originY={hmTransOrigin.y}
        onMidpoint={() => {
          try { localStorage.setItem("stumpdpuzzle_hardMode", "1"); } catch {}
          router.push("/stumpd?mode=hard");
        }}
        onComplete={() => setHmTransition(false)}
      />

      {totalPlayed !== null && (
        <p className="hub-social-proof">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {totalPlayed.toLocaleString()} games played today
        </p>
      )}
    </main>
  );
}
