import { defineChain, type Address } from "viem";

/**
 * Arc testnet. USDC is the native gas token — an agent holds exactly one asset,
 * so it can never end up funded but unable to transact.
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "Arcscan", url: "https://testnet.arcscan.app" } },
});

export const ADDRESSES = {
  PlanRegistry: "0x276Ad3A0c2A96d2C135736c6Bde315Ff7d9F6648",
  StreamManager: "0xb4cC364d19eb4473852316Ec7B8bcc6D87EF3954",
  DisputeResolver: "0xc2fd9616d9d8Af35a6D89290bed4838Da3F5083d",
  USDC: "0x3600000000000000000000000000000000000000",
} as const satisfies Record<string, Address>;

export interface AgentConfig {
  /** Private key of the agent's own wallet. Never a human's key. */
  privateKey: `0x${string}`;
  rpcUrl: string;
  /** Plan the agent subscribes to. */
  planId: bigint;
  /** Seconds of runway to hold. Below this the agent tops up. */
  minRunwaySeconds: number;
  /** Seconds of runway to restore when topping up. */
  targetRunwaySeconds: number;
  /** How often the agent re-evaluates its position. */
  pollIntervalMs: number;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function numeric(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number, got: ${raw}`);
  }
  return parsed;
}

export function loadConfig(): AgentConfig {
  const privateKey = required("AGENT_PRIVATE_KEY");
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("AGENT_PRIVATE_KEY must be a 0x-prefixed 32-byte hex string");
  }

  const minRunwaySeconds = numeric("MIN_RUNWAY_SECONDS", 3600);
  const targetRunwaySeconds = numeric("TARGET_RUNWAY_SECONDS", 21600);
  if (targetRunwaySeconds <= minRunwaySeconds) {
    throw new Error("TARGET_RUNWAY_SECONDS must exceed MIN_RUNWAY_SECONDS");
  }

  return {
    privateKey: privateKey as `0x${string}`,
    rpcUrl: process.env.ARC_RPC_URL ?? arcTestnet.rpcUrls.default.http[0],
    planId: BigInt(required("PLAN_ID")),
    minRunwaySeconds,
    targetRunwaySeconds,
    pollIntervalMs: numeric("POLL_INTERVAL_MS", 15_000),
  };
}
