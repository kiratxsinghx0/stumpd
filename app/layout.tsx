import type { Viewport } from "next";
import { CookieBanner } from "./components/cookie-banner";
import "./globals.css";

export const metadata = {
  title: "Stumpd",
  description: "Guess the IPL cricketer daily",
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
      <head>
        {/* AdSense Script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5063452717128088"
          crossOrigin="anonymous"
        ></script>
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