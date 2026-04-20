"use client";

import { useBlock } from "wagmi";

export function TopBar() {
  const { data: block } = useBlock({ watch: true });

  return (
    <div style={{
      height: 36, background: "#080F18",
      borderBottom: "1px solid rgba(172,198,233,0.08)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", flexShrink: 0,
    }}>
      <div style={{ display: "flex", gap: 24 }}>
        {[
          ["ARC TESTNET EXPLORER", null],
          ["USDC", "0x3600…0000"],
          ["BLOCK", block ? `+${block.number.toLocaleString()}` : "…"],
        ].map(([label, value]) => (
          <span key={label} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", letterSpacing: "0.08em" }}>
            {label}{value ? <span style={{ color: "var(--fg2)", marginLeft: 4 }}>{value}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
