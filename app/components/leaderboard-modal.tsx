"use client";

import { useState, useEffect, useRef } from "react";
import type { TodayEntry, PeriodEntry } from "../services/leaderboard-api";
import {
  fetchTodayLeaderboard,
  fetchWeeklyLeaderboard,
  fetchMonthlyLeaderboard,
  fetchOverallLeaderboard,
} from "../services/leaderboard-api";

type Tab = "today" | "week" | "month" | "overall";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "overall", label: "All Time" },
];

function rankClass(rank: number): string {
  if (rank === 1) return "lb-row lb-row--r1";
  if (rank === 2) return "lb-row lb-row--r2";
  if (rank === 3) return "lb-row lb-row--r3";
  return "lb-row";
}

function displayName(email: string): string {
  return email.split("@")[0];
}

function formatTime(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const MEDAL_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function MedalIcon({ rank }: { rank: number }) {
  const emoji = MEDAL_EMOJI[rank];
  if (emoji) {
    return <span className="lb-medal-emoji">{emoji}</span>;
  }
  return <span className="lb-rank-num">{rank}</span>;
}

function TodayTable({ rows }: { rows: TodayEntry[] }) {
  if (rows.length === 0) {
    return <p className="lb-empty">No results yet for today.</p>;
  }
  return (
    <div className="lb-table-wrap">
      <table className="lb-table">
        <thead>
          <tr>
            <th className="lb-th lb-th--rank">#</th>
            <th className="lb-th lb-th--email">Player</th>
            <th className="lb-th lb-th--num">Guesses</th>
            <th className="lb-th lb-th--num">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.rank}
              className={rankClass(r.rank)}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <td className="lb-td lb-td--rank">
                <MedalIcon rank={r.rank} />
              </td>
              <td className="lb-td lb-td--email">{displayName(r.email)}</td>
              <td className="lb-td lb-td--num">{r.num_guesses}/6</td>
              <td className="lb-td lb-td--num">{formatTime(r.time_seconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PeriodTable({ rows }: { rows: PeriodEntry[] }) {
  if (rows.length === 0) {
    return <p className="lb-empty">No results yet for this period.</p>;
  }
  return (
    <div className="lb-table-wrap">
      <table className="lb-table">
        <thead>
          <tr>
            <th className="lb-th lb-th--rank">#</th>
            <th className="lb-th lb-th--email">Player</th>
            <th className="lb-th lb-th--num">Won</th>
            <th className="lb-th lb-th--num">Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.rank}
              className={rankClass(r.rank)}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <td className="lb-td lb-td--rank">
                <MedalIcon rank={r.rank} />
              </td>
              <td className="lb-td lb-td--email">{displayName(r.email)}</td>
              <td className="lb-td lb-td--num">{r.games_won}</td>
              <td className="lb-td lb-td--num">{(r.points ?? 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type CacheEntry<T> = { data: T; fetchedAt: number };

type CacheMap = {
  today: CacheEntry<TodayEntry[]> | null;
  week: CacheEntry<PeriodEntry[]> | null;
  month: CacheEntry<PeriodEntry[]> | null;
  overall: CacheEntry<PeriodEntry[]> | null;
  todayPuzzleDay?: number;
};

const TTL: Record<Tab, number> = {
  today: 180_000,
  week: 300_000,
  month: 300_000,
  overall: 600_000,
};

const PREFETCH_BEFORE = 30_000;

function isStale(entry: CacheEntry<unknown> | null, tab: Tab): boolean {
  if (!entry) return true;
  return Date.now() - entry.fetchedAt > TTL[tab];
}

function shouldPrefetch(entry: CacheEntry<unknown> | null): boolean {
  if (!entry) return false;
  const age = Date.now() - entry.fetchedAt;
  return age > TTL.today - PREFETCH_BEFORE && age <= TTL.today;
}

const EMPTY_CACHE: CacheMap = { today: null, week: null, month: null, overall: null };

type Props = {
  open: boolean;
  onClose: () => void;
  puzzleDay?: number;
  /** Bump to force "today" cache invalidation (e.g. after auth/game result). */
  invalidateKey?: number;
};

export default function LeaderboardModal({ open, onClose, puzzleDay, invalidateKey }: Props) {
  const [tab, setTab] = useState<Tab>("today");
  const [loading, setLoading] = useState(false);
  const [, forceUpdate] = useState(0);
  const cache = useRef<CacheMap>({ ...EMPTY_CACHE });
  const lastInvalidateKey = useRef(invalidateKey);
  const bustNextTodayFetch = useRef(false);

  if (invalidateKey !== lastInvalidateKey.current) {
    cache.current.today = null;
    lastInvalidateKey.current = invalidateKey;
    bustNextTodayFetch.current = true;
  }

  if (tab === "today" && cache.current.todayPuzzleDay !== puzzleDay) {
    cache.current.today = null;
    cache.current.todayPuzzleDay = puzzleDay;
  }

  const fetchTab = useRef<(tab: Tab, silent: boolean) => void>(undefined);

  fetchTab.current = (t: Tab, silent: boolean) => {
    if (t === "today" && puzzleDay == null) return;

    if (!silent) setLoading(true);
    let cancelled = false;

    const doFetch = async () => {
      try {
        const now = Date.now();
        switch (t) {
          case "today": {
            const bust = bustNextTodayFetch.current;
            bustNextTodayFetch.current = false;
            const data = await fetchTodayLeaderboard(puzzleDay!, bust);
            if (!cancelled) cache.current.today = { data: data.slice(0, 10), fetchedAt: now };
            break;
          }
          case "week": {
            const data = await fetchWeeklyLeaderboard();
            if (!cancelled) cache.current.week = { data: data.slice(0, 10), fetchedAt: now };
            break;
          }
          case "month": {
            const data = await fetchMonthlyLeaderboard();
            if (!cancelled) cache.current.month = { data: data.slice(0, 10), fetchedAt: now };
            break;
          }
          case "overall": {
            const data = await fetchOverallLeaderboard();
            if (!cancelled) cache.current.overall = { data: data.slice(0, 10), fetchedAt: now };
            break;
          }
        }
      } catch {
        /* keep existing cache or null */
      } finally {
        if (!cancelled) {
          setLoading(false);
          forceUpdate((n) => n + 1);
        }
      }
    };

    doFetch();
    return () => { cancelled = true; };
  };

  useEffect(() => {
    if (!open) return;

    const entry = cache.current[tab];

    if (isStale(entry, tab)) {
      return fetchTab.current?.(tab, false);
    }

    if (tab === "today" && shouldPrefetch(entry)) {
      fetchTab.current?.(tab, true);
    }
  }, [open, tab, puzzleDay, invalidateKey]);

  useEffect(() => {
    if (!open || tab !== "today") return;

    const entry = cache.current.today;
    if (!entry) return;

    const age = Date.now() - entry.fetchedAt;
    const timeUntilPrefetch = Math.max(0, TTL.today - PREFETCH_BEFORE - age);

    const timer = setTimeout(() => {
      fetchTab.current?.("today", true);
    }, timeUntilPrefetch);

    return () => clearTimeout(timer);
  }, [open, tab, forceUpdate]);

  if (!open) return null;

  const currentEntry = cache.current[tab];
  const currentData = currentEntry?.data ?? null;

  return (
    <div className="lb-backdrop" onClick={onClose} role="presentation">
      <div
        className="lb-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Leaderboard"
      >
        <button
          type="button"
          className="lb-close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="lb-title">
          <svg className="lb-title__icon" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 3h12v3a6 6 0 0 1-12 0V3z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
            <path d="M6 5H4a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M18 5h2a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M9 17h6" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 12v5" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="8" y="20" width="8" height="2" rx="1" fill="#2d6a4f" />
          </svg>
          Hall of Fame
        </h2>

        <div className="lb-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`lb-tab${tab === t.id ? " lb-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="lb-body">
          {loading && currentData === null ? (
            <div className="lb-loading">
              <span className="lb-spinner" />
            </div>
          ) : currentData === null ? (
            <p className="lb-empty">Could not load leaderboard.</p>
          ) : tab === "today" ? (
            <TodayTable rows={currentData as TodayEntry[]} />
          ) : (
            <PeriodTable rows={currentData as PeriodEntry[]} />
          )}
        </div>
      </div>
    </div>
  );
}
