"use client";

import { useState, useMemo, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner, getStreamsByPlanIds } from "@/lib/envio";
import { ADDRESSES, PLAN_REGISTRY_ABI } from "@/lib/contracts";
import { ConnectPrompt } from "@/components/ConnectPrompt";

const USDC_DECIMALS = 1_000_000;
const SECONDS: Record<string, number> = {
  hourly: 3600,
  daily: 86400,
  weekly: 86400 * 7,
  monthly: 86400 * 30,
};
const PERIOD_LABELS: Record<string, string> = {
  hourly: "per hour",
  daily: "per day",
  weekly: "per week",
  monthly: "per month",
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

// ============================================================================
// Shared tokens
// ============================================================================
const labelMono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "var(--label, #C9893A)",
  margin: 0,
};

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 20,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--elevated)",
  border: "1px solid rgba(172,198,233,0.2)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13,
  fontFamily: "var(--font-body)",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "var(--fg-muted)",
  display: "block",
  marginBottom: 5,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={labelMono}>{`{${children}}`}</p>;
}

function LivePulse({ color = "var(--success, #5AF0B8)" }: { color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: "pulse 1.4s ease-in-out infinite",
        marginRight: 8,
        verticalAlign: "middle",
      }}
    />
  );
}

// ============================================================================
// Billing breakdown preview
// ============================================================================
function RatePreview({ amount, period }: { amount: number; period: string }) {
  if (!amount || amount <= 0) return null;
  const monthly = periodToMonthly(amount, period);
  return (
    <div
      style={{
        background: "rgba(22,47,74,0.6)",
        borderRadius: 8,
        padding: "12px 14px",
        marginTop: 12,
        border: "1px solid var(--border)",
      }}
    >
      <SectionLabel>Billing breakdown</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 10 }}>
        {[
          ["Hourly", `$${(monthly / 720).toFixed(4)}`],
          ["Daily", `$${(monthly / 30).toFixed(2)}`],
          ["Weekly", `$${(monthly / 4.33).toFixed(2)}`],
          ["Monthly", `$${monthly.toFixed(2)}`],
        ].map(([l, v]) => (
          <div
            key={l}
            style={{
              background: "var(--elevated)",
              borderRadius: 6,
              padding: "8px 6px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 10,
                color: "var(--fg-muted)",
                margin: 0,
              }}
            >
              {l}
            </p>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 12,
                fontWeight: 500,
                color: "#fff",
                margin: "2px 0 0",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {v}
            </p>
          </div>
        ))}
      </div>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--fg-subtle)",
          margin: "10px 0 0",
        }}
      >
        {rateWeiFromPeriod(amount, period).toString()} USDC wei/s
      </p>
    </div>
  );
}

// ============================================================================
// Deactivate button with inline confirmation
// ============================================================================
function DeactivateButton({ planId, active, hasActiveStreams, onDeactivate }: {
  planId: string; active: boolean; hasActiveStreams: boolean; onDeactivate: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!active) return null;
  if (confirming) {
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {hasActiveStreams && (
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--error, #FF6B4A)", maxWidth: 120 }}>
            {hasActiveStreams ? "Active subscribers exist." : ""}
          </span>
        )}
        <button
          onClick={() => { onDeactivate(planId); setConfirming(false); }}
          style={{
            background: "rgba(224,85,85,0.12)", border: "1px solid rgba(224,85,85,0.4)",
            borderRadius: 6, padding: "5px 10px", cursor: "pointer",
            fontFamily: "var(--font-body)", fontSize: 11, color: "var(--error, #FF6B4A)",
          }}
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{
            background: "none", border: "1px solid var(--border)", borderRadius: 6,
            padding: "5px 10px", cursor: "pointer",
            fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-muted)",
          }}
        >
          Cancel
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        background: "none", border: "1px solid var(--border)", borderRadius: 6,
        padding: "5px 10px", cursor: "pointer",
        fontFamily: "var(--font-body)", fontSize: 11, color: "var(--error, #FF6B4A)",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--error, #FF6B4A)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      Deactivate
    </button>
  );
}

