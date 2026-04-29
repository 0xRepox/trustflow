import type { Metadata } from "next";
import { Syne, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
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
  title: "TrustFlow",
  description: "Per-second USDC streaming subscriptions built on Arc. Stream, trust, verify.",
  openGraph: {
    title: "TrustFlow",
    description: "Per-second USDC streaming subscriptions built on Arc.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustFlow",
    description: "Per-second USDC streaming subscriptions built on Arc.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body style={{ background: "var(--bg)", color: "var(--fg1)", fontFamily: "var(--font-sans)", margin: 0 }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
