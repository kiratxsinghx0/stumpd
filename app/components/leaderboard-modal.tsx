"use client";

import { useState, useEffect, useRef } from "react";
import type { TodayEntry, PeriodEntry, HardModeTodayEntry } from "../services/leaderboard-api";
import {
  fetchTodayLeaderboard,
  fetchWeeklyLeaderboard,
  fetchMonthlyLeaderboard,
  fetchOverallLeaderboard,
  fetchHardModeTodayLeaderboard,
  fetchHardModeWeeklyLeaderboard,
  fetchHardModeMonthlyLeaderboard,
  fetchHardModeOverallLeaderboard,
} from "../services/leaderboard-api";

type Tab = "today" | "week" | "month" | "overall";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "overall", label: "All Time" },
];

function rankClass(rank: number, isHardModeToday?: boolean): string {
  let cls = "lb-row";
  if (rank === 1) cls = "lb-row lb-row--r1";
  else if (rank === 2) cls = "lb-row lb-row--r2";
  else if (rank === 3) cls = "lb-row lb-row--r3";
  if (isHardModeToday) cls += " lb-row--hm";
  return cls;
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
              className={rankClass(r.rank, r.is_hard_mode_today)}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <td className="lb-td lb-td--rank">
                <MedalIcon rank={r.rank} />
              </td>
              <td className="lb-td lb-td--email">
                {displayName(r.email)}
                {r.is_hard_mode_today && <span className="lb-gm-badge">GM</span>}
              </td>
              <td className="lb-td lb-td--num">{r.num_guesses}/6</td>
              <td className="lb-td lb-td--num">{formatTime(r.time_seconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GodmodeTodayTable({ rows }: { rows: HardModeTodayEntry[] }) {
  if (rows.length === 0) {
    return <p className="lb-empty">No Godmode results yet for today.</p>;
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
              className={rankClass(r.rank, r.is_hard_mode_today)}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <td className="lb-td lb-td--rank">
                <MedalIcon rank={r.rank} />
              </td>
              <td className="lb-td lb-td--email">
                {displayName(r.email)}
                {r.is_hard_mode_today && <span className="lb-gm-badge">GM</span>}
              </td>
              <td className="lb-td lb-td--num">{r.games_won}</td>
              <td className="lb-td lb-td--num">{(r.points ?? 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RewardsBanner() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lb-rewards">
      <div className="lb-rewards__row">
        <span className="lb-rewards__label">🎁 Win rewards every week!</span>
        <button
          type="button"
          className={`lb-rewards__info${open ? " lb-rewards__info--open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Reward details"
          aria-expanded={open}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="lb-rewards__details">
          <p className="lb-rewards__terms">
            Follow us on all platforms to claim your reward. If not followed, it passes to the next player.
          </p>
          <div className="lb-rewards__socials">
            <a href="https://www.instagram.com/playstumpd/" target="_blank" rel="noopener noreferrer" className="lb-rewards__link lb-rewards__link--ig" aria-label="Instagram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.reddit.com/r/playstumpd/" target="_blank" rel="noopener noreferrer" className="lb-rewards__link lb-rewards__link--reddit" aria-label="Reddit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 000-.462.342.342 0 00-.461 0c-.545.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.345.345 0 00-.206-.095z"/></svg>
            </a>
            <a href="https://x.com/playstumpd" target="_blank" rel="noopener noreferrer" className="lb-rewards__link lb-rewards__link--x" aria-label="X">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
      )}
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

type HardCacheMap = {
  today: CacheEntry<HardModeTodayEntry[]> | null;
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
const EMPTY_HARD_CACHE: HardCacheMap = { today: null, week: null, month: null, overall: null };

type Props = {
  open: boolean;
  onClose: () => void;
  puzzleDay?: number;
  hardModePuzzleDay?: number;
  invalidateKey?: number;
  isGodmode?: boolean;
};

export default function LeaderboardModal({ open, onClose, puzzleDay, hardModePuzzleDay, invalidateKey, isGodmode }: Props) {
  const [tab, setTab] = useState<Tab>("today");
  const [godmodeView, setGodmodeView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, forceUpdate] = useState(0);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      if (isGodmode) setGodmodeView(true);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => {
        setClosing(false);
        setVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);
  const cache = useRef<CacheMap>({ ...EMPTY_CACHE });
  const hardCache = useRef<HardCacheMap>({ ...EMPTY_HARD_CACHE });
  const lastInvalidateKey = useRef(invalidateKey);
  const bustNextTodayFetch = useRef(false);

  if (invalidateKey !== lastInvalidateKey.current) {
    cache.current.today = null;
    hardCache.current.today = null;
    lastInvalidateKey.current = invalidateKey;
    bustNextTodayFetch.current = true;
  }

  if (tab === "today") {
    if (!godmodeView && cache.current.todayPuzzleDay !== puzzleDay) {
      cache.current.today = null;
      cache.current.todayPuzzleDay = puzzleDay;
    }
    if (godmodeView && hardCache.current.todayPuzzleDay !== hardModePuzzleDay) {
      hardCache.current.today = null;
      hardCache.current.todayPuzzleDay = hardModePuzzleDay;
    }
  }

  const fetchTab = useRef<(tab: Tab, silent: boolean) => void>(undefined);

  fetchTab.current = (t: Tab, silent: boolean) => {
    const effectiveDay = godmodeView ? hardModePuzzleDay : puzzleDay;
    if (t === "today" && effectiveDay == null) return;

    if (!silent) setLoading(true);
    let cancelled = false;

    const doFetch = async () => {
      try {
        const now = Date.now();
        if (godmodeView) {
          switch (t) {
            case "today": {
              const bust = bustNextTodayFetch.current;
              bustNextTodayFetch.current = false;
              const data = await fetchHardModeTodayLeaderboard(hardModePuzzleDay!, bust);
              if (!cancelled) hardCache.current.today = { data: data.slice(0, 10), fetchedAt: now };
              break;
            }
            case "week": {
              const data = await fetchHardModeWeeklyLeaderboard(hardModePuzzleDay);
              if (!cancelled) hardCache.current.week = { data: data.slice(0, 10), fetchedAt: now };
              break;
            }
            case "month": {
              const data = await fetchHardModeMonthlyLeaderboard(hardModePuzzleDay);
              if (!cancelled) hardCache.current.month = { data: data.slice(0, 10), fetchedAt: now };
              break;
            }
            case "overall": {
              const data = await fetchHardModeOverallLeaderboard(hardModePuzzleDay);
              if (!cancelled) hardCache.current.overall = { data: data.slice(0, 10), fetchedAt: now };
              break;
            }
          }
        } else {
          switch (t) {
            case "today": {
              const bust = bustNextTodayFetch.current;
              bustNextTodayFetch.current = false;
              const data = await fetchTodayLeaderboard(puzzleDay!, bust);
              if (!cancelled) cache.current.today = { data: data.slice(0, 10), fetchedAt: now };
              break;
            }
            case "week": {
              const data = await fetchWeeklyLeaderboard(puzzleDay);
              if (!cancelled) cache.current.week = { data: data.slice(0, 10), fetchedAt: now };
              break;
            }
            case "month": {
              const data = await fetchMonthlyLeaderboard(puzzleDay);
              if (!cancelled) cache.current.month = { data: data.slice(0, 10), fetchedAt: now };
              break;
            }
            case "overall": {
              const data = await fetchOverallLeaderboard(puzzleDay);
              if (!cancelled) cache.current.overall = { data: data.slice(0, 10), fetchedAt: now };
              break;
            }
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

    const activeCache = godmodeView ? hardCache.current : cache.current;
    const entry = activeCache[tab];

    if (isStale(entry, tab)) {
      return fetchTab.current?.(tab, false);
    }

    if (tab === "today" && shouldPrefetch(entry)) {
      fetchTab.current?.(tab, true);
    }
  }, [open, tab, puzzleDay, invalidateKey, godmodeView, hardModePuzzleDay]);

  useEffect(() => {
    if (!open || tab !== "today") return;

    const activeCache = godmodeView ? hardCache.current : cache.current;
    const entry = activeCache.today;
    if (!entry) return;

    const age = Date.now() - entry.fetchedAt;
    const timeUntilPrefetch = Math.max(0, TTL.today - PREFETCH_BEFORE - age);

    const timer = setTimeout(() => {
      fetchTab.current?.("today", true);
    }, timeUntilPrefetch);

    return () => clearTimeout(timer);
  }, [open, tab, godmodeView, forceUpdate]);

  if (!visible) return null;

  const handleClose = () => {
    if (!closing) onClose();
  };

  const activeCache = godmodeView ? hardCache.current : cache.current;
  const currentEntry = activeCache[tab];
  const currentData = currentEntry?.data ?? null;

  return (
    <div className={`lb-backdrop${closing ? " lb-backdrop--closing" : ""}`} onClick={handleClose} role="presentation">
      <div
        className={`lb-card${godmodeView ? " lb-card--godmode" : ""}${closing ? " lb-card--closing" : ""}`}
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
          {godmodeView ? (
            <>
              <span className="lb-title__icon lb-title__icon--godmode" aria-hidden>🔱</span>
              The Pantheon
            </>
          ) : (
            <>
              <svg className="lb-title__icon" width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M6 3h12v3a6 6 0 0 1-12 0V3z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
                <path d="M6 5H4a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M18 5h2a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M9 17h6" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 12v5" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="8" y="20" width="8" height="2" rx="1" fill="#2d6a4f" />
              </svg>
              Hall of Fame
            </>
          )}
        </h2>

        <button
          type="button"
          className={`lb-godmode-toggle${godmodeView ? " lb-godmode-toggle--active" : ""}`}
          onClick={() => setGodmodeView((v) => !v)}
        >
          {godmodeView ? (
            <>
              <span className="lb-godmode-toggle__icon" aria-hidden>🏆</span>
              See Normal Players
            </>
          ) : (
            <>
              <span className="lb-godmode-toggle__icon" aria-hidden>🔱</span>
              See Godmode Players
            </>
          )}
        </button>

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

        <RewardsBanner />

        <div className="lb-body">
          {loading && currentData === null ? (
            <div className="lb-loading">
              <span className="lb-spinner" />
            </div>
          ) : currentData === null ? (
            <p className="lb-empty">Could not load leaderboard.</p>
          ) : godmodeView && tab === "today" ? (
            <GodmodeTodayTable rows={currentData as HardModeTodayEntry[]} />
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
