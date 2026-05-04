"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "../components/page-header";
import { getArchivePlayedDays } from "../stumpd/stats-storage";
import { isLoggedIn, fetchArchivePlayed } from "../services/auth-api";

const ARCHIVE_START_YEAR = 2026;
const ARCHIVE_START_MONTH = 3; // April (0-indexed)
const LAUNCH_UTC_MS = Date.UTC(ARCHIVE_START_YEAR, ARCHIVE_START_MONTH, 1);
const MS_PER_DAY = 86_400_000;
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

/**
 * Convert (year, month, date) → absolute puzzle day, where April 1, 2026 = 1.
 * The backend stores puzzles by this running index, not by calendar day-of-month.
 */
function dateToPuzzleDay(year: number, month: number, date: number): number {
  return Math.floor((Date.UTC(year, month, date) - LAUNCH_UTC_MS) / MS_PER_DAY) + 1;
}

/** 6 AM IST = 00:30 UTC cutoff — today's puzzle hasn't "happened" until after this. */
function getTodayPuzzleAnchor(): { year: number; month: number; puzzleDay: number } {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setUTCHours(0, 30, 0, 0);
  if (now < cutoff) {
    cutoff.setUTCDate(cutoff.getUTCDate() - 1);
  }
  const year = cutoff.getUTCFullYear();
  const month = cutoff.getUTCMonth();
  const date = cutoff.getUTCDate();
  return { year, month, puzzleDay: dateToPuzzleDay(year, month, date) };
}

export default function ArchivePage() {
  const router = useRouter();
  const [year, setYear] = useState(ARCHIVE_START_YEAR);
  const [month, setMonth] = useState(ARCHIVE_START_MONTH);
  const [playedMap, setPlayedMap] = useState<Map<number, boolean>>(new Map());

  useEffect(() => {
    document.body.classList.remove("body--godmode");
    document.documentElement.classList.remove("godmode-early");
    document.documentElement.style.removeProperty("background-color");
    document.documentElement.style.removeProperty("color-scheme");
  }, []);

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

  const today = useMemo(() => getTodayPuzzleAnchor(), []);
  const maxPlayablePuzzleDay = today.puzzleDay - 1;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const isAtStart = year === ARCHIVE_START_YEAR && month === ARCHIVE_START_MONTH;
  const isAtCurrent = year === today.year && month === today.month;

  const goToPrevMonth = () => {
    if (isAtStart) return;
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (isAtCurrent) return;
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleDateClick = (puzzleDay: number) => {
    router.push(`/stumpd?day=${puzzleDay}`);
  };

  return (
    <main className="archive-page">
      <PageHeader showHowToPlay={false} logoSrc="/stumpd-logo.png" logoAlt="Stumpd" />

      <div className="archive-container">
        <div className="info-card">
          <p className="info-card__text">
            Missed a day? Browse the calendar and play any past Stumpd puzzle.
            Tap a date to replay that day&apos;s mystery cricketer.
            Dates you&apos;ve already played are marked with a star.
          </p>
        </div>
        <div className="archive-calendar">
          {/* Month / Year header */}
          <div className="archive-calendar__nav">
            <button
              type="button"
              className="archive-calendar__arrow"
              onClick={goToPrevMonth}
              disabled={isAtStart}
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
              onClick={goToNextMonth}
              disabled={isAtCurrent}
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
              const puzzleDay = dateToPuzzleDay(year, month, date);
              const playable = puzzleDay >= 1 && puzzleDay <= maxPlayablePuzzleDay;
              const played = playedMap.has(puzzleDay);
              const won = playedMap.get(puzzleDay) === true;

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
                  onClick={() => playable && handleDateClick(puzzleDay)}
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
