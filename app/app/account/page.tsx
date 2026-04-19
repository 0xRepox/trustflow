"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContracts } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getStreamsByPayer, getPlanById, type Stream, type Plan } from "@/lib/envio";
import { ADDRESSES, STREAM_MANAGER_ABI, USDC_ABI } from "@/lib/contracts";
import { WalletButton } from "@/components/WalletButton";

const USDC_DECIMALS = 1_000_000;
const SECONDS_PER_MONTH = 86400 * 30;

function rateToMonthly(ratePerSecond: string) {
  return (Number(ratePerSecond) / USDC_DECIMALS) * SECONDS_PER_MONTH;
}

function StreamCard({ stream, plan, onCancel, onTopUp, isActing }: {
  stream: Stream;
  plan: Plan | null;
  onCancel: (id: string) => void;
  onTopUp: (id: string, amount: number) => void;
  isActing: boolean;
}) {
  const [topUpMonths, setTopUpMonths] = useState(1);
  const [showTopUp, setShowTopUp] = useState(false);

  const deposited = Number(stream.deposited) / USDC_DECIMALS;
  const consumed = Number(stream.consumed) / USDC_DECIMALS;
  const remaining = deposited - consumed;
  const pct = deposited > 0 ? Math.min((consumed / deposited) * 100, 100) : 0;
  const monthlyPrice = plan ? rateToMonthly(plan.ratePerSecond) : 0;
  const topUpAmount = monthlyPrice * topUpMonths;
  const isActive = stream.status === "Active";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-mono">Stream #{stream.id}</p>
          <p className="text-sm font-medium mt-0.5">
            Plan #{stream.planId}
            {plan && (
              <span className="text-gray-400 font-normal ml-2">
                ${monthlyPrice.toFixed(2)}/mo
              </span>
            )}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isActive ? "bg-green-900/60 text-green-300" :
          stream.status === "Cancelled" ? "bg-gray-800 text-gray-500" :
          "bg-yellow-900/60 text-yellow-300"
        }`}>
          {stream.status}
        </span>
      </div>

      {/* Balance bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Consumed: ${consumed.toFixed(2)}</span>
          <span>Remaining: <span className={remaining < monthlyPrice * 0.5 ? "text-yellow-400" : "text-green-400"}>${remaining.toFixed(2)}</span></span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-blue-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-600">
          Deposit: ${deposited.toFixed(2)} · {pct.toFixed(0)}% consumed
        </p>
      </div>

      {/* Actions */}
      {isActive && (
        <div className="space-y-2">
          {/* Top-up section */}
          {showTopUp ? (
            <div className="bg-gray-800 rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-400 font-medium">Add deposit</p>
              <div className="flex gap-2">
                {[1, 3, 6].map((m) => (
                  <button
                    key={m}
                    onClick={() => setTopUpMonths(m)}
                    className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                      topUpMonths === m
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {m}mo
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Adding <span className="text-white font-medium">${topUpAmount.toFixed(2)} USDC</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onTopUp(stream.id, topUpAmount)}
                  disabled={isActing}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium py-2 rounded transition-colors"
                >
                  {isActing ? "Confirming…" : "Confirm top-up"}
                </button>
                <button
                  onClick={() => setShowTopUp(false)}
                  className="px-3 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowTopUp(true)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-medium py-2 rounded-lg transition-colors"
              >
                Top up
              </button>
              <button
                onClick={() => onCancel(stream.id)}
                disabled={isActing}
                className="flex-1 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 disabled:opacity-50 text-red-400 hover:text-red-300 text-xs font-medium py-2 rounded-lg transition-colors"
              >
                {isActing ? "Cancelling…" : "Cancel stream"}
              </button>
            </div>
          )}
        </div>
      )}

      {stream.status === "Cancelled" && (
        <p className="text-xs text-gray-600">
          Cancelled · ${remaining.toFixed(2)} returned to your wallet
        </p>
      )}
    </div>
  );
}

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [actingId, setActingId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const { data: streams, refetch } = useQuery({
    queryKey: ["my-streams", address],
    queryFn: () => getStreamsByPayer(address!),
    enabled: !!address,
  });

  // Load plan details for each unique planId
  const planIds = [...new Set(streams?.map((s) => s.planId) ?? [])];
  const { data: plans } = useQuery({
    queryKey: ["plans-for-streams", planIds],
    queryFn: () => Promise.all(planIds.map((id) => getPlanById(id))),
    enabled: planIds.length > 0,
  });
  const planMap = Object.fromEntries(
    (plans ?? []).filter(Boolean).map((p) => [p!.id, p!])
  );

  async function handleCancel(streamId: string) {
    try {
      setActingId(streamId);
      setTxStatus("Cancelling stream…");
      await writeContractAsync({
        address: ADDRESSES.StreamManager,
        abi: STREAM_MANAGER_ABI,
        functionName: "cancel",
        args: [BigInt(streamId)],
      });
      setTxStatus("Stream cancelled. Unspent USDC returned to your wallet.");
      refetch();
    } catch (e) {
      setTxStatus(`Error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setActingId(null);
    }
  }

  async function handleTopUp(streamId: string, amountUsdc: number) {
    const amountWei = BigInt(Math.floor(amountUsdc * USDC_DECIMALS));
    try {
      setActingId(streamId);
      setTxStatus("Step 1/2: Approving USDC…");
      await writeContractAsync({
        address: ADDRESSES.USDC,
        abi: USDC_ABI,
        functionName: "approve",
        args: [ADDRESSES.StreamManager, amountWei],
      });
      setTxStatus("Step 2/2: Topping up…");
      await writeContractAsync({
        address: ADDRESSES.StreamManager,
        abi: STREAM_MANAGER_ABI,
        functionName: "topUp",
        args: [BigInt(streamId), amountWei],
      });
      setTxStatus("Top-up complete!");
      refetch();
    } catch (e) {
      setTxStatus(`Error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setActingId(null);
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <p className="text-gray-400">Connect your wallet to view your subscriptions.</p>
        <WalletButton />
      </div>
    );
  }

  const active = streams?.filter((s) => s.status === "Active") ?? [];
  const inactive = streams?.filter((s) => s.status !== "Active") ?? [];

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold">My Subscriptions</h1>
        <p className="text-sm text-gray-400 mt-1">
          {active.length} active · {inactive.length} past
        </p>
      </div>

      {txStatus && (
        <p className={`text-xs px-3 py-2 rounded-lg border ${
          txStatus.startsWith("Error")
            ? "text-red-400 border-red-800 bg-red-900/20"
            : "text-gray-300 border-gray-700 bg-gray-800"
        }`}>{txStatus}</p>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          {active.map((s) => (
            <StreamCard
              key={s.id}
              stream={s}
              plan={planMap[s.planId] ?? null}
              onCancel={handleCancel}
              onTopUp={handleTopUp}
              isActing={actingId === s.id}
            />
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Past</h2>
          {inactive.map((s) => (
            <StreamCard
              key={s.id}
              stream={s}
              plan={planMap[s.planId] ?? null}
              onCancel={handleCancel}
              onTopUp={handleTopUp}
              isActing={actingId === s.id}
            />
          ))}
        </div>
      )}

      {streams?.length === 0 && (
        <p className="text-sm text-gray-400">No subscriptions found for this wallet.</p>
      )}
    </div>
  );
}
