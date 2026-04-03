"use client";

import Link from "next/link";

export default function BackToGameLink() {
  return (
    <p className="legal-page__back">
      <Link href="/">← Back to Stumpd</Link>
    </p>
  );
}
