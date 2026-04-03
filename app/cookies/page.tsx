import Link from "next/link";
import type { Metadata } from "next";
import PageHeader from "../components/page-header";
import BackToGameLink from "../components/back-to-game-link";

export const metadata: Metadata = {
  title: "Cookie Policy — Stumpd",
  description:
    "How Stumpd (playstumpd.com) uses cookies, including for Google AdSense.",
};

export default function CookiePolicyPage() {
  return (
    <>
      <PageHeader showHowToPlay={false} />
      <main className="legal-page">
      <article className="legal-page__inner">
        <BackToGameLink />

        <header className="legal-page__header">
          <h1 className="legal-page__title">Cookie Policy</h1>
          <p className="legal-page__updated">Last updated: March 29, 2026</p>
        </header>

        <div className="legal-page__intro-block">
          <p>
            <strong>Stumpd</strong> (playstumpd.com) uses cookies and
            similar technologies as described on this page.
          </p>
        </div>

        <section
          className="legal-page__purposes"
          aria-labelledby="cookie-purposes-heading"
        >
          <h2 id="cookie-purposes-heading">We use cookies to:</h2>
          <ul>
            <li>Improve user experience</li>
            <li>Serve personalized ads via Google AdSense</li>
          </ul>
        </section>

        <section
          className="legal-page__cookie-note"
          aria-labelledby="cookie-choices-heading"
        >
          <h2 id="cookie-choices-heading">Your choices</h2>
          <p>You can disable cookies in your browser settings.</p>
        </section>

        <section
          className="legal-page__section legal-page__contact"
          aria-labelledby="cookie-more"
        >
          <h2 id="cookie-more">More information</h2>
          <p>
            For broader privacy details, see our{" "}
            <Link href="/privacy">Privacy Policy</Link>. Questions?{" "}
            <a href="mailto:contact@playstumpd.com">contact@playstumpd.com</a>
          </p>
        </section>
      </article>
    </main>
    </>
  );
}
