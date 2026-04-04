"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

const AD_CLIENT = "ca-pub-5063452717128088";

export function AdUnit({ slotId }: { slotId: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, [slotId]);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={AD_CLIENT}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
