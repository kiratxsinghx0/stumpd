import type { Metadata } from "next";
import PageHeader from "../components/page-header";
import BackToGameLink from "../components/back-to-game-link";

export const metadata: Metadata = {
  title: "Terms of Service — Stumpd",
  description:
    "Terms governing use of Stumpd (playstumpd.com) for entertainment purposes.",
};

export default function TermsOfService() {
  return (
    <>
      <PageHeader showHowToPlay={false} />
      <main className="legal-page">
      <article className="legal-page__inner">
        <BackToGameLink />

        <header className="legal-page__header">
          <h1 className="legal-page__title">Terms of Service</h1>
          <p className="legal-page__updated">Last updated: March 29, 2026</p>
        </header>

        <div className="legal-page__intro-block">
          <p>
            By using Stumpd (playstumpd.com), you agree to the following
            terms:
          </p>
        </div>

        <section className="legal-page__section" aria-labelledby="terms-s1">
          <h2 id="terms-s1">1. Use of website</h2>
          <p>This website is for entertainment purposes only.</p>
        </section>

        <section className="legal-page__section" aria-labelledby="terms-s2">
          <h2 id="terms-s2">2. No guarantees</h2>
          <p>
            We do not guarantee accuracy of game content or uninterrupted
            access.
          </p>
        </section>

        <section className="legal-page__section" aria-labelledby="terms-s3">
          <h2 id="terms-s3">3. Intellectual property</h2>
          <p>
            All content on this site is owned by Stumpd unless stated
            otherwise.
          </p>
        </section>

        <section className="legal-page__section" aria-labelledby="terms-s4">
          <h2 id="terms-s4">4. User conduct</h2>
          <p>
            You agree not to misuse the website or attempt to disrupt its
            functionality.
          </p>
        </section>

        <section className="legal-page__section" aria-labelledby="terms-s5">
          <h2 id="terms-s5">5. Changes</h2>
          <p>We may update these terms at any time without notice.</p>
        </section>

        <section
          className="legal-page__section legal-page__contact"
          aria-labelledby="terms-s6"
        >
          <h2 id="terms-s6">6. Contact</h2>
          <p>
            For questions about these terms, email{" "}
            <a href="mailto:contact@playstumpd.com">contact@playstumpd.com</a>
            .
          </p>
        </section>
      </article>
    </main>
    </>
  );
}
