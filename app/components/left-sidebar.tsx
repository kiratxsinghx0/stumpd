"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  useState,
  type AnimationEvent,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fraunces } from "next/font/google";


const kylogBrand = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

type Props = {
  open: boolean;
  onClose: () => void;
};

const noopSubscribe = () => () => {};

const EXIT_FALLBACK_MS = 420;

function saveLegalReferrer(pathname: string) {
  try {
    sessionStorage.setItem("lastGamePath", pathname);
  } catch { /* private mode / quota */ }
}

export default function LeftSidebar({
  open,
  onClose,
}: Props) {
  const pathname = usePathname();
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Keep mounted through close so exit animations can run (see globals.css leftSidebarSlideOut). */
  /* eslint-disable react-hooks/set-state-in-effect -- prop-driven drawer: stay mounted until slide-out ends */
  useEffect(() => {
    if (open) {
      setMounted(true);
      setExiting(false);
    } else if (mounted) {
      setExiting(true);
    }
  }, [open, mounted]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!mounted || exiting) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, exiting]);

  useEffect(() => {
    if (!mounted || exiting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, exiting, onClose]);

  const finishExit = useCallback(() => {
    if (exitFallbackRef.current) {
      clearTimeout(exitFallbackRef.current);
      exitFallbackRef.current = null;
    }
    setMounted(false);
    setExiting(false);
  }, []);

  const handlePanelAnimationEnd = useCallback(
    (e: AnimationEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget) return;
      if (open) return;
      if (!e.animationName.includes("leftSidebarSlideOut")) return;
      finishExit();
    },
    [open, finishExit],
  );

  useEffect(() => {
    if (!exiting || open) return;
    exitFallbackRef.current = setTimeout(() => {
      finishExit();
    }, EXIT_FALLBACK_MS);
    return () => {
      if (exitFallbackRef.current) clearTimeout(exitFallbackRef.current);
    };
  }, [exiting, open, finishExit]);

  if (!isClient || !mounted) return null;

  const rootClass = exiting ? "left-sidebar-root left-sidebar-root--exiting" : "left-sidebar-root";

  return createPortal(
    <div className={rootClass}>
      <div
        className="left-sidebar-backdrop"
        onClick={onClose}
        role="presentation"
        aria-hidden
      />
      <aside
        id="left-sidebar-panel"
        className="left-sidebar-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kylog-games-heading"
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handlePanelAnimationEnd}
      >
        <div className="left-sidebar-header">
          <button
            type="button"
            className="left-sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="left-sidebar-brand">
            <Image
              className="left-sidebar-brand-logo left-sidebar-brand-logo--kylog"
              src="/kylog-games-logo.png"
              alt=""
              width={1024}
              height={1024}
              sizes="48px"
            />
            <h2
              id="kylog-games-heading"
              className={`left-sidebar-title ${kylogBrand.className}`}
            >
              Kylog games
            </h2>
          </div>
        </div>
        <nav className="left-sidebar-nav" aria-label="Site">
          <Link
            href="/"
            className={`left-sidebar-link left-sidebar-link--with-icon${
              pathname === "/" ? " left-sidebar-link--active" : ""
            }`}
            onClick={onClose}
          >
            <span className="left-sidebar-nav-logo-wrap" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="left-sidebar-nav-icon left-sidebar-nav-icon--home">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="left-sidebar-nav-label">Home</span>
          </Link>
          <p className="left-sidebar-nav-games-label">Games</p>
          <Link
            href="/stumpd"
            className={`left-sidebar-link left-sidebar-link--with-icon${
              pathname === "/stumpd" ? " left-sidebar-link--active" : ""
            }`}
            onClick={onClose}
          >
            <span className="left-sidebar-nav-logo-wrap" aria-hidden>
              <Image
                className="left-sidebar-nav-icon"
                src="/stumpd-logo.png"
                alt=""
                width={1024}
                height={1024}
                sizes="64px"
              />
            </span>
            <span className="left-sidebar-nav-label">Stumpd</span>
          </Link>
          <a
            href="https://fifawordle.com"
            className="left-sidebar-link left-sidebar-link--with-icon"
            onClick={onClose}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="left-sidebar-nav-logo-wrap" aria-hidden>
              <Image
                className="left-sidebar-nav-icon"
                src="/fifa-wordle-logo.png"
                alt=""
                width={1024}
                height={682}
                sizes="64px"
              />
            </span>
            <span className="left-sidebar-nav-label">FIFA Wordle</span>
          </a>
          <section
            className="left-sidebar-section"
            aria-labelledby="left-sidebar-privacy-settings-heading"
          >
            <h3
              id="left-sidebar-privacy-settings-heading"
              className="left-sidebar-section-title"
            >
              Privacy settings
            </h3>
            <Link href="/privacy" className="left-sidebar-link" onClick={() => { saveLegalReferrer(pathname); onClose(); }}>
              Privacy Policy
            </Link>
            <Link href="/terms" className="left-sidebar-link" onClick={() => { saveLegalReferrer(pathname); onClose(); }}>
              Terms of Service
            </Link>
            <Link href="/cookies" className="left-sidebar-link" onClick={() => { saveLegalReferrer(pathname); onClose(); }}>
              Cookie Policy
            </Link>
            <Link href="/contact" className="left-sidebar-link" onClick={() => { saveLegalReferrer(pathname); onClose(); }}>
              Contact
            </Link>
          </section>
        </nav>
      </aside>
    </div>,
    document.body,
  );
}
