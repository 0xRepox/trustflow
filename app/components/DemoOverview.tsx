"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DEMO_RATE = 9.0 / (30 * 86400); // $9/mo in $/s

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 20,
  position: "relative",
  overflow: "hidden",
};

const labelMono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "var(--label, #C9893A)",
  margin: 0,
};

const DEMO_STREAMS = [
  { id: "1", plan: "Pro API", rate: 9.0, deposited: 9.0 * 4, startOffset: -8 * 86400 },
  { id: "2", plan: "Enterprise", rate: 49.0, deposited: 49.0, startOffset: -3 * 86400 },
  { id: "3", plan: "Starter", rate: 3.0, deposited: 3.0 * 12, startOffset: -25 * 86400 },
];

export function DemoOverview() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const totalRate = DEMO_STREAMS.reduce((s, d) => s + d.rate / (30 * 86400), 0);
  const now = Date.now() / 1000;
  const totalStreamed = DEMO_STREAMS.reduce((s, d) => {
    const elapsed = now - (now + d.startOffset);
    return s + Math.min((d.rate / (30 * 86400)) * Math.abs(d.startOffset), d.deposited);
  }, 0);

  const liveNum = (totalStreamed + totalRate * (tick * 0.1)).toFixed(6);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Demo banner */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(56,152,236,0.07)", border: "1px solid rgba(56,152,236,0.15)",
        borderRadius: 8, padding: "10px 16px", marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#3898EC", letterSpacing: "0.1em" }}>
            DEMO MODE
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(172,198,233,0.6)" }}>
            — connect your wallet to see your real merchant dashboard
          </span>
        </div>
        <Link href="/dashboard" style={{
          fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
          color: "#3898EC", textDecoration: "none",
        }}>
          Connect wallet →
        </Link>
      </div>

      {/* Hero card */}
      <div style={{
        ...cardStyle,
        background: "linear-gradient(135deg, var(--surface) 0%, var(--elevated) 100%)",
        padding: 28, marginBottom: 16,
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(76,175,125,0.15), transparent 60%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <p style={labelMono}>Live · revenue streaming now</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 500, color: "#fff", margin: "8px 0 0" }}>
              Total streamed across all plans
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ ...labelMono, textAlign: "right" }}>per second</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#4CAF7D", margin: "4px 0 0" }}>
              ${totalRate.toFixed(6)}/s
            </p>
          </div>
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 64, fontWeight: 400, color: "#4CAF7D",
          margin: "8px 0", letterSpacing: "-0.03em", lineHeight: 1 }}>
          ${liveNum}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
          marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
          {[
            ["Per hour", `$${(totalRate * 3600).toFixed(4)}`],
            ["Per day", `$${(totalRate * 86400).toFixed(2)}`],
            ["Per month", `$${(totalRate * 86400 * 30).toFixed(2)}`],
            ["Active streams", "3"],
          ].map(([k, v], i) => (
            <div key={k} style={{ paddingLeft: i === 0 ? 0 : 18, borderLeft: i === 0 ? "none" : "1px solid var(--border)" }}>
              <p style={{ ...labelMono, marginBottom: 6 }}>{k}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 500, color: "#fff", margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", margin: "14px 0 0" }}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#4CAF7D",
            boxShadow: "0 0 6px #4CAF7D", marginRight: 8, verticalAlign: "middle" }} />
          Demo data — connect wallet to see live revenue
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total deposited", value: "$183.00", sub: "3 streams total" },
          { label: "Currently streaming", value: "3", sub: "active now", live: true },
          { label: "Disputes", value: "0", sub: "All clear" },
          { label: "Ready to claim", value: "$61.04", sub: "claim anytime", accent: true },
        ].map(({ label, value, sub, live, accent }) => (
          <div key={label} style={{ ...cardStyle, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <p style={labelMono}>{label}</p>
              {live && <span style={{ ...labelMono, color: "#4CAF7D", fontSize: 9 }}>
                <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#4CAF7D",
                  boxShadow: "0 0 6px #4CAF7D", marginRight: 6, verticalAlign: "middle" }} />LIVE
              </span>}
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 32, fontWeight: 600,
              color: accent ? "#4CAF7D" : "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {value}
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--fg-muted)", margin: "8px 0 0" }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Streams table */}
      <div style={{ ...cardStyle }}>
        <p style={{ ...labelMono, marginBottom: 14 }}>Active streams</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {DEMO_STREAMS.map(s => {
            const elapsed = Math.abs(s.startOffset);
            const consumed = Math.min((s.rate / (30 * 86400)) * elapsed, s.deposited);
            const pct = (consumed / s.deposited) * 100;
            return (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 120px 80px",
                gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#fff", margin: 0 }}>{s.plan}</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", margin: "2px 0 0" }}>
                    0x7A3f…9E2c
                  </p>
                </div>
                <div>
                  <p style={{ ...labelMono, marginBottom: 3 }}>Rate</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#4CAF7D", margin: 0 }}>
                    ${s.rate}/mo
                  </p>
                </div>
                <div>
                  <p style={{ ...labelMono, marginBottom: 3 }}>Consumed</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff", margin: 0 }}>
                    ${consumed.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ ...labelMono, marginBottom: 5 }}>Runway</p>
                  <div style={{ height: 4, borderRadius: 2, background: "var(--elevated)" }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2,
                      background: "linear-gradient(90deg, #4CAF7D, #3898EC)" }} />
                  </div>
                </div>
                <div style={{ opacity: 0.4, textAlign: "right" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)" }}>
                    demo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
