"use client";

import { use, useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlanById } from "@/lib/envio";
import { ADDRESSES, STREAM_MANAGER_ABI, USDC_ABI } from "@/lib/contracts";
import { WalletButton } from "@/components/WalletButton";

const SECONDS_PER_MONTH = 86400 * 30;
const USDC_DECIMALS = 1_000_000;

function rateToMonthly(rateWei: string) {
  return (Number(rateWei) / USDC_DECIMALS) * SECONDS_PER_MONTH;
}

export default function SubscribePage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [months, setMonths] = useState(1);
  const [step, setStep] = useState<"idle" | "approving" | "subscribing" | "done">("idle");
  const [streamId, setStreamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: plan, isLoading } = useQuery({
    queryKey: ["plan", planId],
    queryFn: () => getPlanById(planId),
  });

  const { data: usdcBalance } = useReadContract({
    address: ADDRESSES.USDC,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading plan…</p>
      </div>
    );
  }

  if (!plan || !plan.active) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold text-white">Plan not found</p>
          <p className="text-gray-400">This subscription plan doesn't exist or is no longer active.</p>
        </div>
      </div>
    );
  }

  const monthlyPrice = rateToMonthly(plan.ratePerSecond);
  const depositUsdc = monthlyPrice * months;
  const depositWei = BigInt(Math.floor(depositUsdc * USDC_DECIMALS));
  const ratePerSecond = Number(plan.ratePerSecond) / USDC_DECIMALS;
  const balanceUsdc = usdcBalance ? Number(usdcBalance) / USDC_DECIMALS : null;
  const hasEnoughBalance = balanceUsdc !== null && balanceUsdc >= depositUsdc;

  async function handleSubscribe() {
    if (!address) return;
    setError(null);
    try {
      setStep("approving");
      await writeContractAsync({
        address: ADDRESSES.USDC,
        abi: USDC_ABI,
        functionName: "approve",
        args: [ADDRESSES.StreamManager, depositWei],
      });

      setStep("subscribing");
      const result = await writeContractAsync({
        address: ADDRESSES.StreamManager,
        abi: STREAM_MANAGER_ABI,
        functionName: "createStream",
        args: [BigInt(planId), depositWei],
      });

      setStreamId(result ?? null);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setStep("idle");
    }
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-green-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="text-4xl">✓</div>
          <h1 className="text-xl font-semibold text-white">Subscribed!</h1>
          <p className="text-gray-400 text-sm">
            Your stream is live. You're being charged{" "}
            <span className="text-white">${ratePerSecond.toFixed(6)} USDC/s</span> and can cancel anytime.
          </p>
          {streamId && (
            <p className="text-xs text-gray-500 font-mono">Stream ID: {streamId}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full space-y-6">

        {/* Plan header */}
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Subscription Plan #{planId}</p>
          <h1 className="text-3xl font-bold text-white">
            ${monthlyPrice.toFixed(2)}
            <span className="text-lg font-normal text-gray-400">/mo</span>
          </h1>
          <p className="text-sm text-gray-400">
            Billed per-second · ${ratePerSecond.toFixed(6)} USDC/s · Cancel anytime
          </p>
        </div>

        <div className="border-t border-gray-800" />

        {/* What you get */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-300">Billing details</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400">Daily</p>
              <p className="text-white font-medium">${(monthlyPrice / 30).toFixed(2)}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400">Monthly</p>
              <p className="text-white font-medium">${monthlyPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Deposit selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Initial deposit
            <span className="text-gray-500 font-normal ml-1">(how many months upfront)</span>
          </label>
          <div className="flex gap-2">
            {[1, 3, 6].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  months === m
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                }`}
              >
                {m}mo
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400">
            Deposit: <span className="text-white font-medium">${depositUsdc.toFixed(2)} USDC</span>
            {balanceUsdc !== null && (
              <span className={`ml-2 text-xs ${hasEnoughBalance ? "text-green-400" : "text-red-400"}`}>
                (balance: ${balanceUsdc.toFixed(2)})
              </span>
            )}
          </p>
        </div>

        {/* CTA */}
        {!isConnected ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 text-center">Connect your wallet to subscribe</p>
            <div className="flex justify-center">
              <WalletButton />
            </div>
          </div>
        ) : !hasEnoughBalance ? (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-300 text-center">
            Insufficient USDC balance. You need ${depositUsdc.toFixed(2)} USDC.
          </div>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={isPending || step !== "idle"}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors text-sm"
          >
            {step === "approving" && "Step 1/2: Approving USDC…"}
            {step === "subscribing" && "Step 2/2: Creating stream…"}
            {step === "idle" && `Subscribe · $${depositUsdc.toFixed(2)} USDC`}
          </button>
        )}

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}

        <p className="text-xs text-gray-600 text-center">
          Powered by TrustFlow · funds stream per-second onchain
        </p>
      </div>
    </div>
  );
}
