"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner, getStreamsByPlanIds, getDisputesByMerchant } from "@/lib/envio";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "20px 22px",
  boxShadow: "var(--shadow-card)",
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={card}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 600, color: "var(--fg1)", margin: "6px 0 0", letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-subtle)", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

function NavCard({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link href={href} style={{
      ...card,
      display: "block",
      textDecoration: "none",
      transition: "border-color 0.15s, box-shadow 0.15s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "rgba(56,152,236,0.4)";
      e.currentTarget.style.boxShadow = "0 0 20px rgba(56,152,236,0.08)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.boxShadow = "var(--shadow-card)";
    }}
    >
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 500, color: "var(--fg1)", margin: 0 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "4px 0 0" }}>{sub}</p>
    </Link>
  );
}

export default function OverviewPage() {
  const { address, isConnected } = useAccount();

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

  if (!isConnected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 20, textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--label)", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>{"{MERCHANT DASHBOARD}"}</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 700, color: "var(--fg1)", margin: 0, letterSpacing: "-0.02em" }}>TrustFlow</h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)", margin: 0 }}>Connect your wallet to view your subscription revenue.</p>
        <WalletButton />
      </div>
    );
  }

  const activeStreams = streams?.filter((s) => s.status === "Active") ?? [];
  const openDisputes = disputes?.filter((d) => d.status === "Open") ?? [];
  const totalEarned = streams?.reduce((acc, s) => acc + BigInt(s.claimed), 0n) ?? 0n;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--label)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>{"{MERCHANT DASHBOARD}"}</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 700, color: "var(--fg1)", margin: 0, letterSpacing: "-0.02em" }}>Overview</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Earned (USDC)" value={`$${(Number(totalEarned) / 1e6).toFixed(2)}`} sub="Lifetime claimed" />
        <StatCard label="Active Streams" value={activeStreams.length} sub="Currently streaming" />
        <StatCard label="Open Disputes" value={openDisputes.length} sub={openDisputes.length > 0 ? "Requires attention" : "All clear"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <NavCard href="/plans" label="Manage Plans" sub={`${plans?.length ?? 0} plans created`} />
        <NavCard href="/streams" label="View Streams" sub={`${streams?.length ?? 0} total streams`} />
        <NavCard href="/disputes" label="Dispute Inbox" sub={`${openDisputes.length} open disputes`} />
      </div>
    </div>
  );
}
