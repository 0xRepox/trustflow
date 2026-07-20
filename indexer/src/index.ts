import { ponder } from "ponder:registry";
import { plan, stream, claimEvent, dispute } from "ponder:schema";

// ─── PlanRegistry ──────────────────────────────────────────────────────────

ponder.on("PlanRegistry:PlanCreated", async ({ event, context }) => {
  await context.db.insert(plan).values({
    id: event.args.planId.toString(),
    owner: event.args.owner.toLowerCase(),
    ratePerSecond: event.args.ratePerSecond.toString(),
    gracePeriod: 0,
    disputePolicy: 0,
    active: true,
    createdAt: Number(event.block.timestamp),
  });
});

ponder.on("PlanRegistry:PlanUpdated", async ({ event, context }) => {
  await context.db
    .update(plan, { id: event.args.planId.toString() })
    .set({
      ratePerSecond: event.args.ratePerSecond.toString(),
      gracePeriod: Number(event.args.gracePeriod),
      disputePolicy: Number(event.args.disputePolicy),
    });
});

ponder.on("PlanRegistry:PlanDeactivated", async ({ event, context }) => {
  await context.db
    .update(plan, { id: event.args.planId.toString() })
    .set({ active: false });
});

// ─── StreamManager ─────────────────────────────────────────────────────────

ponder.on("StreamManager:StreamCreated", async ({ event, context }) => {
  await context.db.insert(stream).values({
    id: event.args.streamId.toString(),
    planId: event.args.planId.toString(),
    payer: event.args.payer.toLowerCase(),
    deposited: event.args.deposit.toString(),
    claimed: "0",
    consumed: "0",
    status: "Active",
    createdAt: Number(event.block.timestamp),
    cancelledAt: null,
  });
});

ponder.on("StreamManager:StreamCancelled", async ({ event, context }) => {
  await context.db
    .update(stream, { id: event.args.streamId.toString() })
    .set({
      consumed: event.args.consumed.toString(),
      status: "Cancelled",
      cancelledAt: Number(event.block.timestamp),
    });
});

ponder.on("StreamManager:StreamToppedUp", async ({ event, context }) => {
  const existing = await context.db.find(stream, { id: event.args.streamId.toString() });
  if (!existing) return;
  await context.db
    .update(stream, { id: event.args.streamId.toString() })
    .set({ deposited: (BigInt(existing.deposited) + event.args.amount).toString() });
});

ponder.on("StreamManager:StreamPaused", async ({ event, context }) => {
  await context.db
    .update(stream, { id: event.args.streamId.toString() })
    .set({ status: "Paused" });
});

ponder.on("StreamManager:StreamResumed", async ({ event, context }) => {
  await context.db
    .update(stream, { id: event.args.streamId.toString() })
    .set({ status: "Active" });
});

ponder.on("StreamManager:Claimed", async ({ event, context }) => {
  const existing = await context.db.find(stream, { id: event.args.streamId.toString() });
  if (existing) {
    await context.db
      .update(stream, { id: event.args.streamId.toString() })
      .set({ claimed: (BigInt(existing.claimed) + event.args.amount).toString() });
  }

  await context.db.insert(claimEvent).values({
    id: `${event.args.streamId}-${event.transaction.hash}-${event.log.logIndex}`,
    streamId: event.args.streamId.toString(),
    merchant: event.args.merchant.toLowerCase(),
    amount: event.args.amount.toString(),
    timestamp: Number(event.block.timestamp),
    blockNumber: Number(event.block.number),
  });
});

// ─── DisputeResolver ───────────────────────────────────────────────────────

ponder.on("DisputeResolver:DisputeOpened", async ({ event, context }) => {
  await context.db.insert(dispute).values({
    id: event.args.disputeId.toString(),
    streamId: event.args.streamId.toString(),
    subscriber: event.args.subscriber.toLowerCase(),
    frozenAmount: event.args.frozenAmount.toString(),
    status: "Open",
    verdict: null,
    evidenceHash: null,
    openedAt: Number(event.block.timestamp),
    settledAt: null,
  });
});

ponder.on("DisputeResolver:DisputeResponded", async ({ event, context }) => {
  await context.db
    .update(dispute, { id: event.args.disputeId.toString() })
    .set({ status: "Responded", evidenceHash: event.args.evidenceHash });
});

ponder.on("DisputeResolver:DisputeSettled", async ({ event, context }) => {
  const verdictMap: Record<number, string> = { 0: "Pending", 1: "Subscriber", 2: "Merchant", 3: "Split" };
  await context.db
    .update(dispute, { id: event.args.disputeId.toString() })
    .set({
      status: "Settled",
      verdict: verdictMap[Number(event.args.verdict)] ?? "Unknown",
      settledAt: Number(event.block.timestamp),
    });
});
