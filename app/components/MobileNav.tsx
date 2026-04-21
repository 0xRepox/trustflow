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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 10h10M4 14h12M4 18h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/streams", label: "Streams",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 12 C7 12 7 6 12 6 C17 6 17 18 21 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/disputes", label: "Disputes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    href: "/docs", label: "Docs",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export function MobileNav() {
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
    <nav className="mobile-nav" style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#07101A",
      borderTop: "1px solid rgba(172,198,233,0.09)",
      display: "flex",
      alignItems: "stretch",
      zIndex: 100,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {NAV.map(({ href, label, icon }) => {
        const active = pathname === href;
        const badge = label === "Disputes" && openDisputes > 0 ? openDisputes : null;
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "10px 4px",
              textDecoration: "none",
              color: active ? "#3898EC" : "rgba(172,198,233,0.4)",
              borderTop: active ? "2px solid #3898EC" : "2px solid transparent",
              position: "relative",
            }}
          >
            {icon}
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.06em",
              fontWeight: active ? 600 : 400,
              color: active ? "#3898EC" : "rgba(172,198,233,0.4)",
            }}>
              {label.toUpperCase()}
            </span>
            {badge ? (
              <span style={{
                position: "absolute", top: 6, right: "calc(50% - 14px)",
                background: "#C9893A", color: "#fff", borderRadius: 9999,
                fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700,
                padding: "1px 4px", minWidth: 14, textAlign: "center",
              }}>{badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
