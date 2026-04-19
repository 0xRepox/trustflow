"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getDisputesByMerchant, getStreamsByPlanIds, getPlansByOwner } from "@/lib/envio";
import { WalletButton } from "@/components/WalletButton";

const NAV = [
  {
    href: "/dashboard", label: "Overview",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    href: "/plans", label: "Plans",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 10h10M4 14h12M4 18h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/streams", label: "Streams",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M3 12 C7 12 7 6 12 6 C17 6 17 18 21 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/disputes", label: "Disputes",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    href: "/docs", label: "Docs",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { address } = useAccount();

  const { data: plans } = useQuery({
    queryKey: ["plans", address],
    queryFn: () => getPlansByOwner(address!),
    enabled: !!address,
  });
  const { data: streams } = useQuery({
    queryKey: ["streams", plans?.map((p) => p.id)],
    queryFn: () => getStreamsByPlanIds(plans!.map((p) => p.id)),
    enabled: !!plans?.length,
  });
  const { data: disputes } = useQuery({
    queryKey: ["disputes", streams?.map((s) => s.id)],
    queryFn: () => getDisputesByMerchant(streams!.map((s) => s.id)),
    enabled: !!streams?.length,
  });

  const openDisputes = disputes?.filter((d) => d.status === "Open").length ?? 0;
  const { address: addr, isConnected } = useAccount();

  return (
    <aside style={{
      width: 188, background: "#080F18",
      borderRight: "1px solid rgba(172,198,233,0.08)",
      display: "flex", flexDirection: "column",
      flexShrink: 0, height: "100%",
    }}>
      {/* Logo */}
      <div style={{ padding: "16px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <circle cx="5" cy="24" r="3.5" fill="#ACC6E9"/>
            <path d="M8.5 24 C13 24 13 15 19.5 15 C26 15 26 33 32.5 33 C37 33 38.5 27 39.5 24"
                  stroke="#ACC6E9" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M37 19.5 L43 24 L37 28.5" stroke="#3898EC" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="43" cy="24" r="1.5" fill="#3898EC"/>
          </svg>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, color: "#fff" }}>TrustFlow</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--label)", letterSpacing: "0.1em" }}>{"{MERCHANT}"}</span>
      </div>

      {/* Chain badge */}
      <div style={{ padding: "0 12px 14px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(56,152,236,0.1)", border: "1px solid rgba(56,152,236,0.2)",
          borderRadius: 6, padding: "4px 8px",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4CAF7D", display: "inline-block" }}/>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--fg2)", letterSpacing: "0.06em" }}>ARC TESTNET</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--fg-subtle)" }}>5042002</span>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(172,198,233,0.06)", margin: "0 12px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          const badge = label === "Disputes" && openDisputes > 0 ? openDisputes : null;
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 10px", borderRadius: 7, marginBottom: 2,
              textDecoration: "none",
              background: active ? "rgba(56,152,236,0.12)" : "transparent",
              color: active ? "#fff" : "var(--fg-muted)",
              transition: "background 0.12s, color 0.12s",
            }}
            onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(172,198,233,0.06)"; e.currentTarget.style.color = "var(--fg2)"; } }}
            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-muted)"; } }}
            >
              <span style={{ color: active ? "#3898EC" : "currentColor", flexShrink: 0 }}>{icon}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: active ? 500 : 400, flex: 1 }}>{label}</span>
              {badge && (
                <span style={{
                  background: "var(--error)", color: "#fff", borderRadius: 9999,
                  fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600,
                  padding: "1px 5px", minWidth: 16, textAlign: "center",
                }}>{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Wallet */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(172,198,233,0.06)" }}>
        {isConnected && addr ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #3898EC, #ACC6E9)",
              flexShrink: 0,
            }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#fff", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {addr.slice(0, 6)}…{addr.slice(-4)}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--success)", margin: 0 }}>Connected</p>
            </div>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", flexShrink: 0 }}/>
          </div>
        ) : (
          <WalletButton />
        )}
      </div>
    </aside>
  );
}
