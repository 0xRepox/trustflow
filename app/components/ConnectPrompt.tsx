"use client";

import { WalletButton } from "@/components/WalletButton";

interface Feature {
  icon: string;
  title: string;
  body: string;
}

const MERCHANT_FEATURES: Feature[] = [
  { icon: "⚡", title: "Per-second billing", body: "Revenue streams into your wallet tick-by-tick — no invoicing, no delays." },
  { icon: "🔗", title: "Shareable checkout", body: "One link per plan. Paste it anywhere. Subscribers pay and you start earning instantly." },
  { icon: "🛡️", title: "Onchain trust", body: "Smart contract holds deposits. Cancel means instant refund. No chargebacks." },
];

const SUBSCRIBER_FEATURES: Feature[] = [
  { icon: "💸", title: "Pay per second", body: "Only charged for the time you actually use. No monthly commitment lock-in." },
  { icon: "↩️", title: "Instant refunds", body: "Cancel anytime and your unused deposit returns to your wallet immediately." },
  { icon: "🔍", title: "Fully transparent", body: "Every payment is recorded onchain. No hidden fees, no opaque billing cycles." },
];

interface ConnectPromptProps {
  context?: "merchant" | "subscriber";
  headline?: string;
  subline?: string;
}

export function ConnectPrompt({
  context = "merchant",
  headline,
  subline,
}: ConnectPromptProps) {
  const features = context === "merchant" ? MERCHANT_FEATURES : SUBSCRIBER_FEATURES;
  const defaultHeadline = context === "merchant"
    ? "Sell subscriptions with per-second precision"
    : "Subscribe and pay only for what you use";
  const defaultSubline = context === "merchant"
    ? "Connect your wallet to create plans, share checkout links, and watch revenue stream in real-time."
    : "Connect your wallet to view and manage your active subscriptions.";

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "64px 0", textAlign: "center" }}>
      {/* Headline */}
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "var(--label, #C9893A)",
        margin: "0 0 14px",
      }}>
        {"{ TrustFlow · Merchant Dashboard }"}
      </p>
      <h1 style={{
        fontFamily: "var(--font-heading)",
        fontSize: 30,
        fontWeight: 700,
        color: "#fff",
        margin: "0 0 12px",
        letterSpacing: "-0.025em",
        lineHeight: 1.2,
      }}>
        {headline ?? defaultHeadline}
      </h1>
      <p style={{
        fontFamily: "var(--font-body)",
        fontSize: 14,
        color: "var(--fg-muted)",
        margin: "0 0 36px",
        lineHeight: 1.6,
        maxWidth: 460,
        marginLeft: "auto",
        marginRight: "auto",
      }}>
        {subline ?? defaultSubline}
      </p>

      {/* Connect button */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
        <WalletButton />
      </div>

      {/* Feature highlights */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        textAlign: "left",
      }}>
        {features.map((f) => (
          <div key={f.title} style={{
            background: "var(--surface, rgba(255,255,255,0.03))",
            border: "1px solid var(--border, rgba(172,198,233,0.1))",
            borderRadius: 10,
            padding: "16px 16px",
          }}>
            <span style={{ fontSize: 20, display: "block", marginBottom: 8 }}>{f.icon}</span>
            <p style={{
              fontFamily: "var(--font-heading)",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 5px",
            }}>
              {f.title}
            </p>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--fg-muted)",
              margin: 0,
              lineHeight: 1.55,
            }}>
              {f.body}
            </p>
          </div>
        ))}
      </div>

      {/* Ghost plan preview */}
      <div style={{
        marginTop: 24,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "18px 20px",
        opacity: 0.3,
        pointerEvents: "none",
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", left: 0, top: 18, bottom: 18, width: 2, background: "var(--success, #4CAF7D)", borderRadius: 2 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 500, color: "#fff", margin: "0 0 4px" }}>Pro API</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>$29.00/mo · 3 active subscribers</p>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--success)", padding: "3px 8px", border: "1px solid rgba(76,175,125,0.3)", borderRadius: 9999 }}>ACTIVE</span>
        </div>
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: 10 }}>
          {[["MRR live", "$87.00"], ["Streamed now", "$1.2847"], ["Rate", "$0.000034/s"]].map(([l, v]) => (
            <div key={l}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--label)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>{l}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#fff", margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--elevated)", borderRadius: 8, padding: "8px 12px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)" }}>→</span>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", flex: 1, margin: 0 }}>app.trustflow.io/subscribe/1</p>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--cta)" }}>Copy link</span>
        </div>
      </div>
    </div>
  );
}
