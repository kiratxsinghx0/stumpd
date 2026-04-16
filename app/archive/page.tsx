"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "../components/page-header";
import { getArchivePlayedDays } from "../stumpd/stats-storage";
import { isLoggedIn, fetchArchivePlayed } from "../services/auth-api";

const ARCHIVE_START_YEAR = 2026;
const ARCHIVE_START_MONTH = 3; // April (0-indexed)
const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getMonthName(month: number) {
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][month];
}

/** 6 AM IST = 00:30 UTC cutoff — today's puzzle day hasn't "happened" until after this */
function getTodayPuzzleDate(): number {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setUTCHours(0, 30, 0, 0);
  if (now < cutoff) {
    cutoff.setUTCDate(cutoff.getUTCDate() - 1);
  }
  return cutoff.getUTCDate();
}

export default function ArchivePage() {
  const router = useRouter();
  const [year] = useState(ARCHIVE_START_YEAR);
  const [month] = useState(ARCHIVE_START_MONTH);
  const [playedMap, setPlayedMap] = useState<Map<number, boolean>>(new Map());

  useEffect(() => {
    const localPlayed = getArchivePlayedDays();
    setPlayedMap(localPlayed);

    if (isLoggedIn()) {
      fetchArchivePlayed().then((rows) => {
        const merged = new Map(localPlayed);
        for (const r of rows) {
          if (!merged.has(r.puzzle_day) || r.won) {
            merged.set(r.puzzle_day, !!r.won);
          }
        }
        setPlayedMap(merged);
      });
    }
  }, []);

  const todayDate = useMemo(() => getTodayPuzzleDate(), []);
  const maxPlayableDate = todayDate - 1;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const handleDateClick = (date: number) => {
    router.push(`/stumpd?day=${date}`);
  };

  return (
    <main className="archive-page">
      <PageHeader showHowToPlay={false} logoSrc="/stumpd-logo.png" logoAlt="Stumpd" />

      <div className="archive-container">
        <div className="archive-calendar">
          {/* Month / Year header */}
          <div className="archive-calendar__nav">
            <button
              type="button"
              className="archive-calendar__arrow"
              disabled
              aria-label="Previous month"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>

            <div className="archive-calendar__selectors">
              <span className="archive-calendar__month-label">{getMonthName(month)}</span>
              <span className="archive-calendar__year-label">{year}</span>
            </div>

            <button
              type="button"
              className="archive-calendar__arrow"
              disabled
              aria-label="Next month"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="archive-calendar__weekdays">
            {DAY_NAMES.map((d, i) => (
              <span key={i} className="archive-calendar__weekday">{d}</span>
            ))}
          </div>

          <div className="archive-calendar__divider" />

          {/* Date grid */}
          <div className="archive-calendar__grid">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="archive-calendar__cell archive-calendar__cell--empty" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = i + 1;
              const playable = date <= maxPlayableDate && date >= 1;
              const played = playedMap.has(date);
              const won = playedMap.get(date) === true;

              let cellClass = "archive-calendar__cell";
              if (!playable) cellClass += " archive-calendar__cell--disabled";
              else if (played && won) cellClass += " archive-calendar__cell--won";
              else if (played) cellClass += " archive-calendar__cell--played";
              else cellClass += " archive-calendar__cell--available";

              return (
                <button
                  key={date}
                  type="button"
                  className={cellClass}
                  disabled={!playable}
                  onClick={() => playable && handleDateClick(date)}
                  aria-label={`Day ${date}${played ? (won ? ", completed" : ", attempted") : ""}`}
                >
                  <span className="archive-calendar__cell-inner">
                    {played && (
                      <svg
                        className="archive-calendar__star"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={won ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    )}
                  </span>
                  <span className="archive-calendar__date">{date}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Link href="/" className="archive-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
