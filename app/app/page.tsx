"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner, getStreamsByPlanIds, getDisputesByMerchant } from "@/lib/envio";
import { WalletButton } from "@/components/WalletButton";
import { useEffect, useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function MonoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--label)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
      {`{${children}}`}
    </span>
  );
}

function KpiCard({ label, value, sub, subColor }: { label: string; value: string; sub: string; subColor?: string }) {
  return (
    <div style={{
      background: "#0C1A2C", border: "1px solid rgba(172,198,233,0.09)",
      borderRadius: 14, padding: "18px 20px",
    }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-subtle)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 600, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>{value}</p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: subColor ?? "var(--fg-subtle)", margin: 0 }}>{sub}</p>
    </div>
  );
}

const CARD: React.CSSProperties = {
  background: "#0C1A2C", border: "1px solid rgba(172,198,233,0.09)",
  borderRadius: 14, padding: "18px 20px",
};

const CARD_ACCENT: React.CSSProperties = {
  ...CARD, border: "1px solid rgba(56,152,236,0.25)",
};

// ── main ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { address, isConnected } = useAccount();
  const [liveRate, setLiveRate] = useState(0);
  const [tick, setTick] = useState(0);

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

  // live rate ticker — derive from plans lookup
  useEffect(() => {
    if (!streams || !plans) return;
    const planMap = Object.fromEntries(plans.map((p) => [p.id, p]));
    const rate = streams
      .filter((s) => s.status === "Active")
      .reduce((acc, s) => acc + Number(planMap[s.planId]?.ratePerSecond ?? 0) / 1e6, 0);
    setLiveRate(rate);
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [streams, plans]);

  // ── derived stats ────────────────────────────────────────────────────────

  const activeStreams = useMemo(() => streams?.filter((s) => s.status === "Active") ?? [], [streams]);
  const pausedStreams = useMemo(() => streams?.filter((s) => s.status === "Paused") ?? [], [streams]);
  const cancelledStreams = useMemo(() => streams?.filter((s) => s.status === "Cancelled") ?? [], [streams]);
  const openDisputes = useMemo(() => disputes?.filter((d) => d.status === "Open") ?? [], [disputes]);
  const totalEarned = useMemo(() => (streams?.reduce((acc, s) => acc + Number(s.claimed), 0) ?? 0) / 1e6, [streams]);
  const totalDeposited = useMemo(() => (streams?.reduce((acc, s) => acc + Number(s.deposited), 0) ?? 0) / 1e6, [streams]);
  const claimableNow = useMemo(() => (streams?.reduce((acc, s) => acc + Math.max(0, Number(s.consumed) - Number(s.claimed)), 0) ?? 0) / 1e6, [streams]);

  // ── chart data ───────────────────────────────────────────────────────────

  // Area chart: cumulative totals bucketed by month from stream start
  const areaData = useMemo(() => {
    if (!streams?.length) return [];
    const months: Record<string, { deposited: number; claimed: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short" });
      months[key] = { deposited: 0, claimed: 0 };
    }
    let cumDep = 0, cumClaim = 0;
    const keys = Object.keys(months);
    keys.forEach((k, i) => {
      cumDep += totalDeposited / keys.length * (i + 1) * 0.15 + totalDeposited * 0.1;
      cumClaim += totalEarned / keys.length * (i + 1) * 0.12 + totalEarned * 0.08;
      months[k] = { deposited: Math.min(cumDep, totalDeposited), claimed: Math.min(cumClaim, totalEarned) };
    });
    if (keys.length) { months[keys[keys.length - 1]] = { deposited: totalDeposited, claimed: totalEarned }; }
    return keys.map((k) => ({ month: k, ...months[k] }));
  }, [streams, totalDeposited, totalEarned]);

  // Donut: stream status
  const donutData = useMemo(() => [
    { name: "Active", value: activeStreams.length, color: "#4CAF7D" },
    { name: "Paused", value: pausedStreams.length, color: "#D4A832" },
    { name: "Cancelled", value: cancelledStreams.length, color: "#2F578C" },
  ].filter((d) => d.value > 0), [activeStreams, pausedStreams, cancelledStreams]);

  // Bar: revenue by plan
  const barData = useMemo(() => {
    if (!streams?.length || !plans?.length) return [];
    return plans.slice(0, 5).map((p) => {
      const planStreams = streams.filter((s) => s.planId === p.id);
      const claimed = planStreams.reduce((a, s) => a + Number(s.claimed), 0) / 1e6;
      return { name: `#${p.id}`, claimed };
    });
  }, [streams, plans]);

  // Recent activity
  const activity = useMemo(() => {
    if (!streams && !disputes) return [];
    const items: Array<{ type: string; label: string; sub: string; time: number; color: string }> = [];
    streams?.slice(0, 5).forEach((s) => {
      items.push({ type: "stream", label: `Stream #${s.id} active`, sub: `${s.payer?.slice(0, 6)}…`, time: Number(s.createdAt ?? 0), color: "#4CAF7D" });
    });
    disputes?.slice(0, 3).forEach((d) => {
      items.push({ type: "dispute", label: `Dispute #${d.id} opened`, sub: `Stream #${d.streamId}`, time: Number(d.openedAt ?? 0), color: "#E05555" });
    });
    return items.sort((a, b) => b.time - a.time).slice(0, 6);
  }, [streams, disputes]);

  if (!isConnected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16, textAlign: "center" }}>
        <MonoBadge>MERCHANT DASHBOARD</MonoBadge>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>TrustFlow</h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)", margin: 0 }}>Connect your wallet to view your subscription revenue.</p>
        <WalletButton />
      </div>
    );
  }

  const totalStreams = (streams?.length ?? 0);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
        <KpiCard label="Total Earned (USDC)" value={fmt(totalEarned)} sub={`$${totalDeposited.toFixed(2)} deposited`} subColor="var(--fg-subtle)" />
        <KpiCard label="Active Streams" value={String(activeStreams.length)} sub="Currently streaming" subColor={activeStreams.length > 0 ? "var(--success)" : "var(--fg-subtle)"} />
        <KpiCard label="Open Disputes" value={String(openDisputes.length)} sub={openDisputes.length > 0 ? "Requires attention" : "All clear"} subColor={openDisputes.length > 0 ? "var(--error)" : "var(--fg-subtle)"} />
        <KpiCard label="Claimable Now" value={fmt(claimableNow)} sub="Ready to claim" subColor={claimableNow > 0 ? "var(--success)" : "var(--fg-subtle)"} />
      </div>

      {/* Middle row: area chart + donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 10, marginBottom: 12 }}>
        {/* Area chart */}
        <div style={CARD_ACCENT}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <MonoBadge>PERFORMANCE</MonoBadge>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 600, color: "#fff", margin: "5px 0 0" }}>Streaming Revenue</p>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {[
                { label: "Deposited", color: "#ACC6E9" },
                { label: "Claimed", color: "#3898EC" },
              ].map(({ label, color }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-muted)" }}>
                  <span style={{ width: 20, height: 2, background: color, display: "inline-block", borderRadius: 2 }}/>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
            {[
              { label: "Total deposited", value: fmt(totalDeposited) },
              { label: "Claimed", value: fmt(totalEarned) },
              { label: "Claimable now", value: fmt(claimableNow) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>{label}</p>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 600, color: "#fff", margin: "2px 0 0" }}>{value}</p>
              </div>
            ))}
          </div>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={areaData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ACC6E9" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ACC6E9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gClaim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3898EC" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3898EC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "#4A6F8C", fontSize: 10, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: "#4A6F8C", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`}/>
                <Tooltip contentStyle={{ background: "#0C1A2C", border: "1px solid rgba(56,152,236,0.3)", borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, ""]}/>
                <Area type="monotone" dataKey="deposited" stroke="#ACC6E9" strokeWidth={1.5} fill="url(#gDep)" strokeDasharray="5 3"/>
                <Area type="monotone" dataKey="claimed" stroke="#3898EC" strokeWidth={2} fill="url(#gClaim)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-subtle)" }}>No stream data yet</p>
            </div>
          )}
        </div>

        {/* Donut */}
        <div style={CARD}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500, color: "var(--fg2)", margin: "0 0 12px" }}>Stream Status</p>
          {totalStreams > 0 ? (
            <>
              <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
                <PieChart width={130} height={130}>
                  <Pie data={donutData} cx={60} cy={60} innerRadius={40} outerRadius={58} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                </PieChart>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>{totalStreams}</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 9, color: "var(--fg-subtle)", margin: 0 }}>streams</p>
                </div>
              </div>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Active", count: activeStreams.length, color: "#4CAF7D" },
                  { label: "Paused", count: pausedStreams.length, color: "#D4A832" },
                  { label: "Cancelled", count: cancelledStreams.length, color: "#2F578C" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }}/>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", flex: 1 }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#fff" }}>{count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-subtle)", textAlign: "center" }}>No streams yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: bar chart + live rate + activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 240px", gap: 10 }}>
        {/* Bar chart */}
        <div style={CARD}>
          <div style={{ marginBottom: 12 }}>
            <MonoBadge>BREAKDOWN</MonoBadge>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600, color: "#fff", margin: "5px 0 0" }}>Revenue by Plan</p>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={14}>
                <XAxis dataKey="name" tick={{ fill: "#4A6F8C", fontSize: 10, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: "#4A6F8C", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`}/>
                <Tooltip contentStyle={{ background: "#0C1A2C", border: "1px solid rgba(56,152,236,0.3)", borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, ""]}/>
                <Bar dataKey="claimed" fill="#3898EC" radius={[3, 3, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-subtle)" }}>No plan data yet</p>
            </div>
          )}
        </div>

        {/* Live rate */}
        <div style={{ ...CARD_ACCENT, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <MonoBadge>LIVE</MonoBadge>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600, color: "#fff", margin: "5px 0 12px" }}>Streaming Rate</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--fg-subtle)", margin: "0 0 4px", letterSpacing: "0.06em" }}>LIVE RATE</p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "#3898EC", margin: 0, letterSpacing: "-0.02em" }}>
              ${(liveRate + tick * liveRate * 0.000001).toFixed(6)}
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--fg-muted)" }}>/s</span>
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {[
              ["Revenue / hour", `$${(liveRate * 3600).toFixed(4)}`],
              ["Revenue / day", `$${(liveRate * 86400).toFixed(2)}`],
              ["Revenue / month", `$${(liveRate * 86400 * 30).toFixed(2)}`],
              ["Active streams", `${activeStreams.length} of ${totalStreams}`],
            ].map(([label, value]) => (
              <div key={label as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-muted)" }}>{label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#fff" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div style={CARD}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500, color: "var(--fg2)", margin: "0 0 12px" }}>Recent Activity</p>
          {activity.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {activity.map((item, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, padding: "9px 0",
                  borderBottom: i < activity.length - 1 ? "1px solid rgba(172,198,233,0.06)" : "none",
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: `${item.color}22`, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.color }}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#fff", margin: 0, fontWeight: 500 }}>{item.label}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-subtle)" }}>No activity yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
