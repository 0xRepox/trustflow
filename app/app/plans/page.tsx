"use client";

import { useState, useMemo } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner } from "@/lib/envio";
import { ADDRESSES, PLAN_REGISTRY_ABI } from "@/lib/contracts";

const SECONDS_PER_DAY = 86400;
const SECONDS_PER_MONTH = SECONDS_PER_DAY * 30;
const USDC_DECIMALS = 1_000_000;

function rateToMonthly(rateWei: string): string {
  const monthly = (Number(rateWei) / USDC_DECIMALS) * SECONDS_PER_MONTH;
  return monthly.toFixed(2);
}

function monthlyToRateWei(monthly: number): bigint {
  return BigInt(Math.floor((monthly * USDC_DECIMALS) / SECONDS_PER_MONTH));
}

function RatePreview({ monthlyUsdc }: { monthlyUsdc: number }) {
  if (!monthlyUsdc || monthlyUsdc <= 0) return null;
  const rateWei = monthlyToRateWei(monthlyUsdc);
  const daily = (monthlyUsdc / 30).toFixed(2);
  const weekly = (monthlyUsdc / 4.33).toFixed(2);

  return (
    <div className="bg-gray-800/60 rounded-lg p-3 space-y-1.5 text-xs">
      <p className="text-gray-400 font-medium uppercase tracking-wide text-[10px]">Billing breakdown</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-800 rounded p-2 text-center">
          <p className="text-gray-400">Daily</p>
          <p className="text-white font-medium">${daily}</p>
        </div>
        <div className="bg-gray-800 rounded p-2 text-center">
          <p className="text-gray-400">Weekly</p>
          <p className="text-white font-medium">${weekly}</p>
        </div>
        <div className="bg-gray-800 rounded p-2 text-center">
          <p className="text-gray-400">Monthly</p>
          <p className="text-white font-medium">${monthlyUsdc.toFixed(2)}</p>
        </div>
      </div>
      <p className="text-gray-500 text-[10px]">
        Rate: {rateWei.toString()} USDC wei/s
        &nbsp;·&nbsp;{((monthlyUsdc * USDC_DECIMALS) / SECONDS_PER_MONTH).toFixed(4)} USDC/s
      </p>
    </div>
  );
}

export default function PlansPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [monthlyUsdc, setMonthlyUsdc] = useState("");
  const [grace, setGrace] = useState("0");
  const [policy, setPolicy] = useState("0");
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const monthly = useMemo(() => parseFloat(monthlyUsdc) || 0, [monthlyUsdc]);
  const rateWei = useMemo(() => monthlyToRateWei(monthly), [monthly]);

  const { data: plans, refetch } = useQuery({
    queryKey: ["plans", address],
    queryFn: () => getPlansByOwner(address!),
    enabled: !!address,
  });

  async function handleCreate() {
    if (!monthly || rateWei === 0n) return;
    try {
      setTxStatus("Sending transaction…");
      await writeContractAsync({
        address: ADDRESSES.PlanRegistry,
        abi: PLAN_REGISTRY_ABI,
        functionName: "createPlan",
        args: [rateWei, Number(grace), Number(policy)],
      });
      setTxStatus("Plan created!");
      setMonthlyUsdc("");
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
          <label className="text-sm text-gray-400">Monthly price (USDC)</label>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-sm"
              value={monthlyUsdc}
              onChange={(e) => setMonthlyUsdc(e.target.value)}
              placeholder="e.g. 29.99"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <RatePreview monthlyUsdc={monthly} />

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-gray-400">Grace period (days)</label>
            <input
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={grace}
              onChange={(e) => setGrace(String(Number(e.target.value) * SECONDS_PER_DAY))}
              placeholder="0"
              type="number"
              min="0"
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
          disabled={isPending || !monthly || rateWei === 0n}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {isPending ? "Waiting…" : "Create Plan"}
        </button>
        {txStatus && <p className="text-xs text-gray-400">{txStatus}</p>}
      </div>

      <div className="space-y-3">
        {plans?.map((plan) => (
          <div key={plan.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Plan #{plan.id}</p>
                <p className="text-xs text-gray-400">
                  ${rateToMonthly(plan.ratePerSecond)}/mo
                  &nbsp;·&nbsp;{plan.active ? "Active" : "Inactive"}
                </p>
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
            {plan.active && (
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400 truncate flex-1">
                  {typeof window !== "undefined" ? window.location.origin : ""}/subscribe/{plan.id}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/subscribe/${plan.id}`)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0"
                >
                  Copy link
                </button>
              </div>
            )}
          </div>
        ))}
        {plans?.length === 0 && <p className="text-sm text-gray-400">No plans yet.</p>}
      </div>
    </div>
  );
}
