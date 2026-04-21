"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getDisputesByMerchant, getStreamsByPlanIds, getPlansByOwner } from "@/lib/envio";
const NAV = [
  {
    href: "/dashboard", label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 10h10M4 14h12M4 18h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/streams", label: "Streams",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M3 12 C7 12 7 6 12 6 C17 6 17 18 21 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/disputes", label: "Disputes",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    href: "/docs", label: "Docs",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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

  return (
    <aside style={{
      width: 200,
      background: "#07101A",
      borderRight: "1px solid rgba(172,198,233,0.07)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      height: "100%",
    }}>

      {/* Logo */}
      <div style={{ padding: "20px 16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "rgba(56,152,236,0.12)",
            border: "1px solid rgba(56,152,236,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
              <circle cx="5" cy="24" r="3.5" fill="#ACC6E9"/>
              <path d="M8.5 24 C13 24 13 15 19.5 15 C26 15 26 33 32.5 33 C37 33 38.5 27 39.5 24"
                    stroke="#ACC6E9" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M37 19.5 L43 24 L37 28.5" stroke="#3898EC" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="43" cy="24" r="1.5" fill="#3898EC"/>
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "#fff", margin: 0, lineHeight: 1.2 }}>TrustFlow</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--label)", letterSpacing: "0.08em", margin: 0 }}>{"{MERCHANT}"}</p>
          </div>
        </div>
      </div>

      {/* Chain badge */}
      <div style={{ padding: "0 12px 14px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(76,175,125,0.08)", border: "1px solid rgba(76,175,125,0.18)",
          borderRadius: 20, padding: "4px 10px",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4CAF7D", display: "inline-block", boxShadow: "0 0 6px #4CAF7D" }}/>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#4CAF7D", letterSpacing: "0.06em" }}>ARC TESTNET</span>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(172,198,233,0.06)", margin: "0 12px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(172,198,233,0.3)",
          letterSpacing: "0.12em", textTransform: "uppercase",
          margin: "0 0 8px 10px",
        }}>MENU</p>

        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          const badge = label === "Disputes" && openDisputes > 0 ? openDisputes : null;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8, marginBottom: 1,
                textDecoration: "none", position: "relative",
                background: active ? "rgba(56,152,236,0.1)" : "transparent",
                color: active ? "#fff" : "rgba(172,198,233,0.5)",
                borderLeft: active ? "2px solid #3898EC" : "2px solid transparent",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(172,198,233,0.05)";
                  e.currentTarget.style.color = "rgba(172,198,233,0.85)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(172,198,233,0.5)";
                }
              }}
            >
              <span style={{ color: active ? "#3898EC" : "currentColor", flexShrink: 0, display: "flex" }}>
                {icon}
              </span>
              <span style={{
                fontFamily: "var(--font-body)", fontSize: 13,
                fontWeight: active ? 600 : 400, flex: 1,
              }}>
                {label}
              </span>
              {badge && (
                <span style={{
                  background: "#C9893A", color: "#fff", borderRadius: 9999,
                  fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
                  padding: "2px 6px", minWidth: 16, textAlign: "center",
                }}>{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
