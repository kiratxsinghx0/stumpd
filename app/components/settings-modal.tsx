"use client";

import { useEffect, useRef, useState } from "react";
import { isLoggedIn, getStoredUser, clearAuth, login, register, saveGameProgress } from "../services/auth-api";
import { readStats, readPerModeBaseline } from "../stumpd/stats-storage";
import { readCurrentGameProgress } from "../stumpd/progress-helpers";
import { isGodmodeActive, getGodmodeHoursRemaining } from "../utils/godmode-status";

export const OPEN_SETTINGS_EVENT = "stumpd-open-settings";

export function dispatchOpenSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT));
}

export type ToggleOrigin = { x: number; y: number };

type Props = {
  open: boolean;
  onClose: () => void;
  hardMode: boolean;
  onToggleHardMode: (enabled: boolean, origin?: ToggleOrigin) => void;
  canEnableHardMode: boolean;
  canDisableHardMode: boolean;
  onAuthChange?: () => void;
  puzzleDay?: number;
  hideHardMode?: boolean;
};

export default function SettingsModal({
  open,
  onClose,
  hardMode,
  onToggleHardMode,
  canEnableHardMode,
  canDisableHardMode,
  onAuthChange,
  puzzleDay,
  hideHardMode,
}: Props) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [igniting, setIgniting] = useState(false);
  const [cardBounce, setCardBounce] = useState(false);

  // Auth state
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setLoggedIn(isLoggedIn());
      setUserEmail(getStoredUser()?.email ?? null);
    } else {
      setIgniting(false);
      setCardBounce(false);
      setEmail("");
      setPassword("");
      setError("");
      setPasswordTouched(false);
      setShowLogoutConfirm(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggleDisabled = hardMode ? !canDisableHardMode : !canEnableHardMode;

  const handleToggle = () => {
    const enabling = !hardMode;
    if (enabling && toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect();
      const origin: ToggleOrigin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      setIgniting(true);
      setCardBounce(true);
      setTimeout(() => setCardBounce(false), 400);

      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);

      setTimeout(() => {
        onToggleHardMode(true, origin);
        onClose();
      }, 450);
    } else {
      onToggleHardMode(false);
    }
  };

  const passwordTooShort = passwordTouched && password.length > 0 && password.length < 6;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setPasswordTouched(true); return; }
    setError("");
    setLoading(true);
    try {
      const localStats = { ...readStats(), ...readPerModeBaseline() };
      if (mode === "register") {
        await register(email, password, undefined, localStats);
      } else {
        await login(email, password, localStats);
      }
      setLoggedIn(true);
      setUserEmail(getStoredUser()?.email ?? null);
      setEmail("");
      setPassword("");
      onAuthChange?.();
      onClose();
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

  const handleLogout = () => {
    if (isGodmodeActive()) {
      setShowLogoutConfirm(true);
      return;
    }
    performLogout();
  };

  const performLogout = () => {
    if (puzzleDay) {
      const progress = readCurrentGameProgress(hardMode, puzzleDay);
      if (progress) {
        saveGameProgress(progress).catch(() => {});
      }
    }
    clearAuth();
    try { localStorage.removeItem("stumpdpuzzle_hmChampionTs"); } catch {}
    document.body.classList.remove("body--godmode");
    document.documentElement.classList.remove("godmode-early");
    document.documentElement.style.removeProperty("background-color");
    document.documentElement.style.removeProperty("color-scheme");
    setLoggedIn(false);
    setUserEmail(null);
    setShowLogoutConfirm(false);
    onAuthChange?.();
  };

  const godmodeActive = loggedIn && isGodmodeActive();
  const godmodeHours = godmodeActive ? getGodmodeHoursRemaining() : 0;

  return (
    <div className="settings-backdrop" onClick={onClose} role="presentation">
      <div
        className={`settings-card${cardBounce ? " settings-card--bounce" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <button
          type="button"
          className="settings-close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="settings-title">
          <svg className="settings-title__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          Settings
        </h2>

        <div className="settings-body">
          {!hideHardMode && (
            <>
              <div className={`settings-option${toggleDisabled ? " settings-option--disabled" : ""}`}>
                <div className="settings-option__info">
                  <span className="settings-option__label">Hard Mode</span>
                  <span className="settings-option__desc">
                    No hints — win to unlock Godmode for 24h
                  </span>
                  {toggleDisabled && (
                    <span className="settings-option__warn">
                      Cannot switch modes while a game is in progress
                    </span>
                  )}
                </div>
                <button
                  ref={toggleRef}
                  type="button"
                  className={`settings-toggle${hardMode || igniting ? " settings-toggle--on" : ""}${igniting ? " settings-toggle--igniting" : ""}`}
                  onClick={handleToggle}
                  disabled={toggleDisabled}
                  role="switch"
                  aria-checked={hardMode}
                  aria-label="Toggle hard mode"
                >
                  <span className="settings-toggle__thumb" />
                </button>
              </div>

              <div className="settings-divider" />
            </>
          )}

          {loggedIn ? (
            <div className="settings-account">
              <div className="settings-option">
                <div className="settings-option__info">
                  <span className="settings-option__label">Account</span>
                  <span className="settings-option__desc">{userEmail}</span>
                  {godmodeActive && (
                    <span className="settings-option__desc settings-option__desc--godmode">
                      Godmode active — {godmodeHours}h remaining
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="settings-logout-btn"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
              {showLogoutConfirm && (
                <div className="settings-logout-confirm">
                  <p className="settings-logout-confirm__text">
                    Logging out will deactivate Godmode. Your timer will continue while you're logged out.
                  </p>
                  <div className="settings-logout-confirm__actions">
                    <button
                      type="button"
                      className="settings-logout-confirm__btn settings-logout-confirm__btn--cancel"
                      onClick={() => setShowLogoutConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="settings-logout-confirm__btn settings-logout-confirm__btn--confirm"
                      onClick={performLogout}
                    >
                      Log Out Anyway
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="settings-account">
              <span className="settings-option__label">Account</span>
              <p className="settings-auth-desc">
                Sign in to save stats, access the leaderboard, and unlock Godmode.
              </p>
              <form className="settings-auth-form" onSubmit={handleAuthSubmit}>
                <input
                  className="settings-auth-input"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <div className="settings-auth-field">
                  <input
                    className={`settings-auth-input${passwordTooShort ? " settings-auth-input--invalid" : ""}`}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    required
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                  />
                  {passwordTooShort && (
                    <p className="settings-auth-hint">
                      {6 - password.length} more character{6 - password.length !== 1 ? "s" : ""} needed
                    </p>
                  )}
                </div>
                {error && <p className="settings-auth-error">{error}</p>}
                <button
                  type="submit"
                  className="settings-auth-btn"
                  disabled={loading}
                >
                  {loading ? "..." : mode === "register" ? "Sign Up" : "Log In"}
                </button>
              </form>
              <button
                type="button"
                className="settings-auth-toggle"
                onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); setPasswordTouched(false); }}
              >
                {mode === "register" ? "Already have an account? Log in" : "New here? Create account"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
