"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import {
  getStreamsByPayer, getPlanById, getDisputesBySubscriber,
  type Stream, type Plan, type Dispute,
} from "@/lib/envio";
import { ADDRESSES, STREAM_MANAGER_ABI, USDC_ABI, DISPUTE_RESOLVER_ABI } from "@/lib/contracts";
import { WalletButton } from "@/components/WalletButton";

const USDC_DECIMALS = 1_000_000;
const SECONDS_PER_MONTH = 86400 * 30;

function rateToMonthly(ratePerSecond: string) {
  return (Number(ratePerSecond) / USDC_DECIMALS) * SECONDS_PER_MONTH;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    Active:    { bg: "rgba(76,175,125,0.12)",  color: "var(--success)" },
    Disputed:  { bg: "rgba(201,137,58,0.12)",  color: "var(--label)"   },
    Paused:    { bg: "rgba(56,152,236,0.12)",  color: "var(--cta)"     },
    Cancelled: { bg: "rgba(172,198,233,0.06)", color: "var(--fg-muted)" },
    Depleted:  { bg: "rgba(172,198,233,0.06)", color: "var(--fg-muted)" },
  };
  const c = colors[status] ?? colors.Cancelled;
  return (
    <span style={{
      fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500,
      padding: "3px 8px", borderRadius: 6,
      background: c.bg, color: c.color,
    }}>
      {status}
    </span>
  );
}

function ConsumptionBar({ consumed, deposited, pct }: { consumed: number; deposited: number; pct: number }) {
  const barColor = pct > 80 ? "var(--error)" : pct > 50 ? "var(--label)" : "var(--cta)";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)" }}>
          Consumed: <span style={{ color: "var(--fg2)" }}>${consumed.toFixed(2)}</span>
        </span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)" }}>
          Deposit: <span style={{ color: "var(--fg2)" }}>${deposited.toFixed(2)}</span>
        </span>
      </div>
      <div style={{ height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 4, transition: "width 0.3s" }} />
      </div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", marginTop: 5 }}>
        {pct.toFixed(0)}% consumed
      </p>
    </div>
  );
}

