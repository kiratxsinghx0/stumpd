import type { Metadata } from "next";
import StumpdHowToPlay from "../stumpd/stumpd-how-to-play";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Play — Stumpd",
  description:
    "Guess the IPL cricketer in six tries. Learn the rules and tile colors.",
};

export default function HowToPlayPage() {
  return (
    <main className="legal-page how-to-play-page">
      <article className="legal-page__inner">
        <p className="legal-page__back">
          <Link href="/">← Back to Stumpd</Link>
        </p>
        <StumpdHowToPlay />
      </article>
    </main>
  );
}
