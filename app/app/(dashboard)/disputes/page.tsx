"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner, getStreamsByPlanIds, getDisputesByMerchant } from "@/lib/envio";
import { ADDRESSES, DISPUTE_RESOLVER_ABI } from "@/lib/contracts";
import { keccak256, toBytes } from "viem";

const inputStyle: React.CSSProperties = {
  flex: 1, background: "var(--elevated)", border: "1px solid rgba(172,198,233,0.2)",
  borderRadius: 8, padding: "7px 12px", fontSize: 12, fontFamily: "var(--font-body)",
  color: "#fff", outline: "none",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px", color: "var(--label)" }}>
      {`{${children}}`}
    </p>
  );
}

const STATUS_BORDER: Record<string, string> = {
  Open:      "rgba(201,137,58,0.35)",
  Responded: "rgba(56,152,236,0.35)",
  Settled:   "rgba(172,198,233,0.1)",
};
const STATUS_COLOR: Record<string, string> = {
  Open:      "#C9893A",
  Responded: "#3898EC",
  Settled:   "var(--fg-subtle)",
};

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
    return <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)" }}>Connect your wallet to view disputes.</p>;
  }

  const open = disputes?.filter((d) => d.status === "Open") ?? [];
  const responded = disputes?.filter((d) => d.status === "Responded") ?? [];
  const settled = disputes?.filter((d) => d.status === "Settled") ?? [];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Disputes</h1>

      {txStatus && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: txStatus.startsWith("Error") ? "var(--error)" : "var(--fg-muted)", marginBottom: 16 }}>
          {txStatus}
        </p>
      )}

      {open.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Open · {open.length}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {open.map((d) => (
              <div key={d.id} style={{
                background: "var(--surface)", border: `1px solid ${STATUS_BORDER.Open}`,
                borderRadius: 12, padding: "14px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg2)", margin: 0 }}>
                      Dispute #{d.id} · Stream #{d.streamId}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "3px 0 0" }}>
                      Subscriber: {d.subscriber.slice(0, 10)}… · Frozen:{" "}
                      <span style={{ color: "#fff" }}>{(Number(d.frozenAmount) / 1e6).toFixed(2)} USDC</span>
                    </p>
                  </div>
                  <span style={{
                    background: "rgba(201,137,58,0.12)", color: STATUS_COLOR.Open,
                    borderRadius: 9999, padding: "3px 10px",
                    fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 500,
                  }}>Open</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={inputStyle}
                    placeholder="Evidence text (hashed onchain)"
                    value={evidenceInputs[d.id] ?? ""}
                    onChange={(e) => setEvidenceInputs((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => handleRespond(d.id)}
                    disabled={isPending && activeId === d.id}
                    style={{
                      background: "var(--cta)", border: "none", borderRadius: 8,
                      padding: "7px 14px", fontFamily: "var(--font-heading)",
                      fontSize: 12, fontWeight: 500, color: "#fff", cursor: "pointer",
                      opacity: isPending && activeId === d.id ? 0.5 : 1, flexShrink: 0,
                    }}
                  >
                    Respond
                  </button>
                  <button
                    onClick={() => handleDefaultSettle(d.id)}
                    disabled={isPending && activeId === d.id}
                    style={{
                      background: "var(--elevated)", border: "1px solid rgba(172,198,233,0.15)",
                      borderRadius: 8, padding: "7px 14px", fontFamily: "var(--font-heading)",
                      fontSize: 12, fontWeight: 500, color: "var(--fg-muted)", cursor: "pointer",
                      opacity: isPending && activeId === d.id ? 0.5 : 1, flexShrink: 0,
                    }}
                  >
                    Default Settle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {responded.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Responded · {responded.length}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {responded.map((d) => (
              <div key={d.id} style={{
                background: "var(--surface)", border: `1px solid ${STATUS_BORDER.Responded}`,
                borderRadius: 12, padding: "14px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg2)", margin: 0 }}>
                      Dispute #{d.id} · Stream #{d.streamId}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "3px 0 0" }}>
                      Frozen: <span style={{ color: "#fff" }}>{(Number(d.frozenAmount) / 1e6).toFixed(2)} USDC</span>
                    </p>
                  </div>
                  <span style={{
                    background: "rgba(56,152,236,0.12)", color: STATUS_COLOR.Responded,
                    borderRadius: 9999, padding: "3px 10px",
                    fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 500,
                  }}>Awaiting Arbitration</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {settled.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Settled · {settled.length}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {settled.map((d) => (
              <div key={d.id} style={{
                background: "var(--surface)", border: `1px solid ${STATUS_BORDER.Settled}`,
                borderRadius: 12, padding: "14px 18px", opacity: 0.6,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg2)", margin: 0 }}>
                    Dispute #{d.id} · Stream #{d.streamId}
                  </p>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-subtle)" }}>
                    Verdict: {d.verdict ?? "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!disputes?.length && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)" }}>No disputes found.</p>
      )}
    </div>
  );
}
