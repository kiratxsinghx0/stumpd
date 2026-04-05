"use client";

import { useState, useEffect, useCallback } from "react";
import {
  registerAndSubscribe,
  canRequestNotifications,
  isAlreadySubscribed,
} from "../services/push-notifications";

const LS_SUBSCRIBED_KEY = "stumpd_push_subscribed";

type Props = {
  variant?: "default" | "compact" | "inline";
};

export default function ReminderPrompt({ variant = "default" }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    if (isAlreadySubscribed()) return;
    if (!canRequestNotifications()) return;
    try {
      if (localStorage.getItem(LS_SUBSCRIBED_KEY) === "true") return;
    } catch { /* ignore */ }
    setCanShow(true);
  }, []);

  const handleAccept = useCallback(async () => {
    setStatus("loading");
    try {
      const ok = await registerAndSubscribe();
      if (ok) {
        setStatus("success");
        setTimeout(() => setCanShow(false), 2200);
      } else {
        setDismissed(true);
      }
    } catch {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (!canShow || dismissed) return null;

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
