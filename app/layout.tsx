import type { Metadata, Viewport } from "next";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("stumpd_auth_token");var g=localStorage.getItem("stumpdpuzzle_hmChampionTs");if(t&&g&&Date.now()-Number(g)<864e5){document.documentElement.classList.add("godmode-early");document.documentElement.style.backgroundColor="#1a1a2e";document.documentElement.style.colorScheme="dark"}}catch(e){}})();`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `html.godmode-early,html.godmode-early body{background-color:#1a1a2e!important;color:#e2e8f0!important}`,
          }}
        />
      </head>
      <body
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {children}

        <CookieBanner />
      </body>
    </html>
  );
}