import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../components/page-header";
import BackToGameLink from "../components/back-to-game-link";

export const metadata: Metadata = {
  title: "Blog — Stumpd",
  description:
    "News, stories, and insights from the team behind Stumpd — the daily IPL cricket guessing game.",
};

const posts = [
  {
    slug: "what-is-stumpd",
    title: "What Is Stumpd? The Daily IPL Cricket Guessing Game Explained",
    date: "April 10, 2026",
    excerpt:
      "Stumpd is a free, daily word game where you guess the name of a mystery IPL cricketer in six attempts. Learn how it works, who it's for, and why thousands of cricket fans play every day.",
  },
  {
    slug: "the-inspiration-behind-stumpd",
    title: "How Stumpd Was Born: The Inspiration Behind the Game",
    date: "April 12, 2026",
    excerpt:
      "From the global Wordle craze to the IPL season — here's the story of how a love for cricket and word puzzles turned into Stumpd.",
  },
  {
    slug: "the-journey-of-stumpd",
    title: "From Idea to Launch: The Journey of Stumpd",
    date: "April 15, 2026",
    excerpt:
      "Building a game is one thing. Getting players to love it is another. Here's how Stumpd went from a rough prototype to a game played by thousands.",
  },
];

export default function BlogIndex() {
  return (
    <>
      <PageHeader showHowToPlay={false} />
      <main className="legal-page">
        <article className="legal-page__inner">
          <BackToGameLink />

          <header className="legal-page__header">
            <h1 className="legal-page__title">Blog</h1>
          </header>

          <div className="legal-page__intro-block">
            <p>
              Stories, updates, and behind-the-scenes insights from the team at{" "}
              <strong>Kylog Games</strong> — the makers of{" "}
              <Link href="/stumpd">Stumpd</Link>.
            </p>
          </div>

          <div className="blog-list">
            {posts.map((post) => (
              <article key={post.slug} className="blog-list__item">
                <time className="blog-list__date">{post.date}</time>
                <h2 className="blog-list__title">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="blog-list__excerpt">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`} className="blog-list__read-more">
                  Read more &rarr;
                </Link>
              </article>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}
