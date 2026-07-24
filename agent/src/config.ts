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
  PlanRegistry: "0xe1deB4a0504f2Baf27D2C225B3807a5743113A73",
  StreamManager: "0xf576f7aF812298B95bB440d6718A8b1d96d54395",
  DisputeResolver: "0xF87B65f0bFe749b0BDd0834D3a808B04c241714F",
  USDC: "0x3600000000000000000000000000000000000000",
} as const satisfies Record<string, Address>;

/** Block StreamManager was deployed at — floor for event scans. */
export const DEPLOY_BLOCK = 53_293_655n;

/**
 * How the agent signs. `circle` routes writes through a Circle Agent Wallet
 * (MPC, policy-enforced, the process never holds the key) and is the intended
 * production path. `local` uses a raw private key for dev and tests.
 */
export type WalletMode = "circle" | "local";

export interface AgentConfig {
  walletMode: WalletMode;
  /** Raw key — local mode only. Never a human's key. */
  privateKey?: `0x${string}`;
  /** Circle Agent Wallet address — circle mode only. */
  circleWalletAddress?: `0x${string}`;
  /** Circle chain identifier, e.g. ARC-TESTNET. */
  circleChain: string;
  rpcUrl: string;
  /** Plan the agent subscribes to. */
  planId: bigint;
  /** Seconds of runway to hold. Below this the agent tops up. */
  minRunwaySeconds: number;
  /** Seconds of runway to restore when topping up. */
  targetRunwaySeconds: number;
  /** How often the agent re-evaluates its position. */
  pollIntervalMs: number;
  /**
   * URL the agent polls to judge whether the service it's paying for is
   * still behaving. Unset means no assessment runs — the agent never
   * disputes without something concrete to check.
   */
  serviceHealthUrl?: string;
  serviceHealthTimeoutMs: number;
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
  const circleWalletAddress = process.env.CIRCLE_WALLET_ADDRESS;
  const privateKey = process.env.AGENT_PRIVATE_KEY;

  // Exactly one signing path. Both set is ambiguous; neither leaves no signer.
  if (circleWalletAddress && privateKey) {
    throw new Error("Set CIRCLE_WALLET_ADDRESS or AGENT_PRIVATE_KEY, not both");
  }
  if (!circleWalletAddress && !privateKey) {
    throw new Error("Set CIRCLE_WALLET_ADDRESS (production) or AGENT_PRIVATE_KEY (local dev)");
  }

  const walletMode: WalletMode = circleWalletAddress ? "circle" : "local";

  if (walletMode === "circle" && !/^0x[0-9a-fA-F]{40}$/.test(circleWalletAddress!)) {
    throw new Error("CIRCLE_WALLET_ADDRESS must be a 0x-prefixed 20-byte address");
  }
  if (walletMode === "local" && !/^0x[0-9a-fA-F]{64}$/.test(privateKey!)) {
    throw new Error("AGENT_PRIVATE_KEY must be a 0x-prefixed 32-byte hex string");
  }

  const minRunwaySeconds = numeric("MIN_RUNWAY_SECONDS", 3600);
  const targetRunwaySeconds = numeric("TARGET_RUNWAY_SECONDS", 21600);
  if (targetRunwaySeconds <= minRunwaySeconds) {
    throw new Error("TARGET_RUNWAY_SECONDS must exceed MIN_RUNWAY_SECONDS");
  }

  return {
    walletMode,
    privateKey: privateKey as `0x${string}` | undefined,
    circleWalletAddress: circleWalletAddress as `0x${string}` | undefined,
    circleChain: process.env.CIRCLE_CHAIN ?? "ARC-TESTNET",
    rpcUrl: process.env.ARC_RPC_URL ?? arcTestnet.rpcUrls.default.http[0],
    planId: BigInt(required("PLAN_ID")),
    minRunwaySeconds,
    targetRunwaySeconds,
    pollIntervalMs: numeric("POLL_INTERVAL_MS", 15_000),
    serviceHealthUrl: process.env.SERVICE_HEALTH_URL || undefined,
    serviceHealthTimeoutMs: numeric("SERVICE_HEALTH_TIMEOUT_MS", 5_000),
  };
}
