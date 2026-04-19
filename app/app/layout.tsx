import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrustFlow",
  description: "Per-second USDC streaming subscriptions on Arc Network. Stream, trust, verify.",
  openGraph: {
    title: "TrustFlow",
    description: "Per-second USDC streaming subscriptions on Arc Network.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustFlow",
    description: "Per-second USDC streaming subscriptions on Arc Network.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable} ${spaceMono.variable}`}>
      <body style={{ background: "var(--bg)", color: "var(--fg1)", fontFamily: "var(--font-body)", margin: 0 }}>
        <Providers>
          <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
            <TopBar />
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              <Sidebar />
              <main style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
