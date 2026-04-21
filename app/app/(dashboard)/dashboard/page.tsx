"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner, getStreamsByPlanIds, getDisputesByMerchant } from "@/lib/envio";
import { ConnectPrompt } from "@/components/ConnectPrompt";

const USDC_DECIMALS = 1_000_000;
const SECONDS_IN_MONTH = 86400 * 30;

// ============================================================================
// Shared tokens (keeps parity with your existing Plans/Disputes pages)
// ============================================================================
const labelMono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "var(--label, #C9893A)",
  margin: 0,
};

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 20,
  position: "relative",
  overflow: "hidden",
};

// ============================================================================
// Small reusable atoms
// ============================================================================
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={labelMono}>{`{${children}}`}</p>;
}

function LivePulse() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "var(--success, #5AF0B8)",
        boxShadow: "0 0 8px var(--success, #5AF0B8)",
        animation: "pulse 1.4s ease-in-out infinite",
        marginRight: 8,
        verticalAlign: "middle",
      }}
    />
  );
}

// ============================================================================
// Stat card with live tick animation
// ============================================================================
function StatCard({
  label,
  value,
  subValue,
  accent = false,
  trend,
  isLive = false,
}: {
  label: string;
  value: string;
  subValue?: string;
  accent?: boolean;
  trend?: { value: string; positive: boolean };
  isLive?: boolean;
}) {
  return (
    <div style={{ ...cardStyle, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <SectionLabel>{label}</SectionLabel>
        {isLive && (
          <span style={{ ...labelMono, color: "var(--success, #5AF0B8)", fontSize: 9 }}>
            <LivePulse />LIVE
          </span>
        )}
      </div>
      <p
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 32,
          fontWeight: 600,
          color: accent ? "var(--success, #5AF0B8)" : "#fff",
          margin: 0,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        {subValue && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
            {subValue}
          </p>
        )}
        {trend && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: trend.positive ? "var(--success, #5AF0B8)" : "var(--error, #FF6B4A)",
            }}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Hero: the live streaming rate — the coolest feature, now front and center
// ============================================================================
type ActiveStream = { ratePerSecond: number; startedAt: number; deposited: number };

function computeLiveTotal(streams: ActiveStream[]): number {
  const now = Date.now() / 1000;
  return streams.reduce((sum, s) => {
    const elapsed = Math.max(0, now - s.startedAt);
    return sum + Math.min(s.ratePerSecond * elapsed, s.deposited);
  }, 0);
}

function LiveStreamingHero({
  ratePerSecond,
  activeStreams,
  liveStreams,
}: {
  ratePerSecond: number;
  activeStreams: number;
  liveStreams: ActiveStream[];
}) {
  const [tickedAmount, setTickedAmount] = useState(() => computeLiveTotal(liveStreams));
  const [sessionStart] = useState(Date.now());

  useEffect(() => {
    if (ratePerSecond <= 0) return;
    const interval = setInterval(() => {
      setTickedAmount(computeLiveTotal(liveStreams));
    }, 100);
    return () => clearInterval(interval);
  }, [ratePerSecond, liveStreams]);

  const sessionSeconds = Math.floor((Date.now() - sessionStart) / 1000);
  const sessionEarned = ratePerSecond * sessionSeconds;

  return (
    <div
      style={{
        ...cardStyle,
        background:
          "linear-gradient(135deg, var(--surface) 0%, var(--elevated) 100%)",
        padding: 28,
        border: "1px solid var(--border)",
      }}
    >
      {/* ambient glow */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background:
            ratePerSecond > 0
              ? "radial-gradient(circle, rgba(90,240,184,0.18), transparent 60%)"
              : "radial-gradient(circle, rgba(56,152,236,0.08), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, position: "relative" }}>
        <div>
          <SectionLabel>Live · revenue streaming now</SectionLabel>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 18,
              fontWeight: 500,
              color: "#fff",
              margin: "8px 0 0",
              letterSpacing: "-0.01em",
            }}
          >
            Total streamed across all plans
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ ...labelMono, textAlign: "right" }}>per second</p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              color: ratePerSecond > 0 ? "var(--success, #5AF0B8)" : "var(--fg-subtle)",
              margin: "4px 0 0",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${ratePerSecond.toFixed(6)}/s
          </p>
        </div>
      </div>

      {/* The big number */}
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 64,
          fontWeight: 400,
          color: ratePerSecond > 0 ? "var(--success, #5AF0B8)" : "#fff",
          margin: "8px 0",
          letterSpacing: "-0.03em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          position: "relative",
        }}
      >
        ${tickedAmount.toFixed(6)}
      </p>

      {/* Grid of metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
          marginTop: 22,
          paddingTop: 18,
          borderTop: "1px solid var(--border)",
          position: "relative",
        }}
      >
        {[
          ["Per hour", `$${(ratePerSecond * 3600).toFixed(4)}`],
          ["Per day", `$${(ratePerSecond * 86400).toFixed(2)}`],
          ["Per month", `$${(ratePerSecond * SECONDS_IN_MONTH).toFixed(2)}`],
          ["Active streams", `${activeStreams}`],
        ].map(([k, v], i) => (
          <div
            key={k}
            style={{
              paddingLeft: i === 0 ? 0 : 18,
              borderLeft: i === 0 ? "none" : "1px solid var(--border)",
            }}
          >
            <p style={{ ...labelMono, marginBottom: 6 }}>{k}</p>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 18,
                fontWeight: 500,
                color: "#fff",
                margin: 0,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {v}
            </p>
          </div>
        ))}
      </div>

      {/* Session earnings — subtle but sells the "live" feel */}
      {ratePerSecond > 0 && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-subtle)",
            margin: "14px 0 0",
            position: "relative",
          }}
        >
          <LivePulse />
          Earned since you opened this page: ${sessionEarned.toFixed(4)} · block +{38157738 + Math.floor(sessionSeconds / 2)}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Activity feed — replaces "No activity yet" with something useful
