"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

const TILE_DEFAULT = {
  backgroundColor: "#fff",
  borderColor: "#d3d6da",
  color: "#000",
} as const;

const TILE_STYLES = {
  correct: {
    backgroundColor: "#6aaa64",
    borderColor: "#6aaa64",
    color: "#fff",
  },
  present: {
    backgroundColor: "#c9b458",
    borderColor: "#c9b458",
    color: "#fff",
  },
  absent: {
    backgroundColor: "#787c7e",
    borderColor: "#787c7e",
    color: "#fff",
  },
} as const;

function ExampleRow({
  word,
  index,
  kind,
  flipDelayMs = 0,
}: {
  word: string;
  index: number;
  kind: keyof typeof TILE_STYLES;
  flipDelayMs?: number;
}) {
  const letters = word.toUpperCase().split("");
  return (
    <div className="how-to-play-tile-row" aria-hidden>
      {letters.map((letter, i) => {
        const active = i === index;
        const s = active ? TILE_STYLES[kind] : TILE_DEFAULT;
        const style = active
          ? ({
              "--tile-bg": s.backgroundColor,
              "--tile-border": s.borderColor,
              animationDelay: `${flipDelayMs}ms`,
            } as CSSProperties & Record<string, string>)
          : ({
              backgroundColor: TILE_DEFAULT.backgroundColor,
              borderColor: TILE_DEFAULT.borderColor,
              color: TILE_DEFAULT.color,
            } as CSSProperties);
        return (
          <div
            key={`${word}-${i}`}
            className={
              "tile game-tile how-to-play-example-tile" +
              (active ? " flipping" : "")
            }
            style={style}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}

export default function StumpdHowToPlay() {
  return (
    <>
      <header className="legal-page__header how-to-play-page__header">
        <h1
          className="legal-page__title how-to-play-page__title"
          id="how-to-play-heading"
        >
          How to play
        </h1>
        <p className="legal-page__intro how-to-play-page__lede">
          Guess the IPL player in 6 tries.
        </p>
      </header>

      <div className="legal-page__intro-block how-to-play-page__rules-wrap">
        <ul className="how-to-play-rules">
          <li>
            Each guess must be a valid 5-letter player name.
          </li>
          <li>Names are shortened to fit 5 letters, it can be first or last name. Example: YUVRAJ → YUVRA</li>
          <li>
            After each guess, the color of the tiles will change to show how
            close your guess was to the answer.
          </li>
        </ul>
      </div>

      <section
        className="legal-page__section how-to-play-page__examples"
        aria-labelledby="how-examples"
      >
        <h2 id="how-examples">Examples</h2>

        <div className="how-to-play-example">
          <ExampleRow word="VIRAT" index={0} kind="correct" flipDelayMs={0} />
          <p className="how-to-play-example__caption">
            The letter <strong>V</strong> is in the word and in the correct
            spot.
          </p>
        </div>

        <div className="how-to-play-example">
          <ExampleRow word="DHONI" index={2} kind="present" flipDelayMs={320} />
          <p className="how-to-play-example__caption">
            The letter <strong>O</strong> is in the word but in the wrong spot.
          </p>
        </div>

        <div className="how-to-play-example">
          <ExampleRow word="YUVRA" index={4} kind="absent" flipDelayMs={640} />
          <p className="how-to-play-example__caption">
            The letter <strong>A</strong> is not in the word in any spot.
          </p>
        </div>
      </section>

      <section
        className="legal-page__section how-to-play-page__hints-section"
        aria-labelledby="how-hints"
      >
        <div className="stumpd-hints-panel">
          <div className="stumpd-hints-panel__header">
            <p className="stumpd-hints-panel__title" id="how-hints">Hints</p>
            <p className="stumpd-hints-panel__subtitle">
              A new hint unlocks with each wrong guess
            </p>
          </div>
          <div className="stumpd-hints-grid">
            <div className="stumpd-hint-chip">
              <span className="stumpd-hint-chip__icon">🏏</span>
              <span className="stumpd-hint-chip__text">IPL Team & Nationality</span>
            </div>
            <div className="stumpd-hint-chip">
              <span className="stumpd-hint-chip__icon">💡</span>
              <span className="stumpd-hint-chip__text">Trivia</span>
            </div>
            <div className="stumpd-hint-chip">
              <span className="stumpd-hint-chip__icon">🎯</span>
              <span className="stumpd-hint-chip__text">Role</span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="legal-page__section how-to-play-page__footnote-section"
        aria-labelledby="how-footnote"
      >
        <p className="how-to-play-page__footnote" id="how-footnote">
          A new puzzle is released daily with a countdown after each game—visit
          the{" "}
          <Link href="/contact">contact page</Link> if you need help.
        </p>
      </section>
    </>
  );
}
