"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner } from "@/lib/envio";
import { ADDRESSES, PLAN_REGISTRY_ABI } from "@/lib/contracts";

export default function PlansPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [rate, setRate] = useState("");
  const [grace, setGrace] = useState("0");
  const [policy, setPolicy] = useState("0");
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const { data: plans, refetch } = useQuery({
    queryKey: ["plans", address],
    queryFn: () => getPlansByOwner(address!),
    enabled: !!address,
  });

  async function handleCreate() {
    if (!rate) return;
    try {
      setTxStatus("Sending transaction…");
      await writeContractAsync({
        address: ADDRESSES.PlanRegistry,
        abi: PLAN_REGISTRY_ABI,
        functionName: "createPlan",
        args: [BigInt(rate), Number(grace), Number(policy)],
      });
      setTxStatus("Plan created!");
      setRate("");
      refetch();
    } catch (e) {
      setTxStatus(`Error: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  async function handleDeactivate(planId: string) {
    try {
      setTxStatus("Deactivating…");
      await writeContractAsync({
        address: ADDRESSES.PlanRegistry,
        abi: PLAN_REGISTRY_ABI,
        functionName: "deactivatePlan",
        args: [BigInt(planId)],
      });
      setTxStatus("Plan deactivated.");
      refetch();
    } catch (e) {
      setTxStatus(`Error: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  if (!isConnected) {
    return <p className="text-gray-400">Connect your wallet to manage plans.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Plans</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 max-w-md">
        <h2 className="font-medium">Create Plan</h2>
        <div>
          <label className="text-sm text-gray-400">Rate per second (USDC wei)</label>
          <input
            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 100 = 100 USDC/s"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-gray-400">Grace period (s)</label>
            <input
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={grace}
              onChange={(e) => setGrace(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-gray-400">Dispute policy</label>
            <select
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={policy}
              onChange={(e) => setPolicy(e.target.value)}
            >
              <option value="0">None</option>
              <option value="1">Arbitration</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={isPending || !rate}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {isPending ? "Waiting…" : "Create Plan"}
        </button>
        {txStatus && <p className="text-xs text-gray-400">{txStatus}</p>}
      </div>

      <div className="space-y-3">
        {plans?.map((plan) => (
          <div key={plan.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Plan #{plan.id}</p>
              <p className="text-xs text-gray-400">{plan.ratePerSecond} USDC wei/s · {plan.active ? "Active" : "Inactive"}</p>
            </div>
            {plan.active && (
              <button
                onClick={() => handleDeactivate(plan.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Deactivate
              </button>
            )}
          </div>
        ))}
        {plans?.length === 0 && <p className="text-sm text-gray-400">No plans yet.</p>}
      </div>
    </div>
  );
}