// ============================================================================
// Plan card with live subscriber stats
// ============================================================================
function PlanCard({
  plan,
  streams,
  name,
  successUrl,
  onDeactivate,
  onCopyLink,
  onSetSuccessUrl,
}: {
  plan: any;
  streams: any[];
  name?: string;
  successUrl?: string;
  onDeactivate: (id: string) => void;
  onCopyLink: (id: string, successUrl?: string) => void;
  onSetSuccessUrl: (id: string, url: string) => void;
}) {
  const monthly = rateToMonthly(plan.ratePerSecond);
  const planStreams = streams.filter((s: any) => s.planId === plan.id);
  const activeStreams = planStreams.filter((s: any) => !s.canceledAt && !s.disputed);

  const ratePerSecond = (Number(plan.ratePerSecond) / USDC_DECIMALS) * activeStreams.length;

  // live earned across all subs
  const [liveEarned, setLiveEarned] = useState(0);
  useEffect(() => {
    if (activeStreams.length === 0) return;
    const computed = () => {
      let total = 0;
      activeStreams.forEach((s: any) => {
        const rate = Number(s.ratePerSecond ?? 0) / USDC_DECIMALS;
        const deposited = Number(s.deposited ?? 0) / USDC_DECIMALS;
        const startedAt = Number(s.startedAt ?? 0);
        total += Math.min(rate * (Date.now() / 1000 - startedAt), deposited);
      });
      setLiveEarned(total);
    };
    computed();
    const interval = setInterval(computed, 200);
    return () => clearInterval(interval);
  }, [activeStreams]);

  const [copied, setCopied] = useState(false);
  const [redirectInput, setRedirectInput] = useState(successUrl ?? "");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const token = origin ? getPlanToken(plan.id) : "";
  const baseUrl = origin ? `${origin}/subscribe/${token}` : "";
  const nameParam = name ? `&name=${encodeURIComponent(name)}` : "";
  const checkoutLink = successUrl
    ? `${baseUrl}?success=${encodeURIComponent(successUrl)}${nameParam}`
    : name ? `${baseUrl}?name=${encodeURIComponent(name)}` : baseUrl;

  const handleCopy = () => {
    onCopyLink(plan.id, successUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreview = () => {
    if (checkoutLink) window.open(checkoutLink, "_blank", "noopener,noreferrer");
  };

  const handleRedirectSave = () => {
    const trimmed = redirectInput.trim();
    if (trimmed && !trimmed.startsWith("https://")) return;
    onSetSuccessUrl(plan.id, trimmed);
  };

  return (
    <div
      style={{
        ...cardStyle,
        padding: 18,
        position: "relative",
        opacity: plan.active ? 1 : 0.65,
        transition: "all 0.2s",
      }}
    >
      {/* Status strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 18,
          bottom: 18,
          width: 2,
          background: plan.active ? "var(--success, #5AF0B8)" : "var(--fg-subtle)",
          borderRadius: 2,
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: plan.active ? 14 : 4,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 14,
                fontWeight: 500,
                color: "#fff",
                margin: 0,
              }}
            >
              {name || `Plan #${plan.id}`}
            </p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 9999,
                background: plan.active ? "rgba(90,240,184,0.1)" : "rgba(172,198,233,0.05)",
                border: `1px solid ${plan.active ? "rgba(90,240,184,0.3)" : "rgba(172,198,233,0.15)"}`,
                color: plan.active ? "var(--success, #5AF0B8)" : "var(--fg-subtle)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {plan.active && activeStreams.length > 0 && <LivePulse />}
              {plan.active ? "Active" : "Inactive"}
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--fg-muted)",
              margin: 0,
            }}
          >
            ${monthly.toFixed(2)}/mo · {activeStreams.length} active subscriber
            {activeStreams.length !== 1 ? "s" : ""}
          </p>
        </div>

        <DeactivateButton planId={plan.id} active={plan.active} hasActiveStreams={activeStreams.length > 0} onDeactivate={onDeactivate} />
      </div>

      {plan.active && (
        <>
          {/* Live metrics row */}
          {activeStreams.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
                padding: "10px 0",
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                marginBottom: 12,
              }}
            >
              <div>
                <p style={{ ...labelMono, marginBottom: 4 }}>MRR live</p>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    color: "var(--success, #5AF0B8)",
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ${(monthly * activeStreams.length).toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ ...labelMono, marginBottom: 4 }}>Streamed now</p>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    color: "#fff",
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ${liveEarned.toFixed(4)}
                </p>
              </div>
              <div>
                <p style={{ ...labelMono, marginBottom: 4 }}>Rate</p>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    color: "#fff",
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ${ratePerSecond.toFixed(6)}/s
                </p>
              </div>
            </div>
          )}

          {/* Subscribe link */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--elevated)",
              borderRadius: 8,
              padding: "8px 12px",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-subtle)", letterSpacing: "0.05em" }}>→</span>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", flex: 1, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {checkoutLink}
            </p>
            <button
              onClick={handlePreview}
              style={{
                background: "none", border: "1px solid var(--border)", borderRadius: 4,
                cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500,
                color: "var(--fg-muted)", flexShrink: 0, padding: "3px 8px", transition: "all 0.15s",
              }}
              title="Open checkout in new tab"
            >
              Preview ↗
            </button>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? "rgba(90,240,184,0.12)" : "none", border: "none",
                cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500,
                color: copied ? "var(--success, #5AF0B8)" : "var(--cta, #3898EC)",
                flexShrink: 0, padding: "3px 8px", borderRadius: 4, transition: "all 0.15s",
              }}
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>

          {/* Redirect URL after payment */}
          <div style={{ marginTop: 8 }}>
            <label style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-muted)", display: "block", marginBottom: 4 }}>
              Redirect after payment (optional)
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="url"
                placeholder="https://yoursite.com/thank-you"
                value={redirectInput}
                onChange={(e) => setRedirectInput(e.target.value)}
                onBlur={handleRedirectSave}
                style={{
                  flex: 1, background: "var(--elevated)", border: "1px solid rgba(172,198,233,0.15)",
                  borderRadius: 6, padding: "6px 10px", fontSize: 11, fontFamily: "var(--font-mono)",
                  color: "var(--fg2)", outline: "none", boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleRedirectSave}
                style={{
                  background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 6,
                  cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11,
                  color: "var(--fg-muted)", padding: "6px 10px", flexShrink: 0,
                }}
              >
                Save
              </button>
            </div>
            {redirectInput && !redirectInput.startsWith("https://") && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--error, #FF6B4A)", margin: "3px 0 0" }}>
                Must start with https://
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================
const NAMES_KEY = "trustflow_plan_names";
const REDIRECTS_KEY = "trustflow_plan_redirects";
const TOKENS_KEY = "trustflow_plan_tokens";

function loadNames(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(NAMES_KEY) ?? "{}"); } catch { return {}; }
}
function saveName(planId: string, name: string) {
  const names = loadNames();
  localStorage.setItem(NAMES_KEY, JSON.stringify({ ...names, [planId]: name }));
}
function loadRedirects(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(REDIRECTS_KEY) ?? "{}"); } catch { return {}; }
}
function saveRedirect(planId: string, url: string) {
  const redirects = loadRedirects();
  localStorage.setItem(REDIRECTS_KEY, JSON.stringify({ ...redirects, [planId]: url }));
}
function loadTokens(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(TOKENS_KEY) ?? "{}"); } catch { return {}; }
}
function getPlanToken(planId: string): string {
  const tokens = loadTokens();
  if (tokens[planId]) return tokens[planId];
  const arr = crypto.getRandomValues(new Uint8Array(5));
  const prefix = Array.from(arr).map(b => b.toString(36).padStart(2, "0")).join("").slice(0, 8);
  const suffix = parseInt(planId).toString(36).padStart(4, "0");
  const token = prefix + suffix;
  localStorage.setItem(TOKENS_KEY, JSON.stringify({ ...tokens, [planId]: token }));
  return token;
}
function decodePlanToken(token: string): string {
  return parseInt(token.slice(-4), 36).toString();
}

