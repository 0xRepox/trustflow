"use client";

import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner, getStreamsByPlanIds } from "@/lib/envio";
import { ADDRESSES, STREAM_MANAGER_ABI } from "@/lib/contracts";
import { useState } from "react";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Active:    { bg: "rgba(76,175,125,0.15)",   color: "#4CAF7D" },
  Paused:    { bg: "rgba(201,137,58,0.15)",    color: "#C9893A" },
  Cancelled: { bg: "rgba(74,111,140,0.15)",    color: "#7A9FC4" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Cancelled;
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 9999, padding: "3px 10px",
      fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 500,
    }}>{status}</span>
  );
}

export default function StreamsPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const { data: plans } = useQuery({
    queryKey: ["plans", address],
    queryFn: () => getPlansByOwner(address!),
    enabled: !!address,
  });

  const { data: streams, refetch } = useQuery({
    queryKey: ["streams", plans?.map((p) => p.id)],
    queryFn: () => getStreamsByPlanIds(plans!.map((p) => p.id)),
    enabled: !!plans?.length,
  });

  async function handleClaim(streamId: string) {
    try {
      setClaimingId(streamId);
      setTxStatus("Claiming…");
      await writeContractAsync({
        address: ADDRESSES.StreamManager,
        abi: STREAM_MANAGER_ABI,
        functionName: "claim",
        args: [BigInt(streamId)],
      });
      setTxStatus("Claimed!");
      refetch();
    } catch (e) {
      setTxStatus(`Error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setClaimingId(null);
    }
  }

  if (!isConnected) {
    return <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)" }}>Connect your wallet to view streams.</p>;
  }

  const thStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", fontWeight: 500,
    padding: "0 12px 12px 0", textAlign: "left",
    borderBottom: "1px solid rgba(172,198,233,0.1)",
  };
  const tdStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg2)",
    padding: "12px 12px 12px 0",
    borderBottom: "1px solid rgba(172,198,233,0.06)",
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Streams</h1>

      {txStatus && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: txStatus.startsWith("Error") ? "var(--error)" : "var(--fg-muted)", marginBottom: 16 }}>
          {txStatus}
        </p>
      )}

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto", padding: "0 22px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Stream ID", "Payer", "Status", "Deposited", "Claimed", "Claimable", ""].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {streams?.map((s) => {
                const claimable = BigInt(s.consumed) - BigInt(s.claimed);
                const claimableNum = Number(claimable) / 1e6;
                return (
                  <tr key={s.id}>
                    <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", color: "var(--fg2)" }}>#{s.id}</td>
                    <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>
                      {s.payer.slice(0, 10)}…
                    </td>
                    <td style={tdStyle}><StatusBadge status={s.status} /></td>
                    <td style={tdStyle}>{(Number(s.deposited) / 1e6).toFixed(2)}</td>
                    <td style={tdStyle}>{(Number(s.claimed) / 1e6).toFixed(2)}</td>
                    <td style={{ ...tdStyle, color: claimableNum > 0 ? "var(--success)" : "var(--fg-subtle)" }}>
                      {claimableNum.toFixed(2)}
                    </td>
                    <td style={tdStyle}>
                      {claimable > 0n && s.status !== "Cancelled" && (
                        <button
                          onClick={() => handleClaim(s.id)}
                          disabled={isPending && claimingId === s.id}
                          style={{
                            background: "var(--cta)", border: "none", borderRadius: 6,
                            padding: "5px 12px", fontFamily: "var(--font-heading)",
                            fontSize: 11, fontWeight: 500, color: "#fff", cursor: "pointer",
                            opacity: isPending && claimingId === s.id ? 0.5 : 1,
                          }}
                        >
                          {isPending && claimingId === s.id ? "…" : "Claim"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!streams || streams.length === 0) && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", padding: "24px 0" }}>
              No streams found for your plans.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
