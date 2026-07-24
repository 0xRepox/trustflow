import { parseEventLogs } from "viem";
import { ADDRESSES, type AgentConfig } from "./config.js";
import { ERC20_ABI, PLAN_REGISTRY_ABI, STREAM_MANAGER_ABI, StreamStatus } from "./abi.js";
import { decide } from "./runway.js";
import { computeAvailableToDispute, computeDisputeBond } from "./dispute.js";
import type { AgentClients } from "./client.js";
import type { Executor } from "./executor.js";
import type { HealthCheck } from "./health.js";

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
    /** Unset means the agent never assesses or disputes — nothing to check. */
    private readonly healthCheck?: HealthCheck,
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

    if (this.healthCheck) {
      await this.assessService(stream);
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
    const logs = await this.scanStreamCreatedLogs();

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

  /**
   * A single eth_getLogs call spanning deploy-to-tip breaks once enough blocks
   * have passed — most RPCs (including Arc's public endpoint) cap the range
   * per call, and the cap only gets tighter to trip as the deployment ages.
   * Chunk the scan so restart recovery works against whatever RPC is
   * configured rather than assuming a provider that tolerates a wide range.
   * Sequential, not parallel — a startup-time scan can afford a few seconds
   * more latency, and firing many chunks at once is exactly the pattern that
   * trips a provider's requests-per-second limit instead of its range cap.
   */
  private async scanStreamCreatedLogs() {
    const CHUNK = 9_000n; // under the tightest observed per-call cap (10,000)
    const latest = await this.clients.publicClient.getBlockNumber();

    const chunks = [];
    for (let from = this.deployBlock; from <= latest; from += CHUNK + 1n) {
      const to = from + CHUNK > latest ? latest : from + CHUNK;
      const chunk = await this.clients.publicClient.getContractEvents({
        address: ADDRESSES.StreamManager,
        abi: STREAM_MANAGER_ABI,
        eventName: "StreamCreated",
        args: { payer: this.executor.address },
        fromBlock: from,
        toBlock: to,
      });
      chunks.push(chunk);
    }
    return chunks.flat();
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

  /**
   * Stop and reclaim the unconsumed deposit. Reverts on-chain if a dispute is
   * still frozen on the stream — checked first so that reads as a clear log
   * line instead of a thrown revert.
   */
  async cancelStream(): Promise<void> {
    if (this.streamId === null) throw new Error("no stream to cancel");

    const stream = await this.clients.publicClient.readContract({
      address: ADDRESSES.StreamManager,
      abi: STREAM_MANAGER_ABI,
      functionName: "getStream",
      args: [this.streamId],
    });

    if (stream.frozen > 0n) {
      console.log(`stream ${this.streamId} has an active dispute — cannot cancel until it settles`);
      return;
    }

    const before = await this.clients.publicClient.readContract({
      address: ADDRESSES.USDC,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [this.executor.address],
    });

    const hash = await this.executor.execute({
      contract: ADDRESSES.StreamManager,
      signature: "cancel(uint256)",
      args: [this.streamId],
    });
    await this.clients.publicClient.waitForTransactionReceipt({ hash });

    const after = await this.clients.publicClient.readContract({
      address: ADDRESSES.USDC,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [this.executor.address],
    });

    console.log(`cancelled stream ${this.streamId} — refunded ${after - before}`);
    this.stop();
  }

  /**
   * The differentiator: check the service the stream is paying for, and if
   * it's degraded, freeze the accrued-but-unclaimed balance ourselves instead
   * of waiting for a human to notice. Skips quietly if a dispute is already
   * open on this stream, so a bad tick can't stack duplicate freezes.
   */
  private async assessService(stream: {
    consumed: bigint;
    claimed: bigint;
    frozen: bigint;
    ratePerSecond: bigint;
  }): Promise<void> {
    if (this.streamId === null || !this.healthCheck) return;
    if (stream.frozen > 0n) return;

    const healthy = await this.healthCheck.check();
    if (healthy) return;

    const amount = computeAvailableToDispute(stream);
    if (amount === 0n) {
      console.log(`service unhealthy on stream ${this.streamId} but nothing accrued yet to dispute`);
      return;
    }

    const bond = computeDisputeBond(stream.ratePerSecond);
    console.log(`service degraded — opening dispute on stream ${this.streamId} for ${amount} (bond ${bond})`);

    await this.executor.execute({
      contract: ADDRESSES.USDC,
      signature: "approve(address,uint256)",
      args: [ADDRESSES.DisputeResolver, bond],
    });

    const hash = await this.executor.execute({
      contract: ADDRESSES.DisputeResolver,
      signature: "openDispute(uint256,uint128)",
      args: [this.streamId, amount],
    });
    await this.clients.publicClient.waitForTransactionReceipt({ hash });

    console.log(`dispute opened on stream ${this.streamId}`);
  }
}
