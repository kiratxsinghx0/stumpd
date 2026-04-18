import type { Metadata } from "next";
import StumpdHowToPlay from "../stumpd/stumpd-how-to-play";
import BackLink from "./back-link";

export const metadata: Metadata = {
  title: "How to Play — Stumpd",
  description:
    "Guess the IPL cricketer in six tries. Learn the rules and tile colors.",
};

export default function HowToPlayPage() {
  return (
    <main className="htp-standalone">
      <div className="htp-standalone__inner">
        <p className="htp-standalone__back">
          <BackLink />
        </p>
        <StumpdHowToPlay />
      </div>
    </main>
  );
}
