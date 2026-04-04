import type { Metadata } from "next";
import Link from "next/link";
import {
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  SUPPORT_RESPONSE_EXPECTATION,
} from "../../lib/contact";
import { LEGAL_LAST_UPDATED } from "../../lib/legal-meta";
import PageHeader from "../components/page-header";
import BackToGameLink from "../components/back-to-game-link";

export const metadata: Metadata = {
  title: "Privacy Policy — Stumpd",
  description:
    "How Stumpd (playstumpd.com) handles privacy, cookies, local storage, and Google AdSense.",
};

const googlePrivacy = "https://policies.google.com/privacy";
const googlePartner = "https://policies.google.com/technologies/partner-sites";
const googleAdsTech = "https://policies.google.com/technologies/ads";
const googleAdSettings = "https://adssettings.google.com/";

export default function PrivacyPage() {
  return (
    <>
      <PageHeader showHowToPlay={false} />
      <main className="legal-page">
        <article className="legal-page__inner">
          <BackToGameLink />

          <header className="legal-page__header">
            <h1 className="legal-page__title">Privacy Policy</h1>
            <p className="legal-page__updated">
              Last updated: {LEGAL_LAST_UPDATED}
            </p>
          </header>

          <div className="legal-page__intro-block">
            <p>
              <strong>Stumpd</strong> (“we,” “us”) operates the website{" "}
              <strong>playstumpd.com</strong> (the “Site”), a free daily word
              game for cricket fans. This policy explains what information is
              involved when you use the Site, including advertising through{" "}
              <strong>Google AdSense</strong>.
            </p>
            <p>
              By using the Site, you agree to this Privacy Policy together with
              our <Link href="/terms">Terms of Service</Link> and{" "}
              <Link href="/cookies">Cookie Policy</Link>.
            </p>
          </div>

          <section className="legal-page__section" aria-labelledby="privacy-s1">
            <h2 id="privacy-s1">1. Information we store on your device</h2>
            <p>
              We do <strong>not</strong> require an account. To run the game and
              remember your choices, the Site uses{" "}
              <strong>browser local storage</strong> and{" "}
              <strong>session storage</strong> on your device. This may include:
            </p>
            <ul>
              <li>Cookie / privacy preference (accept or reject)</li>
              <li>
                Game progress: daily puzzle id, guesses, stats, timers, hints,
                and related game state
              </li>
              <li>Whether you have seen onboarding or help content</li>
              <li>
                A session value so we can return you to the game after visiting
                legal pages
              </li>
            </ul>
            <p>
              This data stays on your device unless you clear site data in your
              browser. We do not receive a copy of your local storage on our
              servers as part of normal play.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="privacy-s2">
            <h2 id="privacy-s2">2. Information our host and network may process</h2>
            <p>
              Like any website, when you load pages the Site is delivered
              through hosting infrastructure (for example, Vercel). Standard
              server and network logs may include your IP address, browser type,
              request time, and URLs requested. We use this only to operate and
              secure the service, not to build a personal profile on our side.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="privacy-s3">
            <h2 id="privacy-s3">3. Advertising (Google AdSense)</h2>
            <p>
              We use <strong>Google AdSense</strong> to show ads. Google may use
              cookies, mobile advertising IDs, or similar technologies to serve
              and measure ads, including personalized ads where allowed. Google’s
              use of data is described here:
            </p>
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
                  Google&apos;s use of cookies in advertising
                </a>
              </li>
            </ul>
            <p>
              You can manage some ad personalization in{" "}
              <a href={googleAdSettings} rel="noopener noreferrer">
                Google Ads Settings
              </a>
              . You can also use industry opt-out tools where available in your
              region.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="privacy-s4">
            <h2 id="privacy-s4">4. Cookies and similar technologies</h2>
            <p>
              We and our partners use cookies and similar technologies as
              described in our <Link href="/cookies">Cookie Policy</Link>. The
              banner on the Site lets you accept or reject non-essential cookies
              where our implementation supports that choice; some regions may
              have additional requirements for personalized ads.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="privacy-s5">
            <h2 id="privacy-s5">5. Children</h2>
            <p>
              The Site is not directed at children under 13 (or the minimum age
              required in your country). We do not knowingly collect personal
              information from children. If you believe we have done so, contact
              us and we will take appropriate steps.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="privacy-s6">
            <h2 id="privacy-s6">6. International users</h2>
            <p>
              Visitors may access the Site from many countries. Where laws such
              as the GDPR or UK GDPR apply, you may have rights to access,
              correct, delete, or restrict certain processing, and to object or
              lodge a complaint with a supervisory authority. Because we do not
              operate logged-in accounts, much of what we “hold” is processed by
              third parties such as Google; you may exercise choices through
              them as linked above.
            </p>
            <p>
              <strong>California (CCPA/CPRA):</strong> We do not sell your
              personal information for money. Advertising partners may use
              cookies and similar technologies to deliver and measure ads, which
              can be considered a “sale” or “sharing” under California law in
              some cases. You can use Google’s tools and browser controls to limit
              such uses.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="privacy-s7">
            <h2 id="privacy-s7">7. Retention</h2>
            <p>
              Local game data remains until you clear it. Server logs are kept
              only as long as needed for security and operations. Google retains
              data according to its policies.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="privacy-s8">
            <h2 id="privacy-s8">8. Your choices</h2>
            <ul>
              <li>Clear site data in your browser to reset local game storage</li>
              <li>Adjust cookies and tracking in browser settings</li>
              <li>Use Google Ads Settings and similar tools for ad personalization</li>
              <li>Contact us using the email below</li>
            </ul>
          </section>

          <section className="legal-page__section" aria-labelledby="privacy-s9">
            <h2 id="privacy-s9">9. Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. The “Last
              updated” date at the top will change when we do. Continued use of
              the Site after changes means you accept the revised policy.
            </p>
          </section>

          <section
            className="legal-page__section legal-page__contact"
            aria-labelledby="privacy-s10"
          >
            <h2 id="privacy-s10">10. Contact</h2>
            <p>
              Questions about this policy? Email{" "}
              <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.{" "}
              {SUPPORT_RESPONSE_EXPECTATION}
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
