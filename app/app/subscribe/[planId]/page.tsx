"use client";

import { use, useState, useMemo, useEffect, Suspense } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { getPlanById } from "@/lib/envio";
import { ADDRESSES, STREAM_MANAGER_ABI, USDC_ABI } from "@/lib/contracts";
import { WalletButton } from "@/components/WalletButton";
import Link from "next/link";

function isSafeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const USDC_DECIMALS = 1_000_000;
const SECONDS_PER_MONTH = 86400 * 30;
const SECONDS_PER_HOUR = 3600;

type RunwayTier = { key: string; label: string; seconds: number; runwayLabel: string };

function getDisplayConfig(monthlyPrice: number): {
  unit: string;
  displayPrice: number;
  runways: RunwayTier[];
} {
  // $200+/mo → hourly billing territory (GPU/API: $0.28+/hr). $2/hr = $1440/mo.
  if (monthlyPrice >= 200) {
    const perHour = monthlyPrice / (30 * 24);
    return {
      unit: "/hr",
      displayPrice: perHour,
      runways: [
        { key: "4h",  label: "4 hours",  seconds: SECONDS_PER_HOUR * 4,  runwayLabel: "4 hr runway"  },
        { key: "24h", label: "24 hours", seconds: SECONDS_PER_HOUR * 24, runwayLabel: "1 day runway" },
        { key: "1w",  label: "1 week",   seconds: 86400 * 7,             runwayLabel: "7 day runway" },
      ],
    };
  }
  if (monthlyPrice >= 20) {
    return {
      unit: "/mo",
      displayPrice: monthlyPrice,
      runways: [
        { key: "1w",  label: "1 week",   seconds: 86400 * 7,  runwayLabel: "7 day runway"  },
        { key: "1mo", label: "1 month",  seconds: 86400 * 30, runwayLabel: "30 day runway" },
        { key: "3mo", label: "3 months", seconds: 86400 * 90, runwayLabel: "3 mo runway"   },
      ],
    };
  }
  if (monthlyPrice >= 5) {
    return {
      unit: "/mo",
      displayPrice: monthlyPrice,
      runways: [
        { key: "2w",  label: "2 weeks",  seconds: 86400 * 14, runwayLabel: "14 day runway" },
        { key: "1mo", label: "1 month",  seconds: 86400 * 30, runwayLabel: "30 day runway" },
        { key: "3mo", label: "3 months", seconds: 86400 * 90, runwayLabel: "3 mo runway"   },
      ],
    };
  }
  if (monthlyPrice >= 1) {
    return {
      unit: "/mo",
      displayPrice: monthlyPrice,
      runways: [
        { key: "1mo", label: "1 month",  seconds: 86400 * 30,  runwayLabel: "30 day runway" },
        { key: "3mo", label: "3 months", seconds: 86400 * 90,  runwayLabel: "3 mo runway"  },
        { key: "6mo", label: "6 months", seconds: 86400 * 180, runwayLabel: "6 mo runway"  },
      ],
    };
  }
  // < $1/mo → show annualized price
  return {
    unit: "/yr",
    displayPrice: monthlyPrice * 12,
    runways: [
      { key: "3mo", label: "3 months", seconds: 86400 * 90,  runwayLabel: "3 mo runway" },
      { key: "6mo", label: "6 months", seconds: 86400 * 180, runwayLabel: "6 mo runway" },
      { key: "1yr", label: "1 year",   seconds: 86400 * 365, runwayLabel: "1 yr runway" },
    ],
  };
}

