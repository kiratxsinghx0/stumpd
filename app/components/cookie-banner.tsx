"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/** Same key used when gating first-visit UI (e.g. How to play) until the user accepts. */
export const COOKIE_CONSENT_STORAGE_KEY = "fifa-wordle-cookie-consent";
const EXIT_MS = 380;

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (stored === "accepted" || stored === "rejected") {
        return;
      }
    } catch {
      /* ignore */
    }
    setShow(true);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const finishDismiss = useCallback(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setShow(false);
    setLeaving(false);
    setEntered(false);
  }, []);

  const dismiss = useCallback((value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent("cookie-consent", { detail: value }),
    );
    setLeaving(true);
    exitTimerRef.current = setTimeout(finishDismiss, EXIT_MS);
  }, [finishDismiss]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`cookie-banner${entered && !leaving ? " cookie-banner--visible" : ""}${leaving ? " cookie-banner--leaving" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-lead cookie-banner-desc"
    >
      <div className="cookie-banner__inner">
        <div className="cookie-banner__text">
          <h2 id="cookie-banner-title" className="cookie-banner__title">
            Manage privacy preferences
          </h2>
          <p id="cookie-banner-lead" className="cookie-banner__lead">
            We use cookies and may show ads. By using this site, you agree.
          </p>
          <div id="cookie-banner-desc" className="cookie-banner__body">
            <p className="cookie-banner__subhead">Cookie Policy</p>
            <ul className="cookie-banner__list">
              <li>Improve user experience</li>
              <li>Serve personalized ads via Google AdSense</li>
            </ul>
            <p className="cookie-banner__footnote">
              You can disable cookies in your browser settings.{" "}
              <Link href="/cookies">Full Cookie Policy</Link>
            </p>
          </div>
        </div>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--primary"
            onClick={() => dismiss("accepted")}
          >
            Accept all
          </button>
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--primary"
            onClick={() => dismiss("rejected")}
          >
            Reject all
          </button>
        </div>
      </div>
    </div>
  );
}
