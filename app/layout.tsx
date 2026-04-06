import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SITE_URL } from "../lib/site";
import { CookieBanner } from "./components/cookie-banner";
import "./globals.css";

const siteUrl = new URL(SITE_URL);

/*
 * OG preview image: public/og-image.png (1200×630). Regenerate after SVG edits:
 *   npm run generate-og-image
 *
 * Google Search Console (HTML tag method): set GOOGLE_SITE_VERIFICATION in
 * the deploy environment to the content value from Search Console.
 */
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Stumpd – Daily IPL Cricket Wordle",
  description:
    "Guess the secret IPL cricketer in 6 tries. A daily Wordle-style game for cricket fans. New puzzle every day!",
  keywords:
    "IPL wordle, cricket wordle, IPL player game, guess the cricketer, daily cricket puzzle, stumpd",
  alternates: {
    canonical: SITE_URL,
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
  openGraph: {
    title: "Stumpd – Daily IPL Cricket Wordle",
    description:
      "Guess the secret IPL cricketer in 6 tries. New puzzle every day!",
    url: SITE_URL,
    siteName: "Stumpd",
    type: "website",
    images: [
      {
        url: new URL("/og-image.png", siteUrl).toString(),
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stumpd – Daily IPL Cricket Wordle",
    description: "Guess the secret IPL cricketer in 6 tries!",
    images: [new URL("/og-image.png", siteUrl).toString()],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/stumpd-logo.png",
    apple: "/stumpd-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {children}

        <CookieBanner />

        <Script
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5063452717128088"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}