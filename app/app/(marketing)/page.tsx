"use client";

import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const FEATURES = [
  {
    tag: "BILLING",
    title: "Per-second pricing",
    body: "Subscribers pay only for time consumed. No monthly lumps, no overpayment. Revenue streams into your wallet every second.",
  },
  {
    tag: "TRUST",
    title: "No chargebacks",
    body: "Funds are locked onchain before a stream starts. Merchants receive USDC directly — no payment processor, no reversal risk.",
  },
  {
    tag: "DISPUTES",
    title: "Onchain evidence",
    body: "Disputes are resolved via committed evidence hashes and a 7-day respond window. No intermediaries.",
  },
  {
    tag: "INTEGRATION",
    title: "One API call",
    body: "Gate any endpoint with a single GET request. Active stream → access granted. No SDK, no webhook setup.",
  },
];

const STEPS = [
  { n: "01", label: "Create a plan", sub: "Set a billing rate (hourly, daily, monthly) and a grace period." },
  { n: "02", label: "Share the link", sub: "Copy your subscribe link and send it to customers." },
  { n: "03", label: "Subscriber pays", sub: "They approve USDC and open a stream in two transactions." },
  { n: "04", label: "Claim revenue", sub: "Claim accumulated USDC anytime from your dashboard." },
];

export default function LandingPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.replace("/dashboard");
  }, [isConnected, router]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", overflowX: "hidden" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,17,28,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(172,198,233,0.08)",
        padding: "0 32px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <circle cx="5" cy="24" r="3.5" fill="#ACC6E9"/>
            <path d="M8.5 24 C13 24 13 15 19.5 15 C26 15 26 33 32.5 33 C37 33 38.5 27 39.5 24" stroke="#ACC6E9" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M37 19.5 L43 24 L37 28.5" stroke="#3898EC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="43" cy="24" r="1.5" fill="#3898EC"/>
          </svg>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, color: "#fff", letterSpacing: "-0.01em" }}>TrustFlow</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/docs" style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", textDecoration: "none" }}>Docs</Link>
          <Link href="/dashboard" style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", textDecoration: "none" }}>Dashboard</Link>
          <WalletButton />
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", padding: "100px 32px 80px", textAlign: "center", overflow: "hidden" }}>
        {/* Arc curve decoration */}
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.07 }} viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice">
          <path d="M-100 250 C200 250 200 80 500 80 C800 80 800 420 1100 420 C1250 420 1300 300 1350 250" stroke="#3898EC" strokeWidth="2" fill="none"/>
          <path d="M-100 300 C200 300 200 130 500 130 C800 130 800 470 1100 470 C1250 470 1300 350 1350 300" stroke="#ACC6E9" strokeWidth="1.5" fill="none" strokeDasharray="8 4"/>
        </svg>

        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--label)", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 20px" }}>{"{BUILT ON ARC NETWORK}"}</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 800, margin: "0 auto 18px" }}>
          Subscriptions that stream{" "}
          <span style={{ color: "#3898EC" }}>per second</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--fg-muted)", margin: "0 auto 36px", maxWidth: 520, lineHeight: 1.6 }}>
          Replace monthly billing with real-time USDC streams on Arc Network. Subscribers pay only for time used. Merchants receive revenue every second.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard" style={{
            background: "var(--cta)", border: "none", borderRadius: 10,
            padding: "12px 28px", fontFamily: "var(--font-heading)",
            fontSize: 14, fontWeight: 500, color: "#fff", textDecoration: "none",
            transition: "background 0.15s",
          }}>
            Launch app →
          </Link>
          <Link href="/docs" style={{
            background: "transparent", border: "1px solid rgba(172,198,233,0.2)", borderRadius: 10,
            padding: "12px 28px", fontFamily: "var(--font-heading)",
            fontSize: 14, fontWeight: 500, color: "var(--fg2)", textDecoration: "none",
          }}>
            Read the docs
          </Link>
        </div>

        {/* Live stat strip */}
        <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 56, flexWrap: "wrap" }}>
          {[
            ["Arc Testnet", "Chain 5042002"],
            ["USDC", "Native token"],
            ["Per-second", "Billing precision"],
            ["Onchain", "Dispute resolution"],
          ].map(([label, sub]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>{label}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-subtle)", margin: "2px 0 0" }}>{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "64px 32px", maxWidth: 960, margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--label)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 32px", textAlign: "center" }}>{"{PROTOCOL FEATURES}"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {FEATURES.map(({ tag, title, body }) => (
            <div key={tag} style={{
              background: "#0C1A2C", border: "1px solid rgba(172,198,233,0.09)",
              borderRadius: 14, padding: "22px 20px",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(56,152,236,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(172,198,233,0.09)")}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--label)", letterSpacing: "0.1em", margin: "0 0 10px" }}>{`{${tag}}`}</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 8px" }}>{title}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", margin: 0, lineHeight: 1.6 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "64px 32px", maxWidth: 960, margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--label)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 32px", textAlign: "center" }}>{"{HOW IT WORKS}"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1 }}>
          {STEPS.map(({ n, label, sub }, i) => (
            <div key={n} style={{ position: "relative", padding: "24px 20px", background: i % 2 === 0 ? "#0C1A2C" : "transparent", borderRadius: 12 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 400, color: "rgba(56,152,236,0.3)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>{n}</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>{label}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: 0, lineHeight: 1.6 }}>{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integration snippet */}
      <section style={{ padding: "64px 32px", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--label)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>{"{INTEGRATION}"}</p>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>One request to gate anything</h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)", margin: "0 auto 28px", maxWidth: 480, lineHeight: 1.6 }}>
          Drop this into any backend. Returns <code style={{ fontFamily: "var(--font-mono)", color: "#3898EC", fontSize: 12 }}>active: true</code> when the subscriber has a live stream.
        </p>
        <div style={{ background: "#060E18", border: "1px solid rgba(56,152,236,0.2)", borderRadius: 12, padding: "20px 24px", textAlign: "left" }}>
          <pre style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#ACC6E9", margin: 0, lineHeight: 1.8, overflowX: "auto" }}>{`GET /api/check-subscription
  ?planId=1
  &address=0xSubscriber…

→ { "active": true, "stream": { ... } }`}</pre>
        </div>
        <Link href="/docs" style={{ display: "inline-block", marginTop: 20, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cta)", textDecoration: "none" }}>
          Full integration guide →
        </Link>
      </section>

      {/* CTA footer */}
      <section style={{ padding: "80px 32px", textAlign: "center", borderTop: "1px solid rgba(172,198,233,0.06)" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 700, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Ready to stream revenue?</h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)", margin: "0 0 28px" }}>Connect your wallet and create your first plan in under a minute.</p>
        <WalletButton />
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(172,198,233,0.06)", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", letterSpacing: "0.08em" }}>TRUSTFLOW · ARC TESTNET</span>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Dashboard", "/dashboard"], ["Docs", "/docs"]].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-subtle)", textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