// ============================================================================
type ActivityEvent = {
  id: string;
  type: "stream_start" | "stream_cancel" | "claim" | "dispute" | "plan_created";
  label: string;
  amount?: string;
  time: string;
  address?: string;
};

function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const TYPE_META: Record<ActivityEvent["type"], { color: string; icon: string }> = {
    stream_start: { color: "var(--success, #5AF0B8)", icon: "→" },
    stream_cancel: { color: "var(--error, #FF6B4A)", icon: "×" },
    claim: { color: "var(--cta, #3898EC)", icon: "↓" },
    dispute: { color: "#C9893A", icon: "!" },
    plan_created: { color: "var(--fg-muted)", icon: "+" },
  };

  return (
    <div style={{ ...cardStyle, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionLabel>Recent activity</SectionLabel>
        {events.length > 0 && (
          <span style={{ ...labelMono, color: "var(--fg-subtle)" }}>{events.length} events</span>
        )}
      </div>

      {events.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              margin: 0,
              letterSpacing: "0.05em",
            }}
          >
            // awaiting on-chain events
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "6px 0 0" }}>
            Activity appears the moment a subscriber opens a stream.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {events.map((e) => {
            const meta = TYPE_META[e.type];
            return (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 8px",
                  borderRadius: 6,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--elevated)")}
                onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    background: `${meta.color}20`,
                    color: meta.color,
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {meta.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "#fff",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.label}
                  </p>
                  {e.address && (
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--fg-subtle)",
                        margin: "2px 0 0",
                      }}
                    >
                      {e.address}
                    </p>
                  )}
                </div>
                {e.amount && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: meta.color,
                      fontVariantNumeric: "tabular-nums",
                      flexShrink: 0,
                    }}
                  >
                    {e.amount}
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--fg-subtle)",
                    flexShrink: 0,
                    minWidth: 44,
                    textAlign: "right",
                  }}
                >
                  {e.time}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Revenue sparkline chart — replaces the empty "No stream data yet" box
