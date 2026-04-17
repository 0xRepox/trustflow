import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { WalletButton } from "@/components/WalletButton";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrustFlow Merchant Dashboard",
  description: "Manage subscriptions, revenue, and disputes on Arc Network",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <Providers>
          <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="font-semibold text-lg">TrustFlow</span>
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Overview</Link>
              <Link href="/plans" className="text-sm text-gray-400 hover:text-white transition-colors">Plans</Link>
              <Link href="/streams" className="text-sm text-gray-400 hover:text-white transition-colors">Streams</Link>
              <Link href="/disputes" className="text-sm text-gray-400 hover:text-white transition-colors">Disputes</Link>
            </div>
            <WalletButton />
          </nav>
          <main className="px-6 py-8 max-w-6xl mx-auto">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
