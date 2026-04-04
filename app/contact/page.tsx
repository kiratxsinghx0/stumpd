import type { Metadata } from "next";
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

          <div className="legal-page__intro-block">
            <p>
              For any queries, feedback, or business inquiries, reach out anytime.
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
        </article>
      </main>
    </>
  );
}