function SubscribeInner({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawSuccess = searchParams.get("success") ?? "";
  const successUrl = isSafeRedirectUrl(rawSuccess) ? rawSuccess : null;

  const [runway, setRunway] = useState("1w");
  const [step, setStep] = useState<"idle" | "approving" | "subscribing" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

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

  const ratePerSecond = plan ? Number(plan.ratePerSecond) / USDC_DECIMALS : 0;
  const monthlyPrice  = ratePerSecond * SECONDS_PER_MONTH;
  const balanceUsdc   = usdcBalance ? Number(usdcBalance) / USDC_DECIMALS : null;

  const { unit, displayPrice, runways } = useMemo(
    () => getDisplayConfig(monthlyPrice),
    [monthlyPrice]
  );

  // Reset runway selection when the tier changes (different key set)
  useEffect(() => {
    if (runways.length > 0 && !runways.find((r) => r.key === runway)) {
      setRunway(runways[0].key);
    }
  }, [runways, runway]);

  // Auto-redirect countdown after successful payment
  useEffect(() => {
    if (step !== "done" || !successUrl) return;
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(interval);
          router.push(successUrl);
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, successUrl, router]);

  const options = useMemo(() =>
    runways.map((r) => ({
      ...r,
      cost: ratePerSecond * r.seconds,
      costWei: BigInt(Math.floor(ratePerSecond * r.seconds * USDC_DECIMALS)),
      canAfford: balanceUsdc !== null ? balanceUsdc >= ratePerSecond * r.seconds : true,
    })),
    [ratePerSecond, balanceUsdc, runways]
  );

  const selected   = options.find((o) => o.key === runway) ?? options[0];
  const cheapest   = options.find((o) => o.canAfford);
  const canAfford  = selected.canAfford;

  // If selected tier unaffordable, auto-hint cheapest affordable
  const balanceHint = useMemo(() => {
    if (balanceUsdc === null || canAfford) return null;
    if (!cheapest) return `You have $${balanceUsdc.toFixed(2)} USDC — not enough for any tier. Add funds to continue.`;
    return `You have $${balanceUsdc.toFixed(2)} USDC. Try the ${cheapest.label} deposit ($${cheapest.cost.toFixed(2)}) instead.`;
  }, [balanceUsdc, canAfford, cheapest]);

  async function handleSubscribe() {
    if (!address || !canAfford) return;
    setError(null);
    try {
      setStep("approving");
      await writeContractAsync({
        address: ADDRESSES.USDC,
        abi: USDC_ABI,
        functionName: "approve",
        args: [ADDRESSES.StreamManager, selected.costWei],
      });

      setStep("subscribing");
      await writeContractAsync({
        address: ADDRESSES.StreamManager,
        abi: STREAM_MANAGER_ABI,
        functionName: "createStream",
        args: [BigInt(planId), selected.costWei],
      });

      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setStep("idle");
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={pageWrap}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)" }}>Loading plan…</p>
      </div>
    );
  }

  if (!plan || !plan.active) {
    return (
      <div style={pageWrap}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Plan not found</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)", margin: 0 }}>
            This plan doesn&apos;t exist or is no longer active.
          </p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div style={pageWrap}>
        <div style={{ ...card, border: "1px solid rgba(76,175,125,0.35)", textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: "rgba(76,175,125,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#4CAF7D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Streaming started
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", margin: "0 0 6px" }}>
            You&apos;re charged <span style={{ color: "#fff" }}>${ratePerSecond.toFixed(6)}/s</span>.
            Cancel anytime — unused deposit returns instantly.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", margin: "0 0 22px" }}>
            {selected.label} · ${selected.cost.toFixed(2)} deposited
          </p>
          {successUrl ? (
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "0 0 10px" }}>
                Redirecting to merchant in <span style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>{countdown}s</span>…
              </p>
              <button
                onClick={() => router.push(successUrl)}
                style={{
                  width: "100%", background: "var(--cta)", border: "none", borderRadius: 10,
                  padding: "10px 0", fontFamily: "var(--font-heading)", fontSize: 13,
                  fontWeight: 500, color: "#fff", cursor: "pointer",
                }}
              >
                Go now →
              </button>
            </div>
          ) : (
            <Link href="/account" style={{
              display: "block", background: "var(--elevated)",
              border: "1px solid var(--border)", borderRadius: 10,
              padding: "10px 0", fontFamily: "var(--font-heading)",
              fontSize: 13, fontWeight: 500, color: "var(--fg2)", textDecoration: "none",
            }}>
              Manage subscription →
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <div style={pageWrap}>
      <div style={card}>

        {/* Label */}
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--label)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px" }}>
          {"{SUBSCRIPTION PLAN #"}{planId}{"}"}
        </p>

        {/* Price hero */}
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.03em", lineHeight: 1 }}>
          ${displayPrice.toFixed(unit === "/hr" ? 4 : 2)}
          <span style={{ fontSize: 16, fontWeight: 400, color: "var(--fg-muted)" }}>{unit}</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", margin: "0 0 20px", lineHeight: 1.5 }}>
          Streaming at <span style={{ color: "var(--fg2)" }}>${ratePerSecond.toFixed(6)}/s</span>
          {" · "}cancel anytime
          {" · "}refund unused time instantly
        </p>

        <div style={{ height: 1, background: "var(--border)", margin: "0 0 22px" }} />

        {/* Runway selector */}
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--fg2)", margin: "0 0 10px" }}>
          How much to deposit?
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {options.map((o) => {
            const active = runway === o.key;
            const hinted = !canAfford && cheapest?.key === o.key;
            return (
              <button
                key={o.key}
                onClick={() => { setRunway(o.key); setError(null); }}
                style={{
                  flex: 1, padding: "12px 8px", borderRadius: 10, cursor: "pointer",
                  border: active
                    ? "1px solid rgba(56,152,236,0.6)"
                    : hinted
                    ? "1px solid rgba(76,175,125,0.5)"
                    : "1px solid var(--border)",
                  background: active
                    ? "rgba(56,152,236,0.1)"
                    : hinted
                    ? "rgba(76,175,125,0.06)"
                    : "var(--elevated)",
                  transition: "all 0.15s",
                  textAlign: "center",
                  opacity: !o.canAfford && !hinted ? 0.45 : 1,
                }}
              >
                <p style={{
                  fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 600,
                  color: active ? "var(--cta)" : hinted ? "var(--success)" : "#fff",
                  margin: "0 0 3px",
                }}>
                  ${o.cost.toFixed(2)}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-muted)", margin: "0 0 2px" }}>
                  {o.label}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", margin: 0 }}>
                  ~{o.runwayLabel}
                </p>
              </button>
            );
          })}
        </div>

        {/* Refund reassurance */}
        <div style={{
          background: "rgba(56,152,236,0.06)", border: "1px solid rgba(56,152,236,0.15)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 18,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <span style={{ color: "var(--cta)", fontSize: 15, lineHeight: 1, flexShrink: 0 }}>ⓘ</span>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: 0, lineHeight: 1.55 }}>
            You&apos;re only charged for time you use. Cancel early and your unused deposit returns to your wallet instantly — no waiting, no forms.
          </p>
        </div>

        {/* Balance hint / insufficient */}
        {balanceHint && (
          <div style={{
            background: "rgba(224,85,85,0.08)", border: "1px solid rgba(224,85,85,0.25)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 14,
          }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--error)", margin: 0, lineHeight: 1.5 }}>
              {balanceHint}
              {cheapest && !canAfford && (
                <button
                  onClick={() => setRunway(cheapest.key)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--success)", fontFamily: "var(--font-body)",
                    fontSize: 12, fontWeight: 500, padding: "0 0 0 6px", textDecoration: "underline",
                  }}
                >
                  Switch to {cheapest.label}
                </button>
              )}
            </p>
          </div>
        )}

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
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={isPending || step !== "idle" || !canAfford}
            style={{
              width: "100%",
              background: !canAfford ? "var(--elevated)" : step !== "idle" ? "rgba(56,152,236,0.5)" : "var(--cta)",
              border: "none", borderRadius: 10, padding: "13px 0",
              fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 500,
              color: !canAfford ? "var(--fg-subtle)" : "#fff",
              cursor: !canAfford || step !== "idle" ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {step === "approving"   && "Step 1/2 · Approving USDC…"}
            {step === "subscribing" && "Step 2/2 · Starting stream…"}
            {step === "idle" && (canAfford
              ? `Deposit $${selected.cost.toFixed(2)} · start streaming →`
              : "Insufficient USDC balance"
            )}
          </button>
        )}

        {error && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--error)", textAlign: "center", margin: "10px 0 0" }}>
            {error}
          </p>
        )}

      </div>
    </div>
  );
}

export default function SubscribePage({ params }: { params: Promise<{ planId: string }> }) {
  return (
    <Suspense fallback={
      <div style={pageWrap}>
        <div style={card}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)" }}>Loading plan…</p>
        </div>
      </div>
    }>
      <SubscribeInner params={params} />
    </Suspense>
  );
}

const pageWrap: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", width: "100%",
};

const card: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 16, padding: "32px", maxWidth: 420, width: "100%",
};
