import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../../components/page-header";
import BackToGameLink from "../../components/back-to-game-link";

export const metadata: Metadata = {
  title: "How Stumpd Was Born: The Inspiration Behind the Game — Stumpd Blog",
  description:
    "From the global Wordle craze to the IPL season — the story of how a love for cricket and word puzzles turned into Stumpd.",
  openGraph: {
    title: "How Stumpd Was Born: The Inspiration Behind the Game",
    description:
      "The story behind Stumpd — how a love for IPL cricket and daily word games created something new.",
    type: "article",
  },
};

export default function InspirationPost() {
  return (
    <>
      <PageHeader showHowToPlay={false} />
      <main className="legal-page">
        <article className="legal-page__inner">
          <BackToGameLink />

          <header className="legal-page__header">
            <h1 className="legal-page__title">
              How Stumpd Was Born: The Inspiration Behind the Game
            </h1>
            <p className="legal-page__updated">April 12, 2026</p>
          </header>

          <div className="legal-page__intro-block">
            <p>
              Every project has an origin story. For Stumpd, it starts with two
              things: an obsession with the IPL and the game that made the whole
              world guess five-letter words at breakfast.
            </p>
          </div>

          <section className="legal-page__section" aria-labelledby="ins-s1">
            <h2 id="ins-s1">The Wordle effect</h2>
            <p>
              When Wordle went viral in early 2022, it changed how people
              thought about casual games. A single puzzle per day, no app to
              download, no account required, and a simple sharing format that
              turned social media timelines green and yellow. It proved that
              constraints — one puzzle, six guesses, everyone gets the same
              word — can make a game more addictive, not less.
            </p>
            <p>
              We were hooked like everyone else. But we also noticed something:
              the concept was incredibly flexible. What if the word was not
              random? What if it was the name of someone you already cared
              about?
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="ins-s2">
            <h2 id="ins-s2">Cricket meets word puzzles</h2>
            <p>
              The Indian Premier League brings together the best cricket talent
              in the world. Every season, fans debate lineups, track
              performances, and memorise player names across ten franchise
              teams. That depth of knowledge — names, spellings, team
              associations — felt like a perfect fit for a guessing game.
            </p>
            <p>
              The idea was simple: take the daily puzzle format and replace the
              generic dictionary word with an IPL player&apos;s name. Suddenly,
              the game was not just about language skills — it was about how
              well you know the players you watch every evening.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="ins-s3">
            <h2 id="ins-s3">Building on FIFA Wordle</h2>
            <p>
              Before Stumpd, we built{" "}
              <a
                href="https://fifawordle.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                FIFA Wordle
              </a>{" "}
              — the same concept applied to football players. That project
              taught us a lot about what works and what does not in
              sports-themed word games. We learned that players love the daily
              cadence, that streaks drive retention, and that head-to-head
              challenges add a social layer that keeps people coming back.
            </p>
            <p>
              With those lessons in hand, we set out to build something
              specifically for cricket. The IPL audience is enormous and
              passionate, and we wanted to give them a game that felt like it
              was made just for them.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="ins-s4">
            <h2 id="ins-s4">The &ldquo;aha&rdquo; moment</h2>
            <p>
              The real turning point came during the 2025 IPL season. We were
              watching a match and debating player names with friends — who
              played for which team last year, how to spell that overseas
              player&apos;s name, whether a certain player had been traded. It
              hit us: this was already a guessing game. We just needed to put it
              on a screen.
            </p>
            <p>
              Within weeks, we had a working prototype. We shared it with a
              small group of cricket-loving friends. The reaction was instant:
              &ldquo;I need this every morning.&rdquo; That was all the
              validation we needed to turn a weekend experiment into a real
              product.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="ins-s5">
            <h2 id="ins-s5">What drives us</h2>
            <p>
              Stumpd is not backed by a big studio. It is an indie project built
              by a small team at <Link href="/about">Kylog Games</Link> who
              genuinely love cricket and puzzles. We build the features we would
              want as players ourselves — hard mode for the competitive crowd,
              challenge mode for trash-talking with friends, and an archive so
              you never miss a puzzle.
            </p>
            <p>
              If you want to know how the game evolved after that first
              prototype, read about{" "}
              <Link href="/blog/the-journey-of-stumpd">
                the full journey of Stumpd
              </Link>
              . Or if you are new, start with{" "}
              <Link href="/blog/what-is-stumpd">
                what Stumpd is and how to play
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
