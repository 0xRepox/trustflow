"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner, getStreamsByPlanIds, type Plan } from "@/lib/envio";
import { ADDRESSES, STREAM_MANAGER_ABI } from "@/lib/contracts";
import { ConnectPrompt } from "@/components/ConnectPrompt";

const USDC_DECIMALS = 1_000_000;
const SECONDS_IN_MONTH = 86400 * 30;

// ============================================================================
// Shared tokens (match Overview + Plans pages)
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
  overflow: "hidden",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={labelMono}>{`{${children}}`}</p>;
}

function LivePulse({ color = "var(--success, #5AF0B8)" }: { color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: "pulse 1.4s ease-in-out infinite",
        marginRight: 8,
        verticalAlign: "middle",
      }}
    />
  );
}

// ============================================================================
// Status chip
// ============================================================================
type StreamStatus = "streaming" | "canceled" | "disputed" | "ended";

const STATUS_META: Record<StreamStatus, { label: string; color: string; bg: string; border: string }> = {
  streaming: {
    label: "Streaming",
    color: "var(--success, #5AF0B8)",
    bg: "rgba(90,240,184,0.1)",
    border: "rgba(90,240,184,0.3)",
  },
  canceled: {
    label: "Canceled",
    color: "var(--fg-subtle)",
    bg: "rgba(172,198,233,0.05)",
    border: "rgba(172,198,233,0.15)",
  },
  disputed: {
    label: "Disputed",
    color: "#C9893A",
    bg: "rgba(201,137,58,0.12)",
    border: "rgba(201,137,58,0.35)",
  },
  ended: {
    label: "Depleted",
    color: "var(--fg-muted)",
    bg: "rgba(172,198,233,0.05)",
    border: "rgba(172,198,233,0.2)",
  },
};

function StatusChip({ status, live = false }: { status: StreamStatus; live?: boolean }) {
  const meta = STATUS_META[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 9999,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        color: meta.color,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {live && <LivePulse color={meta.color} />}
      {meta.label}
    </span>
  );
}

