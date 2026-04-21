import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../../components/page-header";
import BackToGameLink from "../../components/back-to-game-link";

export const metadata: Metadata = {
  title: "What Is Stumpd? The Daily IPL Cricket Guessing Game Explained — Stumpd Blog",
  description:
    "Stumpd is a free daily word game where you guess the name of a mystery IPL cricketer in six attempts. Learn how it works and why cricket fans love it.",
  openGraph: {
    title: "What Is Stumpd? The Daily IPL Cricket Guessing Game Explained",
    description:
      "Guess the mystery IPL cricketer in 6 tries. Learn how Stumpd works and start playing today.",
    type: "article",
  },
};

export default function WhatIsStumpdPost() {
  return (
    <>
      <PageHeader showHowToPlay={false} />
      <main className="legal-page">
        <article className="legal-page__inner">
          <BackToGameLink />

          <header className="legal-page__header">
            <h1 className="legal-page__title">
              What Is Stumpd? The Daily IPL Cricket Guessing Game Explained
            </h1>
            <p className="legal-page__updated">April 10, 2026</p>
          </header>

          <div className="legal-page__intro-block">
            <p>
              If you are a cricket fan and love word puzzles, chances are you
              have heard of <strong>Wordle</strong> — the viral daily guessing
              game that took the internet by storm. Now imagine Wordle, but
              instead of guessing a random five-letter word, you are guessing
              the name of an IPL cricketer. That is{" "}
              <strong><Link href="/stumpd">Stumpd</Link></strong>.
            </p>
          </div>

          <section className="legal-page__section" aria-labelledby="wis-s1">
            <h2 id="wis-s1">The basics</h2>
            <p>
              Every day at 6 AM IST, a new puzzle goes live on{" "}
              <Link href="/stumpd">playstumpd.com</Link>. The puzzle is a
              mystery IPL player&apos;s name, hidden behind blank tiles. Your
              mission: figure out who it is in six guesses or fewer.
            </p>
            <p>
              You type a valid IPL player name and hit submit. The tiles then
              change colour to give you feedback:
            </p>
            <ul>
              <li>
                <strong>Green</strong> means the letter is correct and in the
                right spot.
              </li>
              <li>
                <strong>Yellow</strong> means the letter is in the name but in
                a different position.
              </li>
              <li>
                <strong>Grey</strong> means the letter is not in the name at
                all.
              </li>
            </ul>
            <p>
              With each guess, you narrow down the possibilities until you
              either crack it or run out of attempts.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="wis-s2">
            <h2 id="wis-s2">Who is Stumpd for?</h2>
            <p>
              Stumpd is built for anyone who follows the Indian Premier League.
              Whether you are a lifelong cricket fan who knows every squad by
              heart or a casual viewer who tunes in for the big matches, the
              game scales to your knowledge. Easier puzzles feature household
              names; harder ones might require you to dig deep into franchise
              rosters.
            </p>
            <p>
              It is also a great way to learn more about the IPL. If you did not
              know a player before Stumpd, you will after a few rounds of
              guessing.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="wis-s3">
            <h2 id="wis-s3">More than just the daily puzzle</h2>
            <p>
              While the daily puzzle is the heart of the game, Stumpd offers
              several other ways to play:
            </p>
            <ul>
              <li>
                <strong>Hard Mode</strong> strips away all hints and assistance.
                No clues, no safety net — just you and the blank tiles. It is a
                true test of your IPL knowledge.
              </li>
              <li>
                <strong>Challenge Mode</strong> lets you{" "}
                <Link href="/challenge">create a private room</Link>, share a
                code with a friend, and race to solve the same puzzle. It turns
                a solo game into a head-to-head competition.
              </li>
              <li>
                <strong>Archive</strong> gives you access to{" "}
                <Link href="/archive">every past puzzle</Link>. Missed a day?
                Go back and play it whenever you want.
              </li>
            </ul>
          </section>

          <section className="legal-page__section" aria-labelledby="wis-s4">
            <h2 id="wis-s4">Why players keep coming back</h2>
            <p>
              There is something satisfying about the daily ritual. One puzzle
              per day, same for everyone, and the result is easy to share. The
              streak system adds a layer of motivation — once you have a 10-day
              streak going, breaking it feels painful. Leaderboards and stats
              let you track your performance over time, and challenge mode
              brings friendly competition into the mix.
            </p>
            <p>
              Stumpd is free to play with no account required. You can jump in,
              solve today&apos;s puzzle in a couple of minutes, and get on with
              your day. Or spend twenty minutes dissecting every possible player
              name — it is up to you.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="wis-s5">
            <h2 id="wis-s5">Try it today</h2>
            <p>
              Ready to test your IPL knowledge?{" "}
              <Link href="/stumpd">Play today&apos;s Stumpd puzzle</Link> and
              see if you can guess the mystery cricketer. And if you want to
              know the story behind how Stumpd was created, read{" "}
              <Link href="/blog/the-inspiration-behind-stumpd">
                how Stumpd was born
              </Link>
              .
            </p>
          </section>

          <nav className="blog-list__nav" aria-label="More blog posts">
            <Link href="/blog">&larr; All posts</Link>
          </nav>
        </article>
      </main>
    </>
  );
}