function TopUpPanel({ monthly, onConfirm, onClose, isActing }: {
  monthly: number;
  onConfirm: (amount: number) => void;
  onClose: () => void;
  isActing: boolean;
}) {
  const [months, setMonths] = useState(1);
  const amount = monthly * months;
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500, color: "var(--fg2)", margin: "0 0 10px" }}>
        Add deposit
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[1, 3, 6].map((m) => (
          <button
            key={m}
            onClick={() => setMonths(m)}
            style={{
              flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer",
              border: months === m ? "1px solid rgba(56,152,236,0.6)" : "1px solid var(--border)",
              background: months === m ? "rgba(56,152,236,0.1)" : "var(--elevated)",
              fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 600,
              color: months === m ? "var(--cta)" : "var(--fg2)",
            }}
          >
            {m}mo
          </button>
        ))}
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-muted)", margin: "0 0 12px" }}>
        Adding <span style={{ color: "#fff", fontWeight: 500 }}>${amount.toFixed(2)} USDC</span>
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onConfirm(amount)}
          disabled={isActing}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
            background: isActing ? "rgba(56,152,236,0.4)" : "var(--cta)",
            fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 500,
            color: "#fff", cursor: isActing ? "not-allowed" : "pointer",
          }}
        >
          {isActing ? "Confirming…" : "Confirm top-up"}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "9px 14px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--elevated)", fontFamily: "var(--font-body)", fontSize: 12,
            color: "var(--fg-muted)", cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DisputePanel({ maxAmount, bondUsdc, onConfirm, onClose, isActing }: {
  maxAmount: number;
  bondUsdc: number;
  onConfirm: (amount: number) => void;
  onClose: () => void;
  isActing: boolean;
}) {
  const [value, setValue] = useState("");
  const parsed = parseFloat(value) || 0;
  const valid = parsed > 0 && parsed <= maxAmount;

  return (
    <div style={{
      background: "var(--bg)", border: "1px solid rgba(201,137,58,0.3)",
      borderRadius: 10, padding: "14px 16px",
    }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500, color: "var(--label)", margin: "0 0 6px" }}>
        Open Dispute
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
        Freeze funds you believe weren't delivered. Bond:{" "}
        <span style={{ color: "#fff" }}>${bondUsdc.toFixed(4)} USDC</span> — returned if upheld.
      </p>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <span style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-muted)",
        }}>$</span>
        <input
          type="number"
          min="0"
          max={maxAmount}
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={"up to $" + maxAmount.toFixed(2)}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "var(--elevated)", border: "1px solid " + (parsed > maxAmount ? "var(--error)" : "var(--border)"),
            borderRadius: 8, padding: "8px 10px 8px 22px",
            fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff",
            outline: "none",
          }}
        />
      </div>
      {parsed > maxAmount && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--error)", margin: "0 0 10px" }}>
          Max disputable: ${maxAmount.toFixed(2)}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          onClick={() => onConfirm(parsed)}
          disabled={isActing || !valid}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
            background: !valid || isActing ? "var(--elevated)" : "rgba(201,137,58,0.85)",
            fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 500,
            color: !valid || isActing ? "var(--fg-subtle)" : "#fff",
            cursor: !valid || isActing ? "not-allowed" : "pointer",
          }}
        >
          {isActing ? "Confirming…" : "Open dispute"}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "9px 14px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--elevated)", fontFamily: "var(--font-body)", fontSize: 12,
            color: "var(--fg-muted)", cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function StreamCard({ stream, plan, dispute, onCancel, onTopUp, onDispute, isActing }: {
  stream: Stream;
  plan: Plan | null;
  dispute: Dispute | null;
  onCancel: (id: string) => void;
  onTopUp: (id: string, amount: number) => void;
  onDispute: (id: string, amount: number) => void;
  isActing: boolean;
}) {
  const [mode, setMode] = useState<"idle" | "topup" | "dispute">("idle");

  const deposited  = Number(stream.deposited) / USDC_DECIMALS;
  const consumed   = Number(stream.consumed)  / USDC_DECIMALS;
  const claimed    = Number(stream.claimed)   / USDC_DECIMALS;
  const remaining  = deposited - consumed;
  const disputable = consumed - claimed;
  const pct        = deposited > 0 ? Math.min((consumed / deposited) * 100, 100) : 0;
  const monthly    = plan ? rateToMonthly(plan.ratePerSecond) : 0;
  const bondUsdc   = plan ? (Number(plan.ratePerSecond) / USDC_DECIMALS) * 86400 : 0;
  const isActive   = stream.status === "Active";
  const lowRunway  = remaining < monthly * 0.5 && isActive;

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "20px 22px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", letterSpacing: "0.08em", margin: "0 0 4px" }}>
            STREAM #{stream.id}
          </p>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>
            Plan #{stream.planId}
            {plan && (
              <span style={{ fontWeight: 400, color: "var(--fg-muted)", marginLeft: 8, fontSize: 13 }}>
                ${monthly.toFixed(2)}/mo
              </span>
            )}
          </p>
        </div>
        <StatusBadge status={stream.status} />
      </div>

      <ConsumptionBar consumed={consumed} deposited={deposited} pct={pct} />

      {isActive && (
        <p style={{
          fontFamily: "var(--font-body)", fontSize: 12, margin: "0 0 14px",
          color: lowRunway ? "var(--label)" : "var(--fg-muted)",
        }}>
          {lowRunway ? "⚠ " : ""}Remaining:{" "}
          <span style={{ color: lowRunway ? "var(--label)" : "var(--fg2)", fontWeight: 500 }}>
            ${remaining.toFixed(2)}
          </span>
          {monthly > 0 && (
            <span style={{ color: "var(--fg-subtle)" }}>
              {" "}(~{(remaining / (monthly / 30)).toFixed(1)} days)
            </span>
          )}
        </p>
      )}

      {dispute && (
        <div style={{
          borderRadius: 8, padding: "8px 12px", marginBottom: 12,
          background: dispute.status === "Settled" ? "rgba(172,198,233,0.04)" : "rgba(201,137,58,0.08)",
          border: "1px solid " + (dispute.status === "Settled" ? "var(--border)" : "rgba(201,137,58,0.3)"),
        }}>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: 12, margin: 0,
            color: dispute.status === "Settled" ? "var(--fg-muted)" : "var(--label)",
          }}>
            Dispute #{dispute.id} · {dispute.status}
            {dispute.verdict && dispute.verdict !== "Pending" && " · " + dispute.verdict}
          </p>
        </div>
      )}

      {isActive && mode === "topup" && (
        <div style={{ marginBottom: 10 }}>
          <TopUpPanel
            monthly={monthly}
            onConfirm={(amount) => { onTopUp(stream.id, amount); setMode("idle"); }}
            onClose={() => setMode("idle")}
            isActing={isActing}
          />
        </div>
      )}
      {isActive && mode === "dispute" && !dispute && (
        <div style={{ marginBottom: 10 }}>
          <DisputePanel
            maxAmount={disputable}
            bondUsdc={bondUsdc}
            onConfirm={(amount) => { onDispute(stream.id, amount); setMode("idle"); }}
            onClose={() => setMode("idle")}
            isActing={isActing}
          />
        </div>
      )}

      {isActive && mode === "idle" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMode("topup")} style={actionBtn}>Top up</button>
          {!dispute && disputable > 0 && (
            <button
              onClick={() => setMode("dispute")}
              style={{ ...actionBtn, border: "1px solid rgba(201,137,58,0.35)", color: "var(--label)" }}
            >
              Dispute
            </button>
          )}
          <button
            onClick={() => onCancel(stream.id)}
            disabled={isActing}
            style={{ ...actionBtn, border: "1px solid rgba(224,85,85,0.35)", color: "var(--error)", cursor: isActing ? "not-allowed" : "pointer", opacity: isActing ? 0.5 : 1 }}
          >
            {isActing ? "Cancelling…" : "Cancel"}
          </button>
        </div>
      )}

      {stream.status === "Cancelled" && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-subtle)", margin: 0 }}>
          ${remaining.toFixed(2)} returned to your wallet
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
  const [txError, setTxError]   = useState<string | null>(null);

  const { data: streams, refetch } = useQuery({
    queryKey: ["my-streams", address],
    queryFn: () => getStreamsByPayer(address!),
    enabled: !!address,
  });

  const planIds = [...new Set(streams?.map((s) => s.planId) ?? [])];
  const { data: plans } = useQuery({
    queryKey: ["plans-for-streams", planIds.join(",")],
    queryFn: () => Promise.all(planIds.map((id) => getPlanById(id))),
    enabled: planIds.length > 0,
  });
  const planMap = Object.fromEntries(
    (plans ?? []).filter(Boolean).map((p) => [p!.id, p!])
  );

  const { data: disputes, refetch: refetchDisputes } = useQuery({
    queryKey: ["my-disputes", address],
    queryFn: () => getDisputesBySubscriber(address!),
    enabled: !!address,
  });
  const disputeMap = Object.fromEntries(
    (disputes ?? []).map((d) => [d.streamId, d])
  );

  async function handleCancel(streamId: string) {
    setActingId(streamId); setTxStatus("Cancelling stream…"); setTxError(null);
    try {
      await writeContractAsync({
        address: ADDRESSES.StreamManager, abi: STREAM_MANAGER_ABI,
        functionName: "cancel", args: [BigInt(streamId)],
      });
      setTxStatus("Stream cancelled. Unspent USDC returned to your wallet.");
      refetch();
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus(null);
    } finally { setActingId(null); }
  }

  async function handleTopUp(streamId: string, amountUsdc: number) {
    const amountWei = BigInt(Math.floor(amountUsdc * USDC_DECIMALS));
    setActingId(streamId); setTxError(null);
    try {
      setTxStatus("Step 1/2 · Approving USDC…");
      await writeContractAsync({
        address: ADDRESSES.USDC, abi: USDC_ABI,
        functionName: "approve", args: [ADDRESSES.StreamManager, amountWei],
      });
      setTxStatus("Step 2/2 · Topping up…");
      await writeContractAsync({
        address: ADDRESSES.StreamManager, abi: STREAM_MANAGER_ABI,
        functionName: "topUp", args: [BigInt(streamId), amountWei],
      });
      setTxStatus("Top-up complete!");
      refetch();
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus(null);
    } finally { setActingId(null); }
  }

  async function handleDispute(streamId: string, amountUsdc: number) {
    const amountWei = BigInt(Math.floor(amountUsdc * USDC_DECIMALS));
    const stream = streams?.find((s) => s.id === streamId);
    const plan = stream ? planMap[stream.planId] : null;
    const bondWei = plan
      ? BigInt(Math.floor((Number(plan.ratePerSecond) / USDC_DECIMALS) * 86400 * USDC_DECIMALS))
      : BigInt(0);

    setActingId(streamId); setTxError(null);
    try {
      setTxStatus("Step 1/2 · Approving USDC for bond + freeze…");
      await writeContractAsync({
        address: ADDRESSES.USDC, abi: USDC_ABI,
        functionName: "approve", args: [ADDRESSES.DisputeResolver, amountWei + bondWei],
      });
      setTxStatus("Step 2/2 · Opening dispute…");
      await writeContractAsync({
        address: ADDRESSES.DisputeResolver, abi: DISPUTE_RESOLVER_ABI,
        functionName: "openDispute", args: [BigInt(streamId), amountWei],
      });
      setTxStatus("Dispute opened. Merchant has 7 days to respond.");
      refetch(); refetchDisputes();
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus(null);
    } finally { setActingId(null); }
  }

  if (!isConnected) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)" }}>
          Connect your wallet to view your subscriptions.
        </p>
        <WalletButton />
      </div>
    );
  }

  const active   = streams?.filter((s) => s.status === "Active") ?? [];
  const inactive = streams?.filter((s) => s.status !== "Active") ?? [];

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          My Subscriptions
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
          {active.length} active · {inactive.length} past
        </p>
      </div>

      {txStatus && (
        <div style={{ background: "rgba(56,152,236,0.06)", border: "1px solid rgba(56,152,236,0.18)", borderRadius: 8, padding: "10px 14px", marginBottom: 18 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg2)", margin: 0 }}>{txStatus}</p>
        </div>
      )}
      {txError && (
        <div style={{ background: "rgba(224,85,85,0.06)", border: "1px solid rgba(224,85,85,0.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 18 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--error)", margin: 0 }}>{txError}</p>
        </div>
      )}

      {active.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {active.map((s) => (
            <StreamCard key={s.id} stream={s} plan={planMap[s.planId] ?? null} dispute={disputeMap[s.id] ?? null}
              onCancel={handleCancel} onTopUp={handleTopUp} onDispute={handleDispute} isActing={actingId === s.id} />
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 12px" }}>
            Past
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {inactive.map((s) => (
              <StreamCard key={s.id} stream={s} plan={planMap[s.planId] ?? null} dispute={disputeMap[s.id] ?? null}
                onCancel={handleCancel} onTopUp={handleTopUp} onDispute={handleDispute} isActing={actingId === s.id} />
            ))}
          </div>
        </div>
      )}

      {streams?.length === 0 && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-muted)", textAlign: "center", marginTop: 60 }}>
          No subscriptions found for this wallet.
        </p>
      )}
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  flex: 1, padding: "9px 0", borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--elevated)",
  fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 500,
  color: "var(--fg2)", cursor: "pointer", transition: "border-color 0.15s",
};
