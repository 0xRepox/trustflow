"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner, getStreamsByPlanIds, getDisputesByMerchant } from "@/lib/envio";
import { ADDRESSES, DISPUTE_RESOLVER_ABI } from "@/lib/contracts";
import { keccak256, toBytes } from "viem";

const USDC_DECIMALS = 1_000_000;

// ============================================================================
// Shared tokens
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
  padding: 18,
  position: "relative",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "var(--elevated)",
  border: "1px solid rgba(172,198,233,0.2)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 12,
  fontFamily: "var(--font-body)",
  color: "#fff",
  outline: "none",
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

const STATUS_META: Record<string, { color: string; bg: string; border: string; strip: string }> = {
  Open: {
    color: "#C9893A",
    bg: "rgba(201,137,58,0.12)",
    border: "rgba(201,137,58,0.35)",
    strip: "#C9893A",
  },
  Responded: {
    color: "var(--cta, #3898EC)",
    bg: "rgba(56,152,236,0.12)",
    border: "rgba(56,152,236,0.35)",
    strip: "var(--cta, #3898EC)",
  },
  Settled: {
    color: "var(--fg-subtle)",
    bg: "rgba(172,198,233,0.05)",
    border: "rgba(172,198,233,0.1)",
    strip: "var(--fg-subtle)",
  },
};

// ============================================================================
// Countdown component - builds urgency for open disputes
// ============================================================================
function Countdown({ deadline }: { deadline: number }) {
  const [remaining, setRemaining] = useState(deadline - Date.now() / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(deadline - Date.now() / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (remaining <= 0) {
    return (
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--error, #FF6B4A)",
          fontWeight: 500,
        }}
      >
        <LivePulse color="var(--error, #FF6B4A)" />
        Auto-settle imminent
      </span>
    );
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const mins = Math.floor((remaining % 3600) / 60);

  const urgent = remaining < 86400; // less than 24h
  const color = urgent ? "var(--error, #FF6B4A)" : "#C9893A";

  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {urgent && <LivePulse color={color} />}
      {days > 0 && `${days}d `}
      {hours.toString().padStart(2, "0")}:{mins.toString().padStart(2, "0")} until auto-settle
    </span>
  );
}

// ============================================================================
// Status chip
// ============================================================================
function StatusChip({ status, responded = false }: { status: string; responded?: boolean }) {
  const meta = STATUS_META[status] ?? STATUS_META.Settled;
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
      {status === "Open" && <LivePulse color={meta.color} />}
      {status === "Responded" ? "Awaiting arbitration" : status}
    </span>
  );
}