// ============================================================================
// Live ticker for an individual stream row
// ============================================================================
function StreamTicker({
  ratePerSecond,
  startedAt,
  deposited,
  claimed,
  status,
}: {
  ratePerSecond: number;
  startedAt: number;
  deposited: number;
  claimed: number;
  status: StreamStatus;
}) {
  const [now, setNow] = useState(Date.now() / 1000);

  useEffect(() => {
    if (status !== "streaming") return;
    const interval = setInterval(() => setNow(Date.now() / 1000), 100);
    return () => clearInterval(interval);
  }, [status]);

  const elapsed = Math.max(0, now - startedAt);
  const consumed = Math.min(ratePerSecond * elapsed, deposited);
  const claimable = Math.max(0, consumed - claimed);
  const remaining = Math.max(0, deposited - consumed);
  const percentConsumed = deposited > 0 ? (consumed / deposited) * 100 : 0;

  return (
    <div>
      {/* Consumption bar */}
      <div
        style={{
          height: 4,
          background: "var(--elevated)",
          borderRadius: 2,
          overflow: "hidden",
          marginBottom: 8,
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(percentConsumed, 100)}%`,
            background:
              status === "streaming"
                ? "linear-gradient(90deg, var(--success, #5AF0B8), var(--cta, #3898EC))"
                : status === "disputed"
                ? "#C9893A"
                : "var(--fg-subtle)",
            transition: "width 0.5s",
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div>
          <p style={{ ...labelMono, marginBottom: 3 }}>Consumed</p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: status === "streaming" ? "var(--success, #5AF0B8)" : "#fff",
              margin: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${consumed.toFixed(4)}
          </p>
        </div>
        <div>
          <p style={{ ...labelMono, marginBottom: 3 }}>Claimable</p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: claimable > 0 ? "var(--cta, #3898EC)" : "var(--fg-subtle)",
              margin: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${claimable.toFixed(4)}
          </p>
        </div>
        <div>
          <p style={{ ...labelMono, marginBottom: 3 }}>Remaining</p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "#fff",
              margin: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${remaining.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Stream card (row)
// ============================================================================
function StreamCard({ stream, plan, onClaim }: { stream: any; plan: Plan | null; onClaim: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  // ratePerSecond lives on the Plan, not the Stream
  const ratePerSecond = plan ? Number(plan.ratePerSecond) / USDC_DECIMALS : 0;
  const deposited = Number(stream.deposited ?? 0) / USDC_DECIMALS;
  const claimed = Number(stream.claimed ?? 0) / USDC_DECIMALS;
  // Envio field names: createdAt (not startedAt), cancelledAt (not canceledAt), payer (not subscriber)
  const startedAt = Number(stream.createdAt ?? 0);

  const status: StreamStatus = stream.status === "Disputed"
    ? "disputed"
    : stream.cancelledAt || stream.status === "Cancelled"
    ? "canceled"
    : deposited > 0 && ratePerSecond > 0 && (Date.now() / 1000 - startedAt) * ratePerSecond >= deposited
    ? "ended"
    : "streaming";

  const monthly = ratePerSecond * SECONDS_IN_MONTH;
  const subscriberShort = stream.payer
    ? `${stream.payer.slice(0, 8)}…${stream.payer.slice(-4)}`
    : "—";

  // Compute live claimable for the claim button
  const [liveClaimable, setLiveClaimable] = useState(0);
  useEffect(() => {
    if (status !== "streaming") {
      const finalConsumed = Math.min(ratePerSecond * (Number(stream.cancelledAt ?? Date.now() / 1000) - startedAt), deposited);
      setLiveClaimable(Math.max(0, finalConsumed - claimed));
      return;
    }
    const tick = () => {
      const elapsed = Date.now() / 1000 - startedAt;
      const consumed = Math.min(ratePerSecond * elapsed, deposited);
      setLiveClaimable(Math.max(0, consumed - claimed));
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [status, ratePerSecond, startedAt, deposited, claimed, stream.canceledAt]);

  return (
    <div
      style={{
        ...cardStyle,
        padding: 18,
        position: "relative",
        transition: "border-color 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        if (status === "streaming") e.currentTarget.style.borderColor = "rgba(90,240,184,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {/* Subtle left indicator strip for status */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 18,
          bottom: 18,
          width: 2,
          background: STATUS_META[status].color,
          borderRadius: 2,
          opacity: status === "streaming" ? 1 : 0.5,
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.8fr 180px", gap: 20, alignItems: "center", paddingLeft: 10 }}>
        {/* Left: identity */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 14,
                fontWeight: 500,
                color: "#fff",
                margin: 0,
              }}
            >
              Stream #{stream.id}
            </p>
            <StatusChip status={status} live={status === "streaming"} />
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              margin: 0,
            }}
          >
            {subscriberShort} · Plan #{stream.planId}
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "var(--fg-muted)",
              margin: "4px 0 0",
            }}
          >
            ${monthly.toFixed(2)}/mo · ${ratePerSecond.toFixed(6)}/s
          </p>
        </div>

        {/* Middle: live ticker */}
        <StreamTicker
          ratePerSecond={ratePerSecond}
          startedAt={startedAt}
          deposited={deposited}
          claimed={claimed}
          status={status}
        />

        {/* Right: actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "stretch" }}>
          <button
            onClick={() => onClaim(stream.id)}
            disabled={liveClaimable <= 0.0001}
            style={{
              background: liveClaimable > 0.0001 ? "var(--cta, #3898EC)" : "var(--elevated)",
              border: "none",
              borderRadius: 8,
              padding: "9px 14px",
              fontFamily: "var(--font-heading)",
              fontSize: 12,
              fontWeight: 500,
              color: liveClaimable > 0.0001 ? "#fff" : "var(--fg-subtle)",
              cursor: liveClaimable > 0.0001 ? "pointer" : "not-allowed",
              transition: "background 0.15s",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Claim ${liveClaimable.toFixed(2)}
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "7px 14px",
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: expanded ? "#fff" : "var(--fg-muted)",
              cursor: "pointer",
              transition: "all 0.15s",
              borderColor: expanded ? "rgba(172,198,233,0.3)" : "var(--border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "rgba(172,198,233,0.3)";
            }}
            onMouseLeave={(e) => {
              if (!expanded) {
                e.currentTarget.style.color = "var(--fg-muted)";
                e.currentTarget.style.borderColor = "var(--border)";
              }
            }}
          >
            {expanded ? "Hide details ↑" : "View details →"}
          </button>
        </div>
      </div>

      {/* Inline expanded detail panel */}
      {expanded && (
        <div style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid rgba(172,198,233,0.08)",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          paddingLeft: 10,
        }}>
          {/* Subscriber */}
          <div>
            <p style={{ ...labelMono, marginBottom: 6 }}>Subscriber</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#fff", margin: 0, wordBreak: "break-all" }}>
              {stream.payer ?? "—"}
            </p>
          </div>

          {/* Timeline */}
          <div>
            <p style={{ ...labelMono, marginBottom: 6 }}>Timeline</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg2)", margin: 0 }}>
                Started: {stream.createdAt ? new Date(Number(stream.createdAt) * 1000).toLocaleString() : "—"}
              </p>
              {stream.cancelledAt && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                  Cancelled: {new Date(Number(stream.cancelledAt) * 1000).toLocaleString()}
                </p>
              )}
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                Deposited: ${(Number(stream.deposited ?? 0) / USDC_DECIMALS).toFixed(2)} USDC
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                Claimed: ${(Number(stream.claimed ?? 0) / USDC_DECIMALS).toFixed(4)} USDC
              </p>
            </div>
          </div>

          {/* Links */}
          <div>
            <p style={{ ...labelMono, marginBottom: 6 }}>Explorer</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <a
                href={`https://testnet.arcscan.app/address/${stream.payer}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--cta, #3898EC)", textDecoration: "none" }}
              >
                View subscriber ↗
              </a>
              <a
                href={`https://testnet.arcscan.app/address/${ADDRESSES.StreamManager}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--cta, #3898EC)", textDecoration: "none" }}
              >
                StreamManager ↗
              </a>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", margin: 0 }}>
                Stream ID: #{stream.id}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Filter bar
// ============================================================================
type Filter = "all" | StreamStatus;

function FilterBar({
  current,
  counts,
  onChange,
}: {
  current: Filter;
  counts: Record<Filter, number>;
  onChange: (f: Filter) => void;
}) {
  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "streaming", label: "Streaming" },
    { key: "disputed", label: "Disputed" },
    { key: "canceled", label: "Canceled" },
    { key: "ended", label: "Depleted" },
  ];

  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
      {filters.map((f) => {
        const active = current === f.key;
        const count = counts[f.key] ?? 0;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: active
                ? "1px solid rgba(56,152,236,0.6)"
                : "1px solid var(--border)",
              background: active ? "rgba(56,152,236,0.12)" : "var(--surface)",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 500,
              color: active ? "var(--cta, #3898EC)" : "var(--fg-muted)",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {f.label}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 4,
                background: active ? "rgba(56,152,236,0.15)" : "var(--elevated)",
                color: active ? "var(--cta, #3898EC)" : "var(--fg-subtle)",
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================
export default function StreamsPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [filter, setFilter] = useState<Filter>("all");
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const { data: plans } = useQuery({
    queryKey: ["plans", address],
    queryFn: () => getPlansByOwner(address!),
    enabled: !!address,
  });

  const planMap = useMemo(
    () => Object.fromEntries((plans ?? []).map((p) => [p.id, p])),
    [plans]
  );

  const { data: streams, refetch } = useQuery({
    queryKey: ["streams", plans?.map((p) => p.id)],
    queryFn: () => getStreamsByPlanIds(plans!.map((p) => p.id)),
    enabled: !!plans?.length,
  });

  // Classify streams — use Envio field names (createdAt, cancelledAt, payer)
  const classified = useMemo(() => {
    if (!streams) return [];
    return streams.map((s) => {
      const plan = planMap[s.planId];
      const rate = plan ? Number(plan.ratePerSecond) / USDC_DECIMALS : 0;
      const deposited = Number(s.deposited ?? 0) / USDC_DECIMALS;
      const startedAt = Number(s.createdAt ?? 0);
      const elapsed = Date.now() / 1000 - startedAt;
      let status: StreamStatus;
      if (s.status === "Disputed") status = "disputed";
      else if (s.cancelledAt || s.status === "Cancelled") status = "canceled";
      else if (deposited > 0 && rate > 0 && elapsed * rate >= deposited) status = "ended";
      else status = "streaming";
      return { ...s, _status: status };
    });
  }, [streams, planMap]);

  const counts: Record<Filter, number> = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, streaming: 0, disputed: 0, canceled: 0, ended: 0 };
    c.all = classified.length;
    classified.forEach((s: any) => {
      c[s._status as StreamStatus]++;
    });
    return c;
  }, [classified]);

  const filtered = useMemo(() => {
    if (filter === "all") return classified;
    return classified.filter((s: any) => s._status === filter);
  }, [classified, filter]);

  // Live aggregate rate across visible streams
  const [now, setNow] = useState(Date.now() / 1000);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now() / 1000), 200);
    return () => clearInterval(interval);
  }, []);

  const liveAggregate = useMemo(() => {
    const active = classified.filter((s: any) => s._status === "streaming");
    const totalRate = active.reduce((sum: number, s: any) => {
      const plan = planMap[s.planId];
      return sum + (plan ? Number(plan.ratePerSecond) / USDC_DECIMALS : 0);
    }, 0);
    const totalClaimable = active.reduce((sum: number, s: any) => {
      const plan = planMap[s.planId];
      const rate = plan ? Number(plan.ratePerSecond) / USDC_DECIMALS : 0;
      const deposited = Number(s.deposited ?? 0) / USDC_DECIMALS;
      const claimed = Number(s.claimed ?? 0) / USDC_DECIMALS;
      const startedAt = Number(s.createdAt ?? 0);
      const consumed = Math.min(rate * (now - startedAt), deposited);
      return sum + Math.max(0, consumed - claimed);
    }, 0);
    return { activeCount: active.length, totalRate, totalClaimable };
  }, [classified, planMap, now]);

  async function handleClaim(streamId: string) {
    setTxStatus(`Claiming stream #${streamId}…`);
    try {
      await writeContractAsync({
        address: ADDRESSES.StreamManager,
        abi: STREAM_MANAGER_ABI,
        functionName: "claim",
        args: [BigInt(streamId)],
      });
      setTxStatus(`Stream #${streamId} claimed.`);
      refetch();
    } catch (e) {
      setTxStatus(`Error: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  if (!isConnected) {
    return <ConnectPrompt context="merchant" headline="See every stream, live" subline="Connect your wallet to view all active and historical payment streams across your plans." />;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      {/* Page header with live aggregate */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <SectionLabel>Streams · Merchant</SectionLabel>
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
            {liveAggregate.activeCount > 0 ? (
              <>
                <LivePulse />
                {liveAggregate.activeCount} {liveAggregate.activeCount === 1 ? "stream" : "streams"} live
              </>
            ) : (
              "No active streams"
            )}
          </h1>
        </div>

        {liveAggregate.activeCount > 0 && (
          <div style={{ textAlign: "right" }}>
            <p style={{ ...labelMono, textAlign: "right", marginBottom: 4 }}>Aggregate rate</p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 18,
                color: "var(--success, #5AF0B8)",
                margin: 0,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ${liveAggregate.totalRate.toFixed(6)}/s
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--fg-muted)",
                margin: "3px 0 0",
              }}
            >
              ${liveAggregate.totalClaimable.toFixed(4)} claimable right now
            </p>
          </div>
        )}
      </div>

      {/* TX status banner */}
      {txStatus && (
        <div
          style={{
            padding: "10px 14px",
            background: txStatus.startsWith("Error") ? "rgba(255,107,74,0.1)" : "rgba(56,152,236,0.08)",
            border: `1px solid ${txStatus.startsWith("Error") ? "rgba(255,107,74,0.3)" : "rgba(56,152,236,0.25)"}`,
            borderRadius: 8,
            marginBottom: 16,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: txStatus.startsWith("Error") ? "var(--error, #FF6B4A)" : "var(--cta, #3898EC)",
          }}
        >
          {txStatus}
        </div>
      )}

      {/* Filters */}
      <FilterBar current={filter} counts={counts} onChange={setFilter} />

      {/* Stream list */}
      {filtered.length === 0 ? (
        <div
          style={{
            ...cardStyle,
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              margin: 0,
              letterSpacing: "0.05em",
            }}
          >
            {filter === "all"
              ? "// no streams yet"
              : `// no ${filter} streams`}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", margin: "8px 0 0" }}>
            {filter === "all"
              ? "Share a checkout link from your Plans page to receive your first stream."
              : "Try a different filter to see more results."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((stream: any) => (
            <StreamCard key={stream.id} stream={stream} plan={planMap[stream.planId] ?? null} onClaim={handleClaim} />
          ))}
        </div>
      )}

      {/* Footer stats */}
      {classified.length > 0 && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-subtle)",
            margin: "24px 0 0",
            textAlign: "center",
          }}
        >
          {filtered.length} of {classified.length} streams shown
        </p>
      )}
    </div>
  );
}
