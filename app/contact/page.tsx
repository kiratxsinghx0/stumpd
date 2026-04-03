import type { Metadata } from "next";
import PageHeader from "../components/page-header";
import BackToGameLink from "../components/back-to-game-link";

export const metadata: Metadata = {
  title: "Contact — Stumpd",
  description:
    "Get in touch with Stumpd for queries, feedback, or business inquiries.",
};

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

        <section
          className="legal-page__section legal-page__contact legal-page__contact-hero"
          aria-labelledby="contact-email"
        >
          <h2 id="contact-email">Email</h2>
          <p className="legal-page__contact-email">
            <a href="mailto:contact@playstumpd.com">contact@playstumpd.com</a>
          </p>
        </section>

        <div className="legal-page__intro-block">
          <p>
            For any queries, feedback, or business inquiries, reach out anytime.
          </p>
        </div>
      </article>
    </main>
    </>
  );
}
