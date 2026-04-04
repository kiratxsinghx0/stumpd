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
            <p className="legal-page__updated">
              Last updated: {LEGAL_LAST_UPDATED}
            </p>
          </header>

          <div className="legal-page__intro-block">
            <p>
              These Terms of Service (“Terms”) govern your use of{" "}
              <strong>Stumpd</strong> at <strong>playstumpd.com</strong> (the
              “Site”), operated by us (“we,” “us”). By using the Site, you agree
              to these Terms and our{" "}
              <Link href="/privacy">Privacy Policy</Link> and{" "}
              <Link href="/cookies">Cookie Policy</Link>.
            </p>
          </div>

          <section className="legal-page__section" aria-labelledby="terms-s1">
            <h2 id="terms-s1">1. The service</h2>
            <p>
              Stumpd is a free, browser-based daily word game themed around IPL
              cricket players, offered for <strong>entertainment only</strong>.
              There is no purchase required to play, no real-money wagering, and
              no prizes of monetary value from us.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="terms-s2">
            <h2 id="terms-s2">2. No affiliation</h2>
            <p>
              The Site is an independent fan project. It is{" "}
              <strong>not</strong> affiliated with, endorsed by, or sponsored by
              the Board of Control for Cricket in India (BCCI), the Indian
              Premier League (IPL), any franchise team, or any player. Team
              names, player names, and related marks may be trademarks of their
              respective owners and are used here in a descriptive or nominative
              way for the game.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="terms-s3">
            <h2 id="terms-s3">3. Accounts and data</h2>
            <p>
              We do not require you to create an account. Game data and
              preferences may be stored locally in your browser as described in
              our <Link href="/privacy">Privacy Policy</Link>. You are responsible
              for keeping your device secure.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="terms-s4">
            <h2 id="terms-s4">4. Advertising</h2>
            <p>
              The Site may display advertisements through{" "}
              <strong>Google AdSense</strong> and similar third-party programs.
              Those parties may collect information as explained in our{" "}
              <Link href="/privacy">Privacy Policy</Link> and{" "}
              <Link href="/cookies">Cookie Policy</Link>. We are not responsible
              for third-party ad content; contact the advertiser or use platform
              tools if you have concerns about a specific ad.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="terms-s5">
            <h2 id="terms-s5">5. Intellectual property</h2>
            <p>
              The Site’s design, code (except third-party libraries), original
              text, and branding created for Stumpd belong to us or our
              licensors. You may not copy, scrape, or reverse-engineer the Site
              to build a competing service, except as allowed by applicable law.
              Player and league facts used in the game are factual; rights in
              logos, broadcasts, and official content remain with their owners.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="terms-s6">
            <h2 id="terms-s6">6. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Attempt to disrupt, overload, or break the Site</li>
              <li>Use automated means to abuse the Site or its APIs</li>
              <li>Misrepresent your identity or affiliation</li>
              <li>Use the Site in violation of any law</li>
            </ul>
            <p>
              The Site does not offer user-generated public content; do not try
              to upload or inject harmful code or content through the Site.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="terms-s7">
            <h2 id="terms-s7">7. Disclaimers</h2>
            <p>
              The Site is provided <strong>“as is”</strong> and{" "}
              <strong>“as available.”</strong> We do not warrant that the Site
              will be error-free, uninterrupted, or that game content (including
              player data) is complete or up to date. Cricket rosters and
              spelling conventions may change; the puzzle is for fun.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="terms-s8">
            <h2 id="terms-s8">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, we and our operators are
              not liable for any indirect, incidental, special, consequential, or
              punitive damages, or any loss of profits or data, arising from your
              use of the Site. Our total liability for any claim relating to the
              Site is limited to the greater of (a) the amount you paid us in the
              twelve months before the claim (which is zero for a free service)
              or (b) one hundred U.S. dollars (USD $100), unless applicable law
              requires otherwise.
            </p>
          </section>

          <section className="legal-page__section" aria-labelledby="terms-s9">
            <h2 id="terms-s9">9. Changes</h2>
            <p>
              We may update these Terms from time to time. We will change the
              “Last updated” date when we do. If the changes are material, we may
              provide additional notice (for example, a banner on the Site).
              Continued use after changes means you accept the new Terms.
            </p>
          </section>

          <section
            className="legal-page__section legal-page__contact"
            aria-labelledby="terms-s10"
          >
            <h2 id="terms-s10">10. Contact</h2>
            <p>
              For questions about these Terms, email{" "}
              <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.{" "}
              {SUPPORT_RESPONSE_EXPECTATION}
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
