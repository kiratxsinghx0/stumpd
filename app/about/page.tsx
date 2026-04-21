import type { Metadata } from "next";
import Link from "next/link";
import {
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from "../../lib/contact";
import PageHeader from "../components/page-header";
import BackToGameLink from "../components/back-to-game-link";

export const metadata: Metadata = {
  title: "About — Stumpd",
  description:
    "Learn about Stumpd, the free daily IPL cricket guessing game built by Kylog Games. Discover who we are and why we created Stumpd.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader showHowToPlay={false} />
      <main className="legal-page">
        <article className="legal-page__inner">
          <BackToGameLink />

          <header className="legal-page__header">
            <h1 className="legal-page__title">About Stumpd</h1>
          </header>

          <div className="legal-page__intro-block">
            <p>
              <strong>Stumpd</strong> is a free daily word game for IPL cricket
              fans. Every day, a new mystery IPL cricketer is chosen — your job
              is to guess their name letter by letter in six attempts or fewer.
              After each guess, colour-coded tiles reveal which letters are
              correct, misplaced, or not in the name at all.
            </p>
            <p>
              Whether you are a die-hard IPL supporter or a casual cricket
              viewer, Stumpd gives you a fun, bite-sized challenge to start your
              day. Play the{" "}
              <Link href="/stumpd">daily puzzle</Link>, try{" "}
              <Link href="/stumpd?mode=hard">hard mode</Link> for an extra
              challenge, revisit past puzzles in the{" "}
              <Link href="/archive">archive</Link>, or{" "}
              <Link href="/challenge">challenge a friend</Link> head-to-head.
            </p>
          </div>

          <section className="legal-page__section" aria-labelledby="about-s1">
            <h2 id="about-s1">How the game works</h2>
            <p>
              Each puzzle presents you with blank tiles representing the letters
              of an IPL player&apos;s name. Type a valid player name and submit
              your guess. The tiles then change colour:
            </p>
            <ul>
              <li>
                <strong>Green</strong> — the letter is correct and in the right
                position.
              </li>
              <li>
                <strong>Yellow</strong> — the letter is in the name but in a
                different position.
              </li>
              <li>
                <strong>Grey</strong> — the letter is not in the name at all.
              </li>
            </ul>
            <p>
              Use those clues to narrow down the answer. You have six guesses to
              find today&apos;s player. A new puzzle drops every day at 6 AM IST.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="about-s2">
            <h2 id="about-s2">Game modes</h2>
            <p>
              Stumpd offers several ways to play:
            </p>
            <ul>
              <li>
                <strong>Daily Stumpd</strong> — the classic mode. One puzzle per
                day, same for everyone around the world. Build your streak!
              </li>
              <li>
                <strong>Hard Mode</strong> — no hints, no safety net. Pure name
                guessing for players who want the ultimate challenge.
              </li>
              <li>
                <strong>Challenge Mode</strong> — create a private room, share the
                code with a friend, and race to solve the same puzzle. See who
                gets there first.
              </li>
              <li>
                <strong>Archive</strong> — missed a day? Browse the calendar and
                play any past puzzle you haven&apos;t tried yet.
              </li>
            </ul>
          </section>

          <section className="legal-page__section" aria-labelledby="about-s3">
            <h2 id="about-s3">Who built Stumpd</h2>
            <p>
              Stumpd is made by <strong>Kylog Games</strong>, an indie studio
              passionate about combining word puzzles with the sports we love.
              We started with{" "}
              <a
                href="https://fifawordle.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                FIFA Wordle
              </a>{" "}
              — a daily football guessing game — and brought the same concept to
              the world of IPL cricket with Stumpd.
            </p>
            <p>
              We are a small team of developers and cricket fans based in India.
              We believe that the best games are simple, free, and fun to share
              with friends.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="about-s4">
            <h2 id="about-s4">Why we built Stumpd</h2>
            <p>
              The IPL season brings millions of fans together every year. We
              wanted to create something that captures that excitement beyond
              just watching matches — a daily ritual that tests your knowledge
              and keeps you connected with the players and teams you follow.
            </p>
            <p>
              Inspired by the global Wordle phenomenon, we saw an opportunity
              to build a game tailor-made for the IPL community. A game that is
              quick to play, easy to share, and impossible not to come back to
              the next day.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="about-s5">
            <h2 id="about-s5">What is the IPL?</h2>
            <p>
              The Indian Premier League (IPL) is a professional Twenty20 cricket
              league in India, featuring city-based franchise teams with players
              from around the world. Since its inception in 2008, the IPL has
              grown into one of the most-watched and most-loved sporting events
              globally, with seasons running annually and attracting millions of
              fans.
            </p>
          </section>

          <section
            className="legal-page__section legal-page__contact"
            aria-labelledby="about-s6"
          >
            <h2 id="about-s6">Get in touch</h2>
            <p>
              Have feedback, ideas, or just want to say hello? We&apos;d love to
              hear from you. Reach out at{" "}
              <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a> or visit our{" "}
              <Link href="/contact">contact page</Link>.
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
