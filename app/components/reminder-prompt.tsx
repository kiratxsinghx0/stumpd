"use client";

import { useState, useEffect, useCallback } from "react";
import {
  registerAndSubscribe,
  canRequestNotifications,
  isAlreadySubscribed,
  needsIOSInstallPrompt,
} from "../services/push-notifications";

const LS_SUBSCRIBED_KEY = "stumpd_push_subscribed";
const LS_IOS_DISMISSED_KEY = "stumpd_ios_install_dismissed";

function IOSShareIcon() {
  return (
    <svg
      className="reminder-ios__share-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

type ShowMode = "none" | "push" | "ios-install";

type Props = {
  variant?: "default" | "compact" | "inline";
};

export default function ReminderPrompt({ variant = "default" }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [showMode, setShowMode] = useState<ShowMode>("none");

  useEffect(() => {
    // DEV-ONLY: ?force_ios=1 in the URL forces the iOS install prompt
    const forceIOS = typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("force_ios") === "1";

    if (!forceIOS) {
      if (isAlreadySubscribed()) return;
      try {
        if (localStorage.getItem(LS_SUBSCRIBED_KEY) === "true") return;
      } catch { /* ignore */ }
    }

    if (!forceIOS && canRequestNotifications()) {
      setShowMode("push");
      return;
    }

    if (forceIOS || needsIOSInstallPrompt()) {
      if (!forceIOS) {
        try {
          if (localStorage.getItem(LS_IOS_DISMISSED_KEY) === "true") return;
        } catch { /* ignore */ }
      }
      setShowMode("ios-install");
    }
  }, []);

  const handleAccept = useCallback(async () => {
    setStatus("loading");
    try {
      const ok = await registerAndSubscribe();
      if (ok) {
        setStatus("success");
        setTimeout(() => setShowMode("none"), 2200);
      } else {
        setDismissed(true);
      }
    } catch {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    if (showMode === "ios-install") {
      try { localStorage.setItem(LS_IOS_DISMISSED_KEY, "true"); } catch { /* ignore */ }
    }
    setDismissed(true);
  }, [showMode]);

  if (showMode === "none" || dismissed) return null;

  /* ── iOS "Add to Home Screen" guidance ── */
  if (showMode === "ios-install") {
    if (variant === "inline") {
      return (
        <div className="reminder-inline reminder-ios">
          <span className="reminder-inline__text reminder-ios__text">
            For daily reminders, tap <IOSShareIcon /> then &ldquo;Add to Home Screen&rdquo;
          </span>
          <button
            type="button"
            className="reminder-inline__dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      );
    }

    const cls = variant === "compact"
      ? "reminder-prompt reminder-prompt--compact reminder-ios"
      : "reminder-prompt reminder-ios";

    return (
      <div className={cls}>
        <span className="reminder-prompt__text reminder-ios__text">
          {variant === "compact"
            ? <>Tap <IOSShareIcon /> → Add to Home Screen for daily reminders</>
            : <>To get daily reminders, tap <IOSShareIcon /> then &ldquo;Add to Home Screen&rdquo;</>}
        </span>
        <button
          type="button"
          className="reminder-prompt__btn reminder-prompt__btn--dismiss"
          onClick={handleDismiss}
        >
          Got it
        </button>
      </div>
    );
  }

  /* ── Standard push-notification prompt ── */
  const successCls = status === "success" ? " reminder-prompt--success" : "";

  if (variant === "inline") {
    if (status === "success") {
      return (
        <p className="share-prize-hook share-prize-hook--sticky share-modal-footnote-pop reminder-inline--success">
          You&apos;re all set! Daily reminders enabled.
        </p>
      );
    }
    return (
      <div className="reminder-inline">
        <span className="reminder-inline__text">Get daily puzzle reminders</span>
        <button
          type="button"
          className="reminder-inline__btn"
          onClick={handleAccept}
          disabled={status === "loading"}
        >
          {status === "loading" ? "…" : "Remind Me"}
        </button>
        <button
          type="button"
          className="reminder-inline__dismiss"
          onClick={handleDismiss}
          disabled={status === "loading"}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    );
  }

  const cls = variant === "compact"
    ? "reminder-prompt reminder-prompt--compact"
    : "reminder-prompt";

  return (
    <div className={`${cls}${successCls}`}>
      {status === "success" ? (
        <p className="reminder-prompt__text">You&apos;re all set! See you tomorrow.</p>
      ) : (
        <>
          <p className="reminder-prompt__text">
            {variant === "compact"
              ? "Get daily puzzle reminders!"
              : "Never miss a puzzle — get a daily reminder!"}
          </p>
          <div className="reminder-prompt__actions">
            <button
              type="button"
              className="reminder-prompt__btn reminder-prompt__btn--accept"
              onClick={handleAccept}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Setting up…" : "Remind Me"}
            </button>
            <button
              type="button"
              className="reminder-prompt__btn reminder-prompt__btn--dismiss"
              onClick={handleDismiss}
              disabled={status === "loading"}
            >
              No Thanks
            </button>
          </div>
        </>
      )}
    </div>
  );
}
