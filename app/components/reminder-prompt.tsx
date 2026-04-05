"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  registerAndSubscribe,
  canRequestNotifications,
  isAlreadySubscribed,
} from "../services/push-notifications";

const LS_KEY = "stumpd_reminder_asked";

/**
 * Stored values:
 *   null            → never interacted, show both prompts
 *   "dismissed_once" → dismissed in the modal, still show game screen prompt
 *   "dismissed"     → dismissed twice (or on game screen), hide everything
 *   "subscribed"    → accepted, hide everything
 *   "denied"        → browser blocked, hide everything
 *   "error"         → something failed, hide everything
 */

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("stumpd-reminder-update", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("stumpd-reminder-update", cb);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return null;
}

function markAsked(value: string) {
  localStorage.setItem(LS_KEY, value);
  window.dispatchEvent(new Event("stumpd-reminder-update"));
}

function shouldShow(lsValue: string | null, variant: string): boolean {
  if (!lsValue) return true;
  if (lsValue === "dismissed_once" && variant === "compact") return true;
  return false;
}

type Props = {
  variant?: "default" | "compact" | "inline";
};

export default function ReminderPrompt({ variant = "default" }: Props) {
  const lsValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const visible = shouldShow(lsValue, variant);

  useEffect(() => {
    if (!visible) return;
    if (isAlreadySubscribed() || !canRequestNotifications()) return;
    const timer = setTimeout(() => setReady(true), variant === "inline" ? 0 : 600);
    return () => clearTimeout(timer);
  }, [visible, variant]);

  const handleAccept = useCallback(async () => {
    setStatus("loading");
    try {
      const ok = await registerAndSubscribe();
      if (ok) {
        setStatus("success");
        markAsked("subscribed");
        setTimeout(() => setReady(false), 2200);
      } else {
        markAsked("denied");
        setReady(false);
      }
    } catch {
      markAsked("error");
      setReady(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    const current = getSnapshot();
    if (variant === "inline" && !current) {
      markAsked("dismissed_once");
    } else {
      markAsked("dismissed");
    }
    setReady(false);
  }, [variant]);

  if (!ready || !visible) return null;

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
