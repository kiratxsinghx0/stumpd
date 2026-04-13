"use client";

import { useState, useEffect } from "react";
import { register, login } from "../services/auth-api";
import type { GameResultPayload } from "../services/auth-api";
import { readStats, readPerModeBaseline } from "../stumpd/stats-storage";
import { activateGodmode } from "../utils/godmode-status";

type Props = {
  open: boolean;
  onClose: () => void;
  gameResultPayload?: GameResultPayload | null;
  onAuthSuccess: () => void;
};

export default function GodmodeLoginPrompt({
  open,
  onClose,
  gameResultPayload,
  onAuthSuccess,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("register");

  const passwordTooShort = passwordTouched && password.length > 0 && password.length < 6;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setPasswordTouched(true);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const localStats = { ...readStats(), ...readPerModeBaseline() };
      if (mode === "register") {
        await register(email, password, gameResultPayload ?? undefined, localStats);
        await activateGodmode();
      } else {
        await login(email, password, localStats, gameResultPayload ?? undefined);
        await activateGodmode();
      }
      onAuthSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (mode === "register" && msg.includes("already registered")) {
        setError("Email already registered — try logging in instead");
        setMode("login");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gm-prompt-backdrop" onClick={onClose} role="presentation">
      <div
        className="gm-prompt-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Unlock Godmode"
      >
        <button
          type="button"
          className="gm-prompt-close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="gm-prompt-header">
          <span className="gm-prompt-header__icon" aria-hidden>&#128081;</span>
          <h2 className="gm-prompt-header__title">Unlock Godmode</h2>
          <p className="gm-prompt-header__desc">
            You conquered Hard Mode! Sign up or log in to activate Godmode for 24 hours.
          </p>
        </div>

        <form className="gm-prompt-form" onSubmit={handleSubmit}>
          <input
            className="gm-prompt-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <div className="gm-prompt-field">
            <input
              className={`gm-prompt-input${passwordTooShort ? " gm-prompt-input--invalid" : ""}`}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              required
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
            {passwordTooShort && (
              <p className="gm-prompt-hint">
                {6 - password.length} more character{6 - password.length !== 1 ? "s" : ""} needed
              </p>
            )}
          </div>
          {error && <p className="gm-prompt-error">{error}</p>}
          <button
            type="submit"
            className="gm-prompt-btn"
            disabled={loading}
          >
            {loading ? "..." : mode === "register" ? "Sign Up & Activate" : "Log In & Activate"}
          </button>
        </form>

        <button
          type="button"
          className="gm-prompt-toggle"
          onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); setPasswordTouched(false); }}
        >
          {mode === "register" ? "Already have an account? Log in" : "New here? Create account"}
        </button>
      </div>
    </div>
  );
}
