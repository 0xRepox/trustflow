"use client";

import { use, useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlanById } from "@/lib/envio";
import { ADDRESSES, STREAM_MANAGER_ABI, USDC_ABI } from "@/lib/contracts";
import { WalletButton } from "@/components/WalletButton";
import Link from "next/link";

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
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)" }}>Loading plan…</p>
      </div>
    );
  }

  if (!plan || !plan.active) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Plan not found</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)", margin: 0 }}>
            This subscription plan doesn&apos;t exist or is no longer active.
          </p>
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
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div style={{
          background: "var(--surface)", border: "1px solid rgba(76,175,125,0.35)",
          borderRadius: 16, padding: "36px 32px", maxWidth: 420, width: "100%", textAlign: "center",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: "rgba(76,175,125,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#4CAF7D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Subscribed!
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", margin: "0 0 18px" }}>
            Your stream is live. You&apos;re charged{" "}
            <span style={{ color: "#fff" }}>${ratePerSecond.toFixed(6)} USDC/s</span> and can cancel anytime.
          </p>
          {streamId && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", margin: "0 0 20px" }}>
              Stream ID: {streamId}
            </p>
          )}
          <Link href="/account" style={{
            display: "block", background: "var(--elevated)",
            border: "1px solid rgba(172,198,233,0.2)", borderRadius: 10,
            padding: "10px 0", fontFamily: "var(--font-heading)",
            fontSize: 13, fontWeight: 500, color: "var(--fg2)", textDecoration: "none",
          }}>
            Manage subscription →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "32px", maxWidth: 420, width: "100%",
        boxShadow: "var(--shadow-card)",
      }}>
        {/* Header */}
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--label)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>
          {"{SUBSCRIPTION PLAN #"}{planId}{"}"}
        </p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 36, fontWeight: 700, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
          ${monthlyPrice.toFixed(2)}
          <span style={{ fontSize: 16, fontWeight: 400, color: "var(--fg-muted)" }}>/mo</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", margin: "0 0 20px" }}>
          Billed per-second · ${ratePerSecond.toFixed(6)} USDC/s · Cancel anytime
        </p>

        <div style={{ height: 1, background: "var(--border)", margin: "0 0 20px" }} />

        {/* Billing breakdown */}
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "0 0 8px", fontWeight: 500 }}>Billing details</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            ["Daily",   `$${(monthlyPrice / 30).toFixed(2)}`],
            ["Monthly", `$${monthlyPrice.toFixed(2)}`],
          ].map(([l, v]) => (
            <div key={l} style={{ background: "var(--elevated)", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-muted)", margin: 0 }}>{l}</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 500, color: "#fff", margin: "2px 0 0" }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Deposit selector */}
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "0 0 8px", fontWeight: 500 }}>
          Initial deposit <span style={{ fontWeight: 400 }}>(months upfront)</span>
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[1, 3, 6].map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8,
                border: months === m ? "1px solid rgba(56,152,236,0.6)" : "1px solid rgba(172,198,233,0.15)",
                background: months === m ? "rgba(56,152,236,0.12)" : "var(--elevated)",
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                color: months === m ? "#3898EC" : "var(--fg-muted)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {m}mo
            </button>
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", margin: "0 0 20px" }}>
          Deposit:{" "}
          <span style={{ color: "#fff", fontWeight: 500 }}>${depositUsdc.toFixed(2)} USDC</span>
          {balanceUsdc !== null && (
            <span style={{ marginLeft: 8, fontSize: 12, color: hasEnoughBalance ? "var(--success)" : "var(--error)" }}>
              (balance: ${balanceUsdc.toFixed(2)})
            </span>
          )}
        </p>

        {/* CTA */}
        {!isConnected ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", margin: "0 0 12px" }}>
              Connect your wallet to subscribe
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <WalletButton />
            </div>
          </div>
        ) : !hasEnoughBalance ? (
          <div style={{
            background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)",
            borderRadius: 10, padding: "12px", textAlign: "center",
          }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--error)", margin: 0 }}>
              Insufficient USDC. You need ${depositUsdc.toFixed(2)} USDC.
            </p>
          </div>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={isPending || step !== "idle"}
            style={{
              width: "100%", background: step === "idle" ? "var(--cta)" : "rgba(56,152,236,0.5)",
              border: "none", borderRadius: 10, padding: "12px 0",
              fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 500,
              color: "#fff", cursor: step === "idle" ? "pointer" : "not-allowed",
              transition: "background 0.15s",
            }}
          >
            {step === "approving" && "Step 1/2: Approving USDC…"}
            {step === "subscribing" && "Step 2/2: Creating stream…"}
            {step === "idle" && `Subscribe · $${depositUsdc.toFixed(2)} USDC`}
          </button>
        )}

        {error && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--error)", textAlign: "center", margin: "10px 0 0" }}>
            {error}
          </p>
        )}

        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", textAlign: "center", margin: "16px 0 0" }}>
          Powered by TrustFlow · funds stream per-second onchain
        </p>
      </div>
    </div>
  );
}
