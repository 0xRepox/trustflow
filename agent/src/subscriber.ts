import { parseEventLogs } from "viem";
import { ADDRESSES, type AgentConfig } from "./config.js";
import { PLAN_REGISTRY_ABI, STREAM_MANAGER_ABI, StreamStatus } from "./abi.js";
import { decide } from "./runway.js";
import type { AgentClients } from "./client.js";
import type { Executor } from "./executor.js";

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Owns one stream for its whole lifetime: open → monitor → top up → cancel.
 *
 * Every branch is driven by on-chain state read fresh each tick, so the agent
 * recovers correctly after a restart — it adopts whatever stream it already has
 * rather than opening a duplicate.
 *
 * Reads go through viem; writes go through the Executor, which in production is
 * a Circle Agent Wallet whose spending policy bounds what the agent can spend.
 */
export class SubscriberAgent {
  private streamId: bigint | null = null;
  private running = false;

  constructor(
    private readonly config: AgentConfig,
    private readonly clients: AgentClients,
    private readonly executor: Executor,
    /** Block to scan from when recovering an existing stream. */
    private readonly deployBlock: bigint,
  ) {}

  stop(): void {
    this.running = false;
  }

  async run(): Promise<void> {
    // Recover, or open the first stream. One human funds the wallet; from here
    // the agent signs everything itself.
    await this.adoptExistingStream();
    if (this.streamId === null) {
      const rate = await this.planRate();
      const deposit = rate * BigInt(this.config.targetRunwaySeconds);
      await this.openStream(deposit);
    }

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
    if (this.streamId === null) return;

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
        await this.topUp(decision.amount);
        return;
      case "expired":
        console.log("runway exhausted — stream has drained");
        return;
    }
  }

  /** Approve USDC, open a stream, and record the id from its StreamCreated log. */
  async openStream(depositAmount: bigint): Promise<bigint> {
    await this.executor.execute({
      contract: ADDRESSES.USDC,
      signature: "approve(address,uint256)",
      args: [ADDRESSES.StreamManager, depositAmount],
    });

    const hash = await this.executor.execute({
      contract: ADDRESSES.StreamManager,
      signature: "createStream(uint256,uint128)",
      args: [this.config.planId, depositAmount],
    });

    const receipt = await this.clients.publicClient.waitForTransactionReceipt({ hash });
    const logs = parseEventLogs({ abi: STREAM_MANAGER_ABI, eventName: "StreamCreated", logs: receipt.logs });
    const mine = logs.find((l) => l.args.payer.toLowerCase() === this.executor.address.toLowerCase());
    if (!mine) throw new Error("createStream succeeded but no StreamCreated log for this wallet");

    this.streamId = mine.args.streamId;
    console.log(`opened stream ${this.streamId} with ${depositAmount} deposit`);
    return this.streamId;
  }

  /** Extend runway on the current stream. */
  async topUp(amount: bigint): Promise<void> {
    if (this.streamId === null) throw new Error("no stream to top up");
    await this.executor.execute({
      contract: ADDRESSES.StreamManager,
      signature: "topUp(uint256,uint128)",
      args: [this.streamId, amount],
    });
  }

  /**
   * Find an existing active stream for this wallet so a restart resumes rather
   * than opening a duplicate. Scans StreamCreated logs, then confirms status
   * on-chain — a cancelled stream is not adopted.
   */
  async adoptExistingStream(): Promise<void> {
    const logs = await this.clients.publicClient.getContractEvents({
      address: ADDRESSES.StreamManager,
      abi: STREAM_MANAGER_ABI,
      eventName: "StreamCreated",
      args: { payer: this.executor.address },
      fromBlock: this.deployBlock,
      toBlock: "latest",
    });

    // Newest first — prefer the most recent still-live stream.
    for (const log of [...logs].reverse()) {
      const id = log.args.streamId;
      if (id === undefined) continue;
      const stream = await this.clients.publicClient.readContract({
        address: ADDRESSES.StreamManager,
        abi: STREAM_MANAGER_ABI,
        functionName: "getStream",
        args: [id],
      });
      if (stream.status !== StreamStatus.Cancelled) {
        this.streamId = id;
        console.log(`adopted existing stream ${id}`);
        return;
      }
    }
  }

  /** Reads the plan so deposits are sized from the real on-chain rate. */
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

  // TODO: cancelStream() — cancel and reconcile the refund
  // TODO: assessService() — the differentiator: detect degradation, openDispute
}
