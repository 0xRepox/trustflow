"use client";

import { useState, useMemo } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner } from "@/lib/envio";
import { ADDRESSES, PLAN_REGISTRY_ABI } from "@/lib/contracts";

const USDC_DECIMALS = 1_000_000;
const SECONDS: Record<string, number> = {
  hourly:  3600,
  daily:   86400,
  weekly:  86400 * 7,
  monthly: 86400 * 30,
};
const PERIOD_LABELS: Record<string, string> = {
  hourly: "per hour", daily: "per day", weekly: "per week", monthly: "per month",
};

function periodToMonthly(amount: number, period: string) {
  return amount * (SECONDS.monthly / SECONDS[period]);
}

function rateWeiFromPeriod(amount: number, period: string): bigint {
  return BigInt(Math.floor((amount * USDC_DECIMALS) / SECONDS[period]));
}

function rateToMonthly(rateWei: string) {
  return (Number(rateWei) / USDC_DECIMALS) * SECONDS.monthly;
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--elevated)", border: "1px solid rgba(172,198,233,0.2)",
  borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "var(--font-body)",
  color: "#fff", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)",
  display: "block", marginBottom: 5,
};

function RatePreview({ amount, period }: { amount: number; period: string }) {
  if (!amount || amount <= 0) return null;
  const monthly = periodToMonthly(amount, period);
  return (
    <div style={{ background: "rgba(22,47,74,0.6)", borderRadius: 8, padding: "10px 12px", marginTop: 10 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--fg-subtle)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>Billing breakdown</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {[
          ["Hourly",   `$${(monthly / 720).toFixed(4)}`],
          ["Daily",    `$${(monthly / 30).toFixed(2)}`],
          ["Weekly",   `$${(monthly / 4.33).toFixed(2)}`],
          ["Monthly",  `$${monthly.toFixed(2)}`],
        ].map(([l, v]) => (
          <div key={l} style={{ background: "var(--elevated)", borderRadius: 6, padding: "8px 6px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--fg-muted)", margin: 0 }}>{l}</p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 500, color: "#fff", margin: "2px 0 0" }}>{v}</p>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", margin: "8px 0 0" }}>
        {rateWeiFromPeriod(amount, period).toString()} USDC wei/s
      </p>
    </div>
  );
}

export default function PlansPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [grace, setGrace] = useState("0");
  const [policy, setPolicy] = useState("0");
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const amountNum = useMemo(() => parseFloat(amount) || 0, [amount]);
  const rateWei = useMemo(() => rateWeiFromPeriod(amountNum, period), [amountNum, period]);

  const { data: plans, refetch } = useQuery({
    queryKey: ["plans", address],
    queryFn: () => getPlansByOwner(address!),
    enabled: !!address,
  });

  async function handleCreate() {
    if (!amountNum || rateWei === 0n) return;
    try {
      setTxStatus("Sending transaction…");
      await writeContractAsync({
        address: ADDRESSES.PlanRegistry,
        abi: PLAN_REGISTRY_ABI,
        functionName: "createPlan",
        args: [rateWei, Number(grace) * 86400, Number(policy)],
      });
      setTxStatus("Plan created!");
      setAmount("");
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
    return <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)" }}>Connect your wallet to manage plans.</p>;
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 0 28px", letterSpacing: "-0.02em" }}>Plans</h1>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" }}>
        {/* Create form */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 22 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 500, color: "#fff", margin: "0 0 16px" }}>Create plan</p>

          {/* Billing period selector */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Billing period</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {(["hourly", "daily", "weekly", "monthly"] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "7px 0", borderRadius: 6,
                  border: period === p ? "1px solid rgba(56,152,236,0.6)" : "1px solid rgba(172,198,233,0.15)",
                  background: period === p ? "rgba(56,152,236,0.12)" : "var(--elevated)",
                  fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500,
                  color: period === p ? "#3898EC" : "var(--fg-muted)",
                  cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
                }}>{p}</button>
              ))}
            </div>
          </div>

          {/* Price input */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Price {PERIOD_LABELS[period]} (USDC)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--fg-muted)", fontSize: 13 }}>$</span>
              <input style={{ ...inputStyle, paddingLeft: 22 }} type="number" placeholder="e.g. 29.99"
                value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
            </div>
          </div>

          <RatePreview amount={amountNum} period={period} />

          {/* Grace + policy */}
          <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Grace period (days)</label>
              <input style={inputStyle} type="number" placeholder="0" value={grace}
                onChange={(e) => setGrace(e.target.value)} min="0" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Dispute policy</label>
              <select style={inputStyle} value={policy} onChange={(e) => setPolicy(e.target.value)}>
                <option value="0">None</option>
                <option value="1">Arbitration</option>
              </select>
            </div>
          </div>

          <button onClick={handleCreate} disabled={isPending || !amountNum || rateWei === 0n} style={{
            width: "100%", background: amountNum && !isPending ? "var(--cta)" : "rgba(26,58,92,0.8)",
            border: "none", borderRadius: 8, padding: "9px 0",
            fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 500,
            color: amountNum && !isPending ? "#fff" : "var(--fg-subtle)",
            cursor: amountNum && !isPending ? "pointer" : "not-allowed",
            transition: "background 0.15s",
          }}>
            {isPending ? "Waiting…" : "Create plan"}
          </button>
          {txStatus && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: txStatus.startsWith("Error") ? "var(--error)" : "var(--success)", marginTop: 8, textAlign: "center" }}>
              {txStatus}
            </p>
          )}
        </div>

        {/* Plan list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {plans?.map((plan) => (
            <div key={plan.id} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "14px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: plan.active ? 10 : 0 }}>
                <div>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 500, color: "#fff", margin: 0 }}>
                    Plan #{plan.id}
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "2px 0 0" }}>
                    ${rateToMonthly(plan.ratePerSecond).toFixed(2)}/mo
                    {" · "}
                    <span style={{ color: plan.active ? "var(--success)" : "var(--fg-subtle)" }}>
                      {plan.active ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
                {plan.active && (
                  <button onClick={() => handleDeactivate(plan.id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-body)", fontSize: 12, color: "var(--error)",
                  }}>Deactivate</button>
                )}
              </div>
              {plan.active && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--elevated)", borderRadius: 8, padding: "8px 12px" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", flex: 1, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {typeof window !== "undefined" ? window.location.origin : ""}/subscribe/{plan.id}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/subscribe/${plan.id}`)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11, color: "var(--cta)", flexShrink: 0 }}
                  >
                    Copy link
                  </button>
                </div>
              )}
            </div>
          ))}
          {plans?.length === 0 && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)" }}>No plans yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
