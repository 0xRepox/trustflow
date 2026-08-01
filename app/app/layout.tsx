import type { Metadata } from "next";
import { Syne, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

// Inter is the most overused body font on the web — IBM Plex Sans keeps the
// same clean small-size legibility but reads as a deliberate, technical
// choice rather than the default, matching the brand's precise/technical tone.
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // Without this, relative image URLs below resolve against localhost:3000 and
  // every shared link renders a broken preview.
  metadataBase: new URL("https://trustflowonarc.vercel.app"),
  title: "TrustFlow",
  description: "Per-second USDC streaming subscriptions built on Arc. Stream, trust, verify.",
  openGraph: {
    title: "TrustFlow",
    description: "Per-second USDC streaming subscriptions built on Arc.",
    // PNG, not SVG — Twitter/LinkedIn/Discord/Slack/iMessage all refuse to
    // render SVG social cards.
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustFlow",
    description: "Per-second USDC streaming subscriptions built on Arc.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable}`}>
      <body style={{ background: "var(--bg)", color: "var(--fg1)", fontFamily: "var(--font-sans)", margin: 0 }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
