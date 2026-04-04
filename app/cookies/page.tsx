import Link from "next/link";
import type { Metadata } from "next";
import {
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  SUPPORT_RESPONSE_EXPECTATION,
} from "../../lib/contact";
import { LEGAL_LAST_UPDATED } from "../../lib/legal-meta";
import PageHeader from "../components/page-header";
import BackToGameLink from "../components/back-to-game-link";

export const metadata: Metadata = {
  title: "Cookie Policy — Stumpd",
  description:
    "How Stumpd (playstumpd.com) uses cookies, local storage, and Google AdSense.",
};

const googlePrivacy = "https://policies.google.com/privacy";
const googlePartner = "https://policies.google.com/technologies/partner-sites";
const googleAdsTech = "https://policies.google.com/technologies/ads";
const googleAdSettings = "https://adssettings.google.com/";

export default function CookiePolicyPage() {
  return (
    <>
      <PageHeader showHowToPlay={false} />
      <main className="legal-page">
        <article className="legal-page__inner">
          <BackToGameLink />

          <header className="legal-page__header">
            <h1 className="legal-page__title">Cookie Policy</h1>
            <p className="legal-page__updated">
              Last updated: {LEGAL_LAST_UPDATED}
            </p>
          </header>

          <div className="legal-page__intro-block">
            <p>
              <strong>Stumpd</strong> (playstumpd.com) uses{" "}
              <strong>cookies</strong>, <strong>local storage</strong>, and{" "}
              <strong>session storage</strong> so the Site works, remembers your
              choices, and (when you accept) supports advertising through{" "}
              <strong>Google AdSense</strong>. This page explains how.
            </p>
            <p>
              For a fuller picture of how we handle information, see our{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </div>

          <section
            className="legal-page__purposes"
            aria-labelledby="cookie-types-heading"
          >
            <h2 id="cookie-types-heading">1. Types of technologies</h2>
            <h3>Strictly necessary</h3>
            <p>
              We store your <strong>cookie / privacy choice</strong> (accept or
              reject) in the browser so we do not keep asking on every visit.
              Game features also rely on <strong>local storage</strong> and{" "}
              <strong>session storage</strong> to save progress and preferences on
              your device. These are needed for the Site to function as intended.
            </p>
            <h3>Advertising (third party)</h3>
            <p>
              If you accept cookies on our banner, <strong>Google AdSense</strong>{" "}
              may set or read cookies (or use similar technologies) to deliver
              and measure ads, including personalized ads where permitted. Google
              acts as an independent controller for much of that processing.
            </p>
          </section>

          <section
            className="legal-page__section"
            aria-labelledby="cookie-google-heading"
          >
            <h2 id="cookie-google-heading">2. Google and advertising</h2>
            <p>Learn more from Google directly:</p>
            <ul>
              <li>
                <a href={googlePrivacy} rel="noopener noreferrer">
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <a href={googlePartner} rel="noopener noreferrer">
                  How Google uses information from sites that use its services
                </a>
              </li>
              <li>
                <a href={googleAdsTech} rel="noopener noreferrer">
                  Cookies and other technologies used for advertising
                </a>
              </li>
            </ul>
            <p>
              Manage some ad personalization:{" "}
              <a href={googleAdSettings} rel="noopener noreferrer">
                Google Ads Settings
              </a>
              .
            </p>
          </section>

          <section
            className="legal-page__cookie-note"
            aria-labelledby="cookie-choices-heading"
          >
            <h2 id="cookie-choices-heading">3. Your choices</h2>
            <ul>
              <li>
                Use our <strong>cookie banner</strong> to accept or reject
                non-essential cookies as offered.
              </li>
              <li>
                Change or clear cookies and site data in your browser settings.
              </li>
              <li>
                Use Google’s tools (linked above) and, where available in your
                country, industry opt-out pages.
              </li>
            </ul>
            <p>
              If you reject advertising cookies, you may still see ads, but they
              may be less relevant.
            </p>
          </section>

          <section
            className="legal-page__section legal-page__contact"
            aria-labelledby="cookie-more"
          >
            <h2 id="cookie-more">4. Contact</h2>
            <p>
              Questions about cookies or this policy? See our{" "}
              <Link href="/privacy">Privacy Policy</Link> or email{" "}
              <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.{" "}
              {SUPPORT_RESPONSE_EXPECTATION}
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