// ============================================================================
// Dispute card
// ============================================================================
function DisputeCard({
  dispute,
  evidence,
  onEvidenceChange,
  onRespond,
  onDefaultSettle,
  isPending,
}: {
  dispute: any;
  evidence: string;
  onEvidenceChange: (v: string) => void;
  onRespond: () => void;
  onDefaultSettle: () => void;
  isPending: boolean;
}) {
  const meta = STATUS_META[dispute.status] ?? STATUS_META.Settled;
  const frozenAmount = Number(dispute.frozenAmount) / USDC_DECIMALS;
  const subscriberShort = dispute.subscriber
    ? `${dispute.subscriber.slice(0, 8)}…${dispute.subscriber.slice(-4)}`
    : "—";

  // Assume 7 day default deadline if not provided
  const deadline = dispute.deadline
    ? Number(dispute.deadline)
    : dispute.openedAt
    ? Number(dispute.openedAt) + 7 * 86400
    : Date.now() / 1000 + 7 * 86400;

  return (
    <div
      style={{
        ...cardStyle,
        border: `1px solid ${meta.border}`,
        opacity: dispute.status === "Settled" ? 0.65 : 1,
      }}
    >
      {/* Status strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 18,
          bottom: 18,
          width: 2,
          background: meta.strip,
          borderRadius: 2,
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: dispute.status === "Open" ? 14 : 0,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 14,
                fontWeight: 500,
                color: "#fff",
                margin: 0,
              }}
            >
              Dispute #{dispute.id}
            </p>
            <StatusChip status={dispute.status} />
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              margin: 0,
            }}
          >
            Stream #{dispute.streamId} · {subscriberShort}
          </p>
          {dispute.status === "Open" && (
            <div style={{ marginTop: 6 }}>
              <Countdown deadline={deadline} />
            </div>
          )}
          {dispute.status === "Settled" && dispute.verdict && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "var(--fg-muted)",
                margin: "4px 0 0",
              }}
            >
              Verdict: <span style={{ color: "#fff" }}>{dispute.verdict}</span>
            </p>
          )}
        </div>

        {/* Frozen amount */}
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 20 }}>
          <p style={{ ...labelMono, marginBottom: 4, textAlign: "right" }}>Frozen</p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              color: dispute.status === "Open" ? "#C9893A" : "#fff",
              margin: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${frozenAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Action row (Open only) */}
      {dispute.status === "Open" && (
        <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <input
            style={inputStyle}
            placeholder="Evidence text (hashed onchain with keccak256)"
            value={evidence}
            onChange={(e) => onEvidenceChange(e.target.value)}
          />
          <button
            onClick={onRespond}
            disabled={isPending || !evidence}
            style={{
              background: evidence ? "var(--cta, #3898EC)" : "var(--elevated)",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontFamily: "var(--font-heading)",
              fontSize: 12,
              fontWeight: 500,
              color: evidence ? "#fff" : "var(--fg-subtle)",
              cursor: evidence && !isPending ? "pointer" : "not-allowed",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            Respond
          </button>
          <button
            onClick={onDefaultSettle}
            disabled={isPending}
            style={{
              background: "var(--elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 14px",
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "var(--fg-muted)",
              cursor: isPending ? "not-allowed" : "pointer",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            Default settle
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================
export default function DisputesPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [evidenceInputs, setEvidenceInputs] = useState<Record<string, string>>({});
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const { data: disputes, refetch } = useQuery({
    queryKey: ["disputes", streams?.map((s) => s.id)],
    queryFn: () => getDisputesByMerchant(streams!.map((s) => s.id)),
    enabled: !!streams?.length,
  });

  async function handleRespond(disputeId: string) {
    const evidence = evidenceInputs[disputeId];
    if (!evidence) return;
    try {
      setActiveId(disputeId);
      setTxStatus("Submitting evidence…");
      const hash = keccak256(toBytes(evidence));
      await writeContractAsync({
        address: ADDRESSES.DisputeResolver,
        abi: DISPUTE_RESOLVER_ABI,
        functionName: "respondToDispute",
        args: [BigInt(disputeId), hash],
      });
      setTxStatus("Response submitted!");
      refetch();
    } catch (e) {
      setTxStatus(`Error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setActiveId(null);
    }
  }

  async function handleDefaultSettle(disputeId: string) {
    try {
      setActiveId(disputeId);
      setTxStatus("Settling…");
      await writeContractAsync({
        address: ADDRESSES.DisputeResolver,
        abi: DISPUTE_RESOLVER_ABI,
        functionName: "defaultSettle",
        args: [BigInt(disputeId)],
      });
      setTxStatus("Settled!");
      refetch();
    } catch (e) {
      setTxStatus(`Error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setActiveId(null);
    }
  }

  if (!isConnected) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "80px 0", textAlign: "center" }}>
        <SectionLabel>Disputes · not connected</SectionLabel>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 32,
            fontWeight: 600,
            color: "#fff",
            margin: "12px 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          Connect your wallet
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)" }}>
          Review and respond to disputes across your plans.
        </p>
      </div>
    );
  }

  const open = disputes?.filter((d: any) => d.status === "Open") ?? [];
  const responded = disputes?.filter((d: any) => d.status === "Responded") ?? [];
  const settled = disputes?.filter((d: any) => d.status === "Settled") ?? [];

  const totalFrozen = open.reduce(
    (sum: number, d: any) => sum + Number(d.frozenAmount) / USDC_DECIMALS,
    0
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 24,
        }}
      >
        <div>
          <SectionLabel>Disputes · Merchant</SectionLabel>
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
            {open.length > 0 ? (
              <>
                <LivePulse color="#C9893A" />
                {open.length} {open.length === 1 ? "dispute" : "disputes"} need attention
              </>
            ) : (
              "All clear"
            )}
          </h1>
        </div>

        {open.length > 0 && (
          <div style={{ textAlign: "right" }}>
            <p style={{ ...labelMono, textAlign: "right", marginBottom: 4 }}>Total frozen</p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 18,
                color: "#C9893A",
                margin: 0,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ${totalFrozen.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* TX status banner */}
      {txStatus && (
        <div
          style={{
            padding: "10px 14px",
            background: txStatus.startsWith("Error")
              ? "rgba(255,107,74,0.1)"
              : "rgba(56,152,236,0.08)",
            border: `1px solid ${
              txStatus.startsWith("Error") ? "rgba(255,107,74,0.3)" : "rgba(56,152,236,0.25)"
            }`,
            borderRadius: 8,
            marginBottom: 16,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: txStatus.startsWith("Error")
              ? "var(--error, #FF6B4A)"
              : "var(--cta, #3898EC)",
          }}
        >
          {txStatus}
        </div>
      )}

      {/* Open disputes */}
      {open.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <SectionLabel>Open · {open.length}</SectionLabel>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {open.map((d: any) => (
              <DisputeCard
                key={d.id}
                dispute={d}
                evidence={evidenceInputs[d.id] ?? ""}
                onEvidenceChange={(v) =>
                  setEvidenceInputs((prev) => ({ ...prev, [d.id]: v }))
                }
                onRespond={() => handleRespond(d.id)}
                onDefaultSettle={() => handleDefaultSettle(d.id)}
                isPending={isPending && activeId === d.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Responded */}
      {responded.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <SectionLabel>Responded · {responded.length}</SectionLabel>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {responded.map((d: any) => (
              <DisputeCard
                key={d.id}
                dispute={d}
                evidence=""
                onEvidenceChange={() => {}}
                onRespond={() => {}}
                onDefaultSettle={() => {}}
                isPending={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Settled */}
      {settled.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <SectionLabel>Settled · {settled.length}</SectionLabel>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {settled.map((d: any) => (
              <DisputeCard
                key={d.id}
                dispute={d}
                evidence=""
                onEvidenceChange={() => {}}
                onRespond={() => {}}
                onDefaultSettle={() => {}}
                isPending={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!disputes?.length && (
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
            // no disputes found
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--fg-muted)",
              margin: "8px 0 0",
            }}
          >
            When a subscriber disputes a stream, it will appear here with a response window.
          </p>
        </div>
      )}
    </div>
  );
}
