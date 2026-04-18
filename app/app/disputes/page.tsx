"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner, getStreamsByPlanIds, getDisputesByMerchant } from "@/lib/envio";
import { ADDRESSES, DISPUTE_RESOLVER_ABI } from "@/lib/contracts";
import { keccak256, toBytes } from "viem";

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
    return <p className="text-gray-400">Connect your wallet to view disputes.</p>;
  }

  const open = disputes?.filter((d) => d.status === "Open") ?? [];
  const responded = disputes?.filter((d) => d.status === "Responded") ?? [];
  const settled = disputes?.filter((d) => d.status === "Settled") ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Disputes</h1>
      {txStatus && <p className="text-xs text-gray-400">{txStatus}</p>}

      {open.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-yellow-400">Open ({open.length})</h2>
          {open.map((d) => (
            <div key={d.id} className="bg-gray-900 border border-yellow-800/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono">Dispute #{d.id} · Stream #{d.streamId}</p>
                <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded-full">Open</span>
              </div>
              <p className="text-xs text-gray-400">Subscriber: {d.subscriber.slice(0, 10)}… · Frozen: {(Number(d.frozenAmount) / 1e6).toFixed(2)} USDC</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs"
                  placeholder="Evidence (hashed onchain)"
                  value={evidenceInputs[d.id] ?? ""}
                  onChange={(e) => setEvidenceInputs((prev) => ({ ...prev, [d.id]: e.target.value }))}
                />
                <button
                  onClick={() => handleRespond(d.id)}
                  disabled={isPending && activeId === d.id}
                  className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-1.5 rounded transition-colors"
                >
                  Respond
                </button>
                <button
                  onClick={() => handleDefaultSettle(d.id)}
                  disabled={isPending && activeId === d.id}
                  className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1.5 rounded transition-colors"
                >
                  Default Settle
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {responded.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-blue-400">Responded ({responded.length})</h2>
          {responded.map((d) => (
            <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono">Dispute #{d.id} · Stream #{d.streamId}</p>
                <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full">Awaiting Arbitration</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Frozen: {(Number(d.frozenAmount) / 1e6).toFixed(2)} USDC</p>
            </div>
          ))}
        </section>
      )}

      {settled.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400">Settled ({settled.length})</h2>
          {settled.map((d) => (
            <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 opacity-60">
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono">Dispute #{d.id} · Stream #{d.streamId}</p>
                <span className="text-xs text-gray-400">Verdict: {d.verdict ?? "—"}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {!disputes?.length && (
        <p className="text-sm text-gray-400">No disputes found.</p>
      )}
    </div>
  );
}
