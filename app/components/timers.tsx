"use client";

import { useState, useEffect, useRef } from "react";

function getNextPuzzleTime(): Date {
  const now = new Date();
  const next = new Date(now);
  // 6 AM IST = 00:30 UTC
  next.setUTCHours(0, 30, 0, 0);
  if (now >= next) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

function formatTime(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

export default function NextPuzzleTimer() {
  const [timeLeft, setTimeLeft] = useState(() =>
    getNextPuzzleTime().getTime() - Date.now()
  );
  const reloadedRef = useRef(false);

  useEffect(() => {
    if (getNextPuzzleTime().getTime() - Date.now() <= 0 && !reloadedRef.current) {
      reloadedRef.current = true;
      window.location.reload();
      return;
    }
    const interval = setInterval(() => {
      const remaining = getNextPuzzleTime().getTime() - Date.now();
      setTimeLeft(remaining);
      if (remaining <= 0 && !reloadedRef.current) {
        reloadedRef.current = true;
        clearInterval(interval);
        window.location.reload();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="next-puzzle-timer-card">
      <p className="next-puzzle-timer-card__label">Next puzzle in</p>
      <div className="next-puzzle-timer-card__time">{formatTime(timeLeft)}</div>
    </div>
  );
}
