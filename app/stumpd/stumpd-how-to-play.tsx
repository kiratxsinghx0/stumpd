"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

const COLORS = {
  correct: { bg: "#6aaa64", border: "#6aaa64", color: "#fff" },
  present: { bg: "#c9b458", border: "#c9b458", color: "#fff" },
  absent: { bg: "#787c7e", border: "#787c7e", color: "#fff" },
  empty: { bg: "#fff", border: "#d3d6da", color: "#1a1a1a" },
} as const;

type Status = keyof typeof COLORS;

function Tile({ letter, status }: { letter: string; status: Status }) {
  const c = COLORS[status];
  return (
    <span
      className="htp__tile"
      style={
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          color: c.color,
        } as CSSProperties
      }
    >
      {letter}
    </span>
  );
}

export default function StumpdHowToPlay() {
  return (
    <div className="htp">
      <header className="htp__header">
        <h1 className="htp__title" id="how-to-play-heading">
          How to Play
        </h1>
        <p className="htp__subtitle">
          Guess the mystery IPL cricketer in 6 tries
        </p>
      </header>

      <section className="htp__card">
        <div className="htp__step">
          <span className="htp__step-num">1</span>
          <p className="htp__step-text">
            Type an IPL cricketer&apos;s name and press <kbd>Enter</kbd>
          </p>
        </div>
        <div className="htp__step">
          <span className="htp__step-num">2</span>
          <p className="htp__step-text">
            Tiles change color to show how close each letter is
          </p>
        </div>
        <div className="htp__step">
          <span className="htp__step-num">3</span>
          <p className="htp__step-text">
            Use the clues to crack it in 6 guesses or fewer
          </p>
        </div>
      </section>

      <section className="htp__card">
        <h2 className="htp__section-title">Tile Colors</h2>
        <div className="htp__color-legend">
          <div className="htp__color-item">
            <Tile letter="V" status="correct" />
            <span className="htp__color-label">
              Correct letter, correct spot
            </span>
          </div>
          <div className="htp__color-item">
            <Tile letter="O" status="present" />
            <span className="htp__color-label">
              Correct letter, wrong spot
            </span>
          </div>
          <div className="htp__color-item">
            <Tile letter="A" status="absent" />
            <span className="htp__color-label">Not in the word</span>
          </div>
        </div>
        <div className="htp__example-wrap">
          <p className="htp__example-label">Example</p>
          <div className="htp__tile-row" aria-hidden>
            <Tile letter="V" status="correct" />
            <Tile letter="I" status="empty" />
            <Tile letter="R" status="present" />
            <Tile letter="A" status="absent" />
            <Tile letter="T" status="correct" />
          </div>
        </div>
      </section>

      <div className="htp__tip">
        <span className="htp__tip-icon" aria-hidden>
          💡
        </span>
        <p className="htp__tip-text">
          Names are shortened to 5 letters — it can be a first or last name.
          <br />
          Example: <strong>YUVRAJ</strong> → <strong>YUVRA</strong>
        </p>
      </div>

      <section className="htp__card">
        <h2 className="htp__section-title">Hints</h2>
        <p className="htp__hints-intro">
          Wrong guesses unlock hints to help narrow it down:
        </p>
        <div className="htp__hint-timeline">
          <div className="htp__hint-step">
            <span className="htp__hint-badge">Guess 1</span>
            <span className="htp__hint-icon" aria-hidden>
              🏏
            </span>
            <span className="htp__hint-label">IPL Team &amp; Nationality</span>
          </div>
          <div className="htp__hint-step">
            <span className="htp__hint-badge">Guess 2</span>
            <span className="htp__hint-icon" aria-hidden>
              💡
            </span>
            <span className="htp__hint-label">Trivia clue</span>
          </div>
          <div className="htp__hint-step">
            <span className="htp__hint-badge">Guess 3</span>
            <span className="htp__hint-icon" aria-hidden>
              🎯
            </span>
            <span className="htp__hint-label">Playing role</span>
          </div>
        </div>
      </section>

      <footer className="htp__footer">
        <p>A new puzzle drops every day — come back tomorrow!</p>
        <p>
          <Link href="/contact" className="htp__footer-link">
            Need help? Get in touch
          </Link>
        </p>
      </footer>
    </div>
  );
}