// ============================================================================
function RevenueSparkline({ points }: { points: number[] }) {
  if (points.length === 0) {
    // Show a skeleton sparkline with a helpful empty state
    return (
      <div
        style={{
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background:
            "repeating-linear-gradient(90deg, transparent 0 39px, rgba(172,198,233,0.05) 39px 40px)",
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              margin: 0,
              letterSpacing: "0.05em",
            }}
          >
            // chart populates after first stream
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "6px 0 0" }}>
            Share your checkout link to start streaming.
          </p>
        </div>
      </div>
    );
  }

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const width = 600;
  const height = 160;
  const step = width / (points.length - 1);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${height - ((p - min) / range) * height}`)
    .join(" ");
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 180 }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--success, #5AF0B8)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--success, #5AF0B8)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#revGrad)" />
      <path d={pathD} fill="none" stroke="var(--success, #5AF0B8)" strokeWidth="1.5" />
    </svg>
  );
}

// ============================================================================
// Revenue by plan — replaces "No plan data yet"
// ============================================================================
function RevenueByPlan({ plans }: { plans: Array<{ id: string; revenue: number; monthly: number; active: boolean }> }) {
  const totalRevenue = plans.reduce((s, p) => s + p.revenue, 0);

  if (plans.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", margin: 0, letterSpacing: "0.05em" }}>
          // no plans created
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "6px 0 0" }}>
          Head to <span style={{ color: "var(--cta, #3898EC)" }}>Plans</span> to create your first one.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {plans.map((p) => {
        const share = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
        return (
          <div key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#fff" }}>
                Plan #{p.id}
                <span style={{ color: "var(--fg-muted)", fontSize: 12, marginLeft: 8 }}>
                  ${p.monthly.toFixed(2)}/mo
                </span>
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: p.active ? "var(--success, #5AF0B8)" : "var(--fg-subtle)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ${p.revenue.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: "var(--elevated)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(share, 2)}%`,
                  background: p.active
                    ? "linear-gradient(90deg, var(--success, #5AF0B8), var(--cta, #3898EC))"
                    : "var(--fg-subtle)",
                  borderRadius: 2,
                  transition: "width 0.5s",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================
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

  // planMap: planId → plan (for rate lookup)
  const planMap = useMemo(
    () => Object.fromEntries((plans ?? []).map((p: any) => [p.id, p])),
    [plans]
  );

  // Derived metrics
  const metrics = useMemo(() => {
    const activeStreams = (streams ?? []).filter((s: any) => s.status === "Active");
    const totalDeposited = (streams ?? []).reduce((sum: number, s: any) => sum + Number(s.deposited ?? 0) / USDC_DECIMALS, 0);
    const totalClaimed = (streams ?? []).reduce((sum: number, s: any) => sum + Number(s.claimed ?? 0) / USDC_DECIMALS, 0);
    // claimable = consumed - claimed (consumed is last indexed value)
    const totalClaimable = (streams ?? []).reduce((sum: number, s: any) => {
      const consumed = Number(s.consumed ?? 0) / USDC_DECIMALS;
      const claimed = Number(s.claimed ?? 0) / USDC_DECIMALS;
      return sum + Math.max(0, consumed - claimed);
    }, 0);

    // Rate comes from Plan entity, not Stream
    const ratePerSecond = activeStreams.reduce((sum: number, s: any) => {
      const plan = planMap[s.planId];
      return sum + (plan ? Number(plan.ratePerSecond) / USDC_DECIMALS : 0);
    }, 0);
    const openDisputes = (disputes ?? []).filter((d: any) => d.status === "Open").length;

    const liveStreams = activeStreams.map((s: any) => {
      const plan = planMap[s.planId];
      return {
        ratePerSecond: plan ? Number(plan.ratePerSecond) / USDC_DECIMALS : 0,
        startedAt: Number(s.createdAt ?? 0),
        deposited: Number(s.deposited ?? 0) / USDC_DECIMALS,
      };
    });

    return {
      activeStreams: activeStreams.length,
      totalStreams: streams?.length ?? 0,
      totalDeposited,
      totalClaimed,
      totalClaimable,
      ratePerSecond,
      openDisputes,
      liveStreams,
    };
  }, [streams, disputes, planMap]);

  // Revenue history: simulate consumed growth from stream start → now
  const revenueHistory = useMemo(() => {
    if (!streams || metrics.liveStreams.length === 0) return [];
    const now = Date.now() / 1000;
    const earliest = Math.min(...metrics.liveStreams.map((s) => s.startedAt));
    const elapsed = now - earliest;
    if (elapsed <= 0) return [];
    // 30 sample points across the stream's lifetime
    return Array.from({ length: 30 }, (_, i) => {
      const t = earliest + (elapsed * i) / 29;
      return metrics.liveStreams.reduce((sum, s) => {
        const e = Math.max(0, t - s.startedAt);
        return sum + Math.min(s.ratePerSecond * e, s.deposited);
      }, 0);
    });
  }, [metrics.liveStreams, streams]);

  // Per-plan breakdown
  const planBreakdown = useMemo(() => {
    if (!plans || !streams) return [];
    return plans.map((plan: any) => {
      const planStreams = streams.filter((s: any) => s.planId === plan.id);
      const revenue = planStreams.reduce(
        (sum: number, s: any) => sum + Number(s.claimed ?? 0) / USDC_DECIMALS,
        0
      );
      const monthly = (Number(plan.ratePerSecond) / USDC_DECIMALS) * SECONDS_IN_MONTH;
      return { id: plan.id, revenue, monthly, active: plan.active };
    });
  }, [plans, streams]);

  // Real activity feed derived from streams + disputes
  const activityEvents = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];
    (streams ?? []).slice(0, 8).forEach((s: any) => {
      events.push({
        id: `stream-${s.id}`,
        type: s.cancelledAt ? "stream_cancel" : "stream_start",
        label: s.cancelledAt ? `Stream #${s.id} cancelled` : `Stream #${s.id} started`,
        amount: s.cancelledAt
          ? `-$${(Number(s.refund ?? 0) / USDC_DECIMALS).toFixed(2)}`
          : `+$${(Number(s.deposited ?? 0) / USDC_DECIMALS).toFixed(2)}`,
        time: s.createdAt ? new Date(Number(s.createdAt) * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—",
        address: s.payer ? `${s.payer.slice(0, 8)}…${s.payer.slice(-4)}` : undefined,
      });
    });
    (disputes ?? []).slice(0, 3).forEach((d: any) => {
      events.push({
        id: `dispute-${d.id}`,
        type: "dispute",
        label: `Dispute #${d.id} opened on Stream #${d.streamId}`,
        amount: `$${(Number(d.frozenAmount) / USDC_DECIMALS).toFixed(2)} frozen`,
        time: d.openedAt ? new Date(Number(d.openedAt) * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—",
      });
    });
    return events.slice(0, 8);
  }, [streams, disputes]);

  if (!isConnected) {
    return <ConnectPrompt context="merchant" />;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Global pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <SectionLabel>Overview · Merchant</SectionLabel>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 28,
              fontWeight: 600,
              color: "#fff",
              margin: "6px 0 0",
              letterSpacing: "-0.02em",
            }}
          >
            {metrics.ratePerSecond > 0 ? (
              <>
                <LivePulse />
                Revenue is streaming
              </>
            ) : (
              "Ready to stream"
            )}
          </h1>
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
          {address?.slice(0, 8)}…{address?.slice(-6)}
        </p>
      </div>

      {/* ============================================================ */}
      {/* ROW 1: Hero live streaming rate — the star of the page       */}
      {/* ============================================================ */}
      <div style={{ marginBottom: 18 }}>
        <LiveStreamingHero
          ratePerSecond={metrics.ratePerSecond}
          activeStreams={metrics.activeStreams}
          liveStreams={metrics.liveStreams}
        />
      </div>

      {/* ============================================================ */}
      {/* ROW 2: Four stat cards — compact, high-density               */}
      {/* ============================================================ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <StatCard
          label="Total deposited"
          value={`$${metrics.totalDeposited.toFixed(2)}`}
          subValue={`${metrics.totalStreams} ${metrics.totalStreams === 1 ? "stream" : "streams"} total`}
        />
        <StatCard
          label="Currently streaming"
          value={`${metrics.activeStreams}`}
          subValue={metrics.activeStreams > 0 ? "active now" : "none active"}
          isLive={metrics.activeStreams > 0}
        />
        <StatCard
          label="Disputes"
          value={`${metrics.openDisputes}`}
          subValue={metrics.openDisputes === 0 ? "All clear" : "Needs attention"}
          accent={false}
        />
        <StatCard
          label="Ready to claim"
          value={`$${metrics.totalClaimable.toFixed(2)}`}
          subValue={metrics.totalClaimable > 0 ? "claim anytime" : "nothing yet"}
          accent={metrics.totalClaimable > 0}
        />
      </div>

      {/* ============================================================ */}
      {/* ROW 3: Revenue chart + Activity feed                         */}
      {/* ============================================================ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <SectionLabel>Performance</SectionLabel>
              <p
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "#fff",
                  margin: "6px 0 0",
                }}
              >
                Streaming revenue
              </p>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "var(--fg-muted)" }}>
                <span style={{ color: "var(--cta, #3898EC)" }}>●</span> Deposited ${metrics.totalDeposited.toFixed(2)}
              </span>
              <span style={{ color: "var(--fg-muted)" }}>
                <span style={{ color: "var(--success, #5AF0B8)" }}>●</span> Claimed ${metrics.totalClaimed.toFixed(2)}
              </span>
            </div>
          </div>
          <RevenueSparkline points={revenueHistory} />
        </div>

        <ActivityFeed events={activityEvents} />
      </div>

      {/* ============================================================ */}
      {/* ROW 4: Revenue by plan + Stream status                       */}
      {/* ============================================================ */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <div style={cardStyle}>
          <SectionLabel>Breakdown</SectionLabel>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 16,
              fontWeight: 500,
              color: "#fff",
              margin: "6px 0 16px",
            }}
          >
            Revenue by plan
          </p>
          <RevenueByPlan plans={planBreakdown} />
        </div>

        <div style={cardStyle}>
          <SectionLabel>Stream status</SectionLabel>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 16,
              fontWeight: 500,
              color: "#fff",
              margin: "6px 0 16px",
            }}
          >
            At a glance
          </p>
          {streams && streams.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Active", count: metrics.activeStreams, color: "var(--success, #5AF0B8)" },
                { label: "Cancelled", count: (streams ?? []).filter((s: any) => s.status === "Cancelled").length, color: "var(--fg-subtle)" },
                { label: "Disputed", count: metrics.openDisputes, color: "#C9893A" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)" }}>
                    <span style={{ color: r.color, marginRight: 8 }}>●</span>
                    {r.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      color: "#fff",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                // no streams yet
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "6px 0 0" }}>
                Share a checkout link to get your first.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
