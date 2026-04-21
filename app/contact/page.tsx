import type { Metadata } from "next";
import Link from "next/link";
import {
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  SUPPORT_RESPONSE_EXPECTATION,
} from "../../lib/contact";
import PageHeader from "../components/page-header";
import BackToGameLink from "../components/back-to-game-link";

export const metadata: Metadata = {
  title: "Contact — Stumpd",
  description:
    "Get in touch with Stumpd for queries, feedback, or business inquiries. Find answers to frequently asked questions about the game.",
};

const faqs = [
  {
    q: "How do I play Stumpd?",
    a: "Visit the daily puzzle page and type a valid IPL player name. After each guess, the tiles change colour — green for correct letters in the right spot, yellow for letters in the wrong spot, and grey for letters not in the name. You have six attempts to find the mystery player.",
  },
  {
    q: "When does the daily puzzle reset?",
    a: "A new puzzle goes live every day at 6:00 AM IST (Indian Standard Time). Everyone around the world gets the same puzzle each day.",
  },
  {
    q: "Can I play puzzles I missed?",
    a: "Yes! The Archive page has a calendar of every past puzzle. Tap any previous date to play that day's puzzle.",
  },
  {
    q: "How does Challenge Mode work?",
    a: "Create a private challenge room and share the code with a friend. Both players solve the same puzzle, and you can see who finishes first. It's a great way to compete head-to-head.",
  },
  {
    q: "What is Hard Mode?",
    a: "Hard Mode removes all hints and clues. There is no colour-coded feedback beyond basic correctness — it is a pure test of your IPL player knowledge.",
  },
  {
    q: "How do I report a bug or suggest a feature?",
    a: "Send us an email using the address above. We read every message and typically respond within 24–48 hours. We love hearing from players!",
  },
];

export default function Contact() {
  return (
    <>
      <PageHeader showHowToPlay={false} />
      <main className="legal-page">
        <article className="legal-page__inner">
          <BackToGameLink />

          <header className="legal-page__header">
            <h1 className="legal-page__title">Contact</h1>
          </header>

          <div className="legal-page__intro-block">
            <p>
              For any queries, feedback, or business inquiries, reach out
              anytime. You can also check the frequently asked questions below.
            </p>
          </div>

          <section
            className="legal-page__section legal-page__contact legal-page__contact-hero"
            aria-labelledby="contact-email"
          >
            <h2 id="contact-email">Email</h2>
            <p className="legal-page__contact-email">
              <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
            </p>
            <p>{SUPPORT_RESPONSE_EXPECTATION}</p>
          </section>

          <section className="legal-page__section" aria-labelledby="contact-faq">
            <h2 id="contact-faq">Frequently Asked Questions</h2>
            {faqs.map((faq, i) => (
              <div key={i} style={{ marginBottom: i < faqs.length - 1 ? "1.25rem" : 0 }}>
                <p><strong>{faq.q}</strong></p>
                <p>{faq.a}</p>
              </div>
            ))}
          </section>

          <section className="legal-page__section" aria-labelledby="contact-more">
            <h2 id="contact-more">Learn more</h2>
            <p>
              Want to know more about the game? Visit our{" "}
              <Link href="/about">About page</Link>, read the{" "}
              <Link href="/blog">blog</Link>, or check out{" "}
              <Link href="/how-to-play">How to Play</Link>.
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
