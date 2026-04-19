"use client";

import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/plans", label: "Plans" },
  { href: "/streams", label: "Streams" },
  { href: "/disputes", label: "Disputes" },
  { href: "/docs", label: "Docs" },
];

export function Nav() {
  return (
    <nav style={{
      borderBottom: "1px solid var(--border)",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 56,
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
            <circle cx="5" cy="24" r="3.5" fill="#ACC6E9"/>
            <path d="M8.5 24 C13 24 13 15 19.5 15 C26 15 26 33 32.5 33 C37 33 38.5 27 39.5 24"
                  stroke="#ACC6E9" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M37 19.5 L43 24 L37 28.5" stroke="#3898EC" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="43" cy="24" r="1.5" fill="#3898EC"/>
          </svg>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, color: "#fff", letterSpacing: "-0.01em" }}>
            TrustFlow
          </span>
        </Link>
        <div style={{ display: "flex", gap: 4 }}>
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              fontFamily: "var(--font-heading)",
              fontSize: 13,
              fontWeight: 400,
              color: "var(--fg-muted)",
              padding: "6px 12px",
              borderRadius: 6,
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <WalletButton />
    </nav>
  );
}