export default function PlansPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [grace, setGrace] = useState("0");
  const [policy, setPolicy] = useState("0");
  const [planName, setPlanName] = useState("");
  const [planNames, setPlanNames] = useState<Record<string, string>>({});
  const [successUrls, setSuccessUrls] = useState<Record<string, string>>({});
  const [txStatus, setTxStatus] = useState<string | null>(null);

  useEffect(() => {
    setPlanNames(loadNames());
    setSuccessUrls(loadRedirects());
  }, []);

  const amountNum = useMemo(() => parseFloat(amount) || 0, [amount]);
  const rateWei = useMemo(() => rateWeiFromPeriod(amountNum, period), [amountNum, period]);

  const { data: plans, refetch } = useQuery({
    queryKey: ["plans", address],
    queryFn: () => getPlansByOwner(address!),
    enabled: !!address,
  });

  const { data: streams } = useQuery({
    queryKey: ["streams", plans?.map((p) => p.id)],
    queryFn: () => getStreamsByPlanIds(plans!.map((p) => p.id)),
    enabled: !!plans?.length,
  });

  async function handleCreate() {
    if (!amountNum || rateWei === 0n) return;
    try {
      setTxStatus("Sending transaction…");
      const result = await writeContractAsync({
        address: ADDRESSES.PlanRegistry,
        abi: PLAN_REGISTRY_ABI,
        functionName: "createPlan",
        args: [rateWei, Number(grace) * 86400, Number(policy)],
      });
      // Save name locally — contract doesn't store metadata
      const newPlans = await refetch();
      const latestPlan = newPlans.data?.[newPlans.data.length - 1];
      if (latestPlan && planName.trim()) {
        saveName(String(latestPlan.id), planName.trim());
        setPlanNames(loadNames());
      }
      setTxStatus("Plan created!");
      setAmount("");
      setPlanName("");
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

  function handleCopyLink(planId: string, successUrl?: string) {
    // token + name are handled inside PlanCard; this is a fallback
    const token = getPlanToken(planId);
    const base = `${window.location.origin}/subscribe/${token}`;
    const link = successUrl ? `${base}?success=${encodeURIComponent(successUrl)}` : base;
    navigator.clipboard.writeText(link);
  }

  function handleSetSuccessUrl(planId: string, url: string) {
    saveRedirect(planId, url);
    setSuccessUrls(loadRedirects());
  }

  if (!isConnected) {
    return <ConnectPrompt context="merchant" />;
  }

  const activePlansCount = plans?.filter((p: any) => p.active).length ?? 0;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 24,
        }}
      >
        <div>
          <SectionLabel>Plans · Merchant</SectionLabel>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 28,
              fontWeight: 600,
              color: "#fff",
              margin: "6px 0 0",
              letterSpacing: "-0.02em",
            }}
          >
            {activePlansCount > 0 ? (
              <>
                <LivePulse />
                {activePlansCount} active {activePlansCount === 1 ? "plan" : "plans"}
              </>
            ) : (
              "Create your first plan"
            )}
          </h1>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "400px 1fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        {/* Create form */}
        <div style={{ ...cardStyle, padding: 22 }}>
          <SectionLabel>New plan</SectionLabel>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 16,
              fontWeight: 500,
              color: "#fff",
              margin: "6px 0 18px",
            }}
          >
            Create plan
          </p>

          {/* Plan name */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Plan name (optional)</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g. Pro API, Starter, Enterprise"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              maxLength={48}
            />
          </div>

          {/* Billing period selector */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Billing period</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {(["hourly", "daily", "weekly", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: "7px 0",
                    borderRadius: 6,
                    border:
                      period === p
                        ? "1px solid rgba(56,152,236,0.6)"
                        : "1px solid rgba(172,198,233,0.15)",
                    background: period === p ? "rgba(56,152,236,0.12)" : "var(--elevated)",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 500,
                    color: period === p ? "var(--cta, #3898EC)" : "var(--fg-muted)",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 0.15s",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Price input */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Price {PERIOD_LABELS[period]} (USDC)</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--fg-muted)",
                  fontSize: 13,
                }}
              >
                $
              </span>
              <input
                style={{ ...inputStyle, paddingLeft: 22 }}
                type="number"
                placeholder="e.g. 29.99"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <RatePreview amount={amountNum} period={period} />

          {/* Grace + policy */}
          <div style={{ display: "flex", gap: 10, margin: "14px 0" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Grace period (days)</label>
              <input
                style={inputStyle}
                type="number"
                placeholder="0"
                value={grace}
                onChange={(e) => setGrace(e.target.value)}
                min="0"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Dispute policy</label>
              <select
                style={inputStyle}
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
            disabled={isPending || !amountNum || rateWei === 0n}
            style={{
              width: "100%",
              background:
                amountNum && !isPending ? "var(--cta, #3898EC)" : "rgba(26,58,92,0.8)",
              border: "none",
              borderRadius: 8,
              padding: "11px 0",
              fontFamily: "var(--font-heading)",
              fontSize: 13,
              fontWeight: 500,
              color: amountNum && !isPending ? "#fff" : "var(--fg-subtle)",
              cursor: amountNum && !isPending ? "pointer" : "not-allowed",
              transition: "background 0.15s",
            }}
          >
            {isPending ? "Waiting…" : "Create plan"}
          </button>
          {txStatus && (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: txStatus.startsWith("Error")
                  ? "var(--error, #FF6B4A)"
                  : "var(--success, #5AF0B8)",
                marginTop: 10,
                textAlign: "center",
              }}
            >
              {txStatus}
            </p>
          )}
        </div>

        {/* Plan list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {plans?.length === 0 && (
            <div
              style={{
                ...cardStyle,
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  margin: 0,
                  letterSpacing: "0.05em",
                }}
              >
                // no plans yet
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--fg-muted)",
                  margin: "8px 0 0",
                }}
              >
                Fill the form on the left to create your first plan.
              </p>
            </div>
          )}

          {plans?.map((plan: any) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              streams={streams ?? []}
              name={planNames[String(plan.id)]}
              successUrl={successUrls[String(plan.id)]}
              onDeactivate={handleDeactivate}
              onCopyLink={handleCopyLink}
              onSetSuccessUrl={handleSetSuccessUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
