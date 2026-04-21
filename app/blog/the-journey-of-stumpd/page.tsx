import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../../components/page-header";
import BackToGameLink from "../../components/back-to-game-link";

export const metadata: Metadata = {
  title: "From Idea to Launch: The Journey of Stumpd — Stumpd Blog",
  description:
    "How Stumpd went from a weekend prototype to a daily game played by thousands of IPL cricket fans. The full development story.",
  openGraph: {
    title: "From Idea to Launch: The Journey of Stumpd",
    description:
      "The development story of Stumpd — milestones, challenges, and what's next.",
    type: "article",
  },
};

export default function JourneyPost() {
  return (
    <>
      <PageHeader showHowToPlay={false} />
      <main className="legal-page">
        <article className="legal-page__inner">
          <BackToGameLink />

          <header className="legal-page__header">
            <h1 className="legal-page__title">
              From Idea to Launch: The Journey of Stumpd
            </h1>
            <p className="legal-page__updated">April 15, 2026</p>
          </header>

          <div className="legal-page__intro-block">
            <p>
              Building a game is one thing. Getting people to play it every day
              is something else entirely. Here is the story of how Stumpd went
              from a rough prototype to a daily ritual for IPL cricket fans.
            </p>
          </div>

          <section className="legal-page__section" aria-labelledby="jrn-s1">
            <h2 id="jrn-s1">Starting small</h2>
            <p>
              The first version of Stumpd was bare-bones. A single daily puzzle,
              a basic tile grid, and a list of IPL player names pulled together
              over a weekend. There was no hard mode, no challenge feature, no
              archive — just the core mechanic: guess the name in six tries.
            </p>
            <p>
              We shared it with a handful of friends and fellow cricket fans to
              see if the concept worked. The feedback was clear: the core loop
              was fun, but people wanted more. They wanted to compete, they
              wanted to track their progress, and they wanted to play missed
              puzzles.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="jrn-s2">
            <h2 id="jrn-s2">Adding depth</h2>
            <p>
              The first major addition was <strong>Hard Mode</strong>. We
              noticed that experienced players were solving the daily puzzle
              within two or three guesses and wanted something tougher. Hard
              Mode removes all hints and clues — no colour-coded feedback
              beyond basic correctness. It immediately became the preferred mode
              for our most competitive players.
            </p>
            <p>
              Next came <strong>streaks and statistics</strong>. Tracking how
              many days in a row you have solved the puzzle turned out to be a
              powerful motivator. Players started screenshotting their streaks
              and sharing them. The simple addition of a counter changed how
              people felt about the game.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="jrn-s3">
            <h2 id="jrn-s3">Going social with Challenge Mode</h2>
            <p>
              Stumpd started as a solo experience, but cricket is a social sport.
              Fans watch matches together, argue about teams, and love
              one-upping each other. <strong>Challenge Mode</strong> brought
              that energy into the game.
            </p>
            <p>
              The concept is simple: create a room, get a code, share it with a
              friend, and both of you solve the same puzzle. A timer tracks how
              fast each player finishes. It turned Stumpd from something you
              play alone at breakfast into something you play against your
              group chat.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="jrn-s4">
            <h2 id="jrn-s4">The Archive and leaderboards</h2>
            <p>
              One of the most-requested features was the ability to play past
              puzzles. The daily format is great, but missing a day felt
              punishing — especially if it broke a streak. The{" "}
              <Link href="/archive">Archive</Link> fixed that by opening up a
              calendar of every past puzzle, playable any time.
            </p>
            <p>
              Leaderboards added another competitive dimension. Seeing your name
              ranked against other players — or finding out your friend solved
              today&apos;s puzzle in fewer guesses — keeps the daily engagement
              high. It is not just about solving the puzzle; it is about solving
              it better than everyone else.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="jrn-s5">
            <h2 id="jrn-s5">Lessons learned</h2>
            <p>
              Building Stumpd taught us that simplicity is everything. The core
              mechanic — guess a name in six tries with colour feedback — has
              not changed since day one. Every feature we added supports that
              core, not replaces it. Hard mode makes it harder. Challenge mode
              makes it social. The archive makes it accessible. But the
              fundamental game is the same.
            </p>
            <p>
              We also learned that community feedback is invaluable. Many of
              our best features came from player suggestions. The streak system,
              the archive, and several quality-of-life improvements all started
              as messages from players who cared enough to tell us what they
              wanted.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="jrn-s6">
            <h2 id="jrn-s6">What comes next</h2>
            <p>
              Stumpd is still evolving. We are always experimenting with new
              ideas — new game modes, better social features, and ways to make
              the experience even more fun for IPL fans. We are a small team,
              so we move fast and ship often.
            </p>
            <p>
              If you have not tried Stumpd yet,{" "}
              <Link href="/stumpd">play today&apos;s puzzle</Link> and see what
              the buzz is about. And if you want to know more about the game
              itself, check out{" "}
              <Link href="/blog/what-is-stumpd">
                our guide to what Stumpd is
              </Link>{" "}
              or learn about{" "}
              <Link href="/blog/the-inspiration-behind-stumpd">
                the inspiration behind it
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
