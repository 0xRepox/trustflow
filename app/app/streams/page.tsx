"use client";

import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner, getStreamsByPlanIds } from "@/lib/envio";
import { ADDRESSES, STREAM_MANAGER_ABI } from "@/lib/contracts";
import { useState } from "react";

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
    return <p className="text-gray-400">Connect your wallet to view streams.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Streams</h1>
      {txStatus && <p className="text-xs text-gray-400">{txStatus}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="pb-3 font-medium">Stream ID</th>
              <th className="pb-3 font-medium">Payer</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Deposited</th>
              <th className="pb-3 font-medium">Claimed</th>
              <th className="pb-3 font-medium">Claimable</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {streams?.map((stream) => {
              const claimable = BigInt(stream.consumed) - BigInt(stream.claimed);
              return (
                <tr key={stream.id} className="border-b border-gray-800/50 py-3">
                  <td className="py-3 font-mono">#{stream.id}</td>
                  <td className="py-3 font-mono text-gray-400">{stream.payer.slice(0, 8)}…</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      stream.status === "Active" ? "bg-green-900 text-green-300" :
                      stream.status === "Paused" ? "bg-yellow-900 text-yellow-300" :
                      "bg-gray-800 text-gray-400"
                    }`}>{stream.status}</span>
                  </td>
                  <td className="py-3">{(Number(stream.deposited) / 1e6).toFixed(2)}</td>
                  <td className="py-3">{(Number(stream.claimed) / 1e6).toFixed(2)}</td>
                  <td className="py-3 text-green-400">{(Number(claimable) / 1e6).toFixed(2)}</td>
                  <td className="py-3">
                    {claimable > 0n && stream.status !== "Cancelled" && (
                      <button
                        onClick={() => handleClaim(stream.id)}
                        disabled={isPending && claimingId === stream.id}
                        className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-1 rounded transition-colors"
                      >
                        Claim
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!streams || streams.length === 0) && (
          <p className="text-sm text-gray-400 py-6">No streams found for your plans.</p>
        )}
      </div>
    </div>
  );
}
