import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multiplayer — Stumpd",
  description: "Challenge your friends in a real-time Stumpd match.",
};

export default function MultiplayerPage() {
  return (
    <main className="placeholder-page">
      <div className="placeholder-page__inner">
        <h1 className="placeholder-page__title">Multiplayer</h1>
        <p className="placeholder-page__text">
          Multiplayer mode is coming soon. Challenge your friends in real time!
        </p>
        <Link href="/" className="placeholder-page__back">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
