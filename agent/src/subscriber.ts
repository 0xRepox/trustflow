import { ADDRESSES, type AgentConfig } from "./config.js";
import { PLAN_REGISTRY_ABI, STREAM_MANAGER_ABI, StreamStatus } from "./abi.js";
import { decide } from "./runway.js";
import type { AgentClients } from "./client.js";

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Owns one stream for its whole lifetime: open → monitor → top up → cancel.
 *
 * Every branch is driven by onchain state read fresh each tick, so the agent
 * recovers correctly after a restart — it adopts whatever stream it already has
 * rather than opening a duplicate.
 */
export class SubscriberAgent {
  private streamId: bigint | null = null;
  private running = false;

  constructor(
    private readonly config: AgentConfig,
    private readonly clients: AgentClients,
  ) {}

  stop(): void {
    this.running = false;
  }

  async run(): Promise<void> {
    this.running = true;
    while (this.running) {
      try {
        await this.tick();
      } catch (error: unknown) {
        // A failed tick must never kill the agent — the next poll retries.
        console.error(`tick failed: ${error instanceof Error ? error.message : "unknown"}`);
      }
      await sleep(this.config.pollIntervalMs);
    }
  }

  private async tick(): Promise<void> {
    if (this.streamId === null) {
      console.log("no stream yet — open one via openStream() once funding is confirmed");
      return;
    }

    const stream = await this.clients.publicClient.readContract({
      address: ADDRESSES.StreamManager,
      abi: STREAM_MANAGER_ABI,
      functionName: "getStream",
      args: [this.streamId],
    });

    if (stream.status === StreamStatus.Cancelled) {
      console.log(`stream ${this.streamId} cancelled — nothing left to manage`);
      this.stop();
      return;
    }

    const [usable] = await this.clients.publicClient.readContract({
      address: ADDRESSES.StreamManager,
      abi: STREAM_MANAGER_ABI,
      functionName: "getBalance",
      args: [this.streamId],
    });

    const decision = decide(
      { usable, ratePerSecond: stream.ratePerSecond },
      this.config.minRunwaySeconds,
      this.config.targetRunwaySeconds,
    );

    switch (decision.action) {
      case "hold":
        console.log(`runway ${Math.round(decision.runwaySeconds)}s — holding`);
        return;
      case "topUp":
        console.log(`runway ${Math.round(decision.runwaySeconds)}s — topping up ${decision.amount}`);
        // TODO: approve + topUp, then await receipt
        return;
      case "expired":
        console.log("runway exhausted — stream has drained");
        return;
    }
  }

  /** Reads the plan so deposits are sized from the real onchain rate. */
  async planRate(): Promise<bigint> {
    const plan = await this.clients.publicClient.readContract({
      address: ADDRESSES.PlanRegistry,
      abi: PLAN_REGISTRY_ABI,
      functionName: "getPlan",
      args: [this.config.planId],
    });
    if (!plan.active) throw new Error(`plan ${this.config.planId} is not active`);
    return plan.ratePerSecond;
  }

  // TODO: openStream() — approve USDC, createStream, record streamId
  // TODO: adoptExistingStream() — scan payer streams so restarts don't duplicate
  // TODO: cancelStream() — cancel and reconcile the refund
  // TODO: assessService() — the differentiator: detect degradation, openDispute
}
