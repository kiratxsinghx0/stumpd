"use client";

import { useRouter } from "next/navigation";

export default function BackLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="htp-standalone__back-btn"
      onClick={() => router.back()}
    >
      ← Back
    </button>
  );
}
