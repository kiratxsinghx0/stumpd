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
  { id: "overall", label: "Overall" },
];

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function formatTime(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function TodayTable({ rows }: { rows: TodayEntry[] }) {
  if (rows.length === 0) {
    return <p className="lb-empty">No results yet for today.</p>;
  }
  return (
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
        {rows.map((r) => (
          <tr key={r.rank} className={r.rank <= 3 ? "lb-row lb-row--top" : "lb-row"}>
            <td className="lb-td lb-td--rank">
              {r.rank <= 3 ? RANK_MEDALS[r.rank - 1] : r.rank}
            </td>
            <td className="lb-td lb-td--email">{r.email}</td>
            <td className="lb-td lb-td--num">{r.num_guesses}/6</td>
            <td className="lb-td lb-td--num">{formatTime(r.time_seconds)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PeriodTable({ rows }: { rows: PeriodEntry[] }) {
  if (rows.length === 0) {
    return <p className="lb-empty">No results yet for this period.</p>;
  }
  return (
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
        {rows.map((r) => (
          <tr key={r.rank} className={r.rank <= 3 ? "lb-row lb-row--top" : "lb-row"}>
            <td className="lb-td lb-td--rank">
              {r.rank <= 3 ? RANK_MEDALS[r.rank - 1] : r.rank}
            </td>
            <td className="lb-td lb-td--email">{r.email}</td>
            <td className="lb-td lb-td--num">{r.games_won}</td>
            <td className="lb-td lb-td--num">{(r.points ?? 0).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type CacheMap = {
  today: TodayEntry[] | null;
  week: PeriodEntry[] | null;
  month: PeriodEntry[] | null;
  overall: PeriodEntry[] | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  puzzleDay?: number;
};

export default function LeaderboardModal({ open, onClose, puzzleDay }: Props) {
  const [tab, setTab] = useState<Tab>("today");
  const [loading, setLoading] = useState(false);
  const [, forceUpdate] = useState(0);
  const cache = useRef<CacheMap>({ today: null, week: null, month: null, overall: null });

  useEffect(() => {
    if (!open) return;

    const cached = cache.current[tab];
    if (cached !== null) return;

    let cancelled = false;
    setLoading(true);

    const doFetch = async () => {
      try {
        let data: TodayEntry[] | PeriodEntry[];
        switch (tab) {
          case "today":
            data = puzzleDay ? await fetchTodayLeaderboard(puzzleDay) : [];
            cache.current.today = (data as TodayEntry[]).slice(0, 10);
            break;
          case "week":
            data = await fetchWeeklyLeaderboard();
            cache.current.week = (data as PeriodEntry[]).slice(0, 10);
            break;
          case "month":
            data = await fetchMonthlyLeaderboard();
            cache.current.month = (data as PeriodEntry[]).slice(0, 10);
            break;
          case "overall":
            data = await fetchOverallLeaderboard();
            cache.current.overall = (data as PeriodEntry[]).slice(0, 10);
            break;
        }
      } catch {
        /* keep null */
      } finally {
        if (!cancelled) {
          setLoading(false);
          forceUpdate((n) => n + 1);
        }
      }
    };

    doFetch();
    return () => { cancelled = true; };
  }, [open, tab, puzzleDay]);

  useEffect(() => {
    if (!open) {
      cache.current = { today: null, week: null, month: null, overall: null };
    }
  }, [open]);

  if (!open) return null;

  const currentData = cache.current[tab];

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

        <h2 className="lb-title">Leaderboard</h2>

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
