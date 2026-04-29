"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useBlock } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { WalletButton } from "@/components/WalletButton";
import { getDisputesByMerchant, getStreamsByPlanIds, getPlansByOwner } from "@/lib/envio";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/plans",     label: "Plans" },
  { href: "/streams",   label: "Streams" },
  { href: "/disputes",  label: "Disputes" },
  { href: "/docs",      label: "Docs" },
];

export function Header() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { data: block } = useBlock({ watch: true });

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
    <header style={{
      height: 56,
      background: "#07101A",
      borderBottom: "1px solid rgba(172,198,233,0.08)",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 0,
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <Link href="/" style={{
        display: "flex", alignItems: "center", gap: 9,
        textDecoration: "none", flexShrink: 0, marginRight: 32,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: "rgba(56,152,236,0.12)",
          border: "1px solid rgba(56,152,236,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
            <circle cx="5" cy="24" r="3.5" fill="#ACC6E9"/>
            <path d="M8.5 24 C13 24 13 15 19.5 15 C26 15 26 33 32.5 33 C37 33 38.5 27 39.5 24"
                  stroke="#ACC6E9" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M37 19.5 L43 24 L37 28.5" stroke="#3898EC" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="43" cy="24" r="1.5" fill="#3898EC"/>
          </svg>
        </div>
        <span style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15,
          color: "#fff", letterSpacing: "-0.01em",
        }}>TrustFlow</span>
      </Link>

      {/* Nav links */}
      <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        {NAV.map(({ href, label }) => {
          const active = pathname === href;
          const badge = label === "Disputes" && openDisputes > 0 ? openDisputes : null;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 6,
                textDecoration: "none", position: "relative",
                fontFamily: "var(--font-sans)", fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "#fff" : "rgba(172,198,233,0.5)",
                background: active ? "rgba(56,152,236,0.1)" : "transparent",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(172,198,233,0.06)";
                  e.currentTarget.style.color = "rgba(172,198,233,0.85)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(172,198,233,0.5)";
                }
              }}
            >
              {label}
              {badge ? (
                <span style={{
                  background: "#C9893A", color: "#fff", borderRadius: 9999,
                  fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
                  padding: "1px 5px", lineHeight: 1.4,
                }}>{badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Right: chain info + wallet */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4CAF7D", boxShadow: "0 0 6px #4CAF7D", display: "inline-block" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#4CAF7D", letterSpacing: "0.06em" }}>Arc Testnet</span>
        </div>
        {block && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(172,198,233,0.3)", letterSpacing: "0.06em" }}>
            #{block.number.toLocaleString()}
          </span>
        )}
        <WalletButton />
      </div>
    </header>
  );
}
