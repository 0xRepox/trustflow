import {
  PlanRegistry_PlanCreated_handler,
  PlanRegistry_PlanUpdated_handler,
  PlanRegistry_PlanDeactivated_handler,
  StreamManager_StreamCreated_handler,
  StreamManager_StreamCancelled_handler,
  StreamManager_StreamToppedUp_handler,
  StreamManager_StreamPaused_handler,
  StreamManager_StreamResumed_handler,
  StreamManager_Claimed_handler,
  DisputeResolver_DisputeOpened_handler,
  DisputeResolver_DisputeResponded_handler,
  DisputeResolver_DisputeSettled_handler,
} from "../generated/src/Handlers.gen";
import type {
  Plan,
  Stream,
  ClaimEvent,
  Dispute,
} from "../generated/src/Types.gen";

// ─── PlanRegistry ─────────────────────────────────────────────────────────

PlanRegistry_PlanCreated_handler(async ({ event, context }) => {
  const plan: Plan = {
    id: event.params.planId.toString(),
    owner: event.params.owner,
    ratePerSecond: event.params.ratePerSecond.toString(),
    gracePeriod: 0,
    disputePolicy: 0,
    active: true,
    createdAt: event.block.timestamp,
  };
  context.Plan.set(plan);
});

PlanRegistry_PlanUpdated_handler(async ({ event, context }) => {
  const existing = await context.Plan.get(event.params.planId.toString());
  if (!existing) return;
  context.Plan.set({
    ...existing,
    ratePerSecond: event.params.ratePerSecond.toString(),
    gracePeriod: Number(event.params.gracePeriod),
    disputePolicy: Number(event.params.disputePolicy),
  });
});

PlanRegistry_PlanDeactivated_handler(async ({ event, context }) => {
  const existing = await context.Plan.get(event.params.planId.toString());
  if (!existing) return;
  context.Plan.set({ ...existing, active: false });
});

// ─── StreamManager ────────────────────────────────────────────────────────

StreamManager_StreamCreated_handler(async ({ event, context }) => {
  const stream: Stream = {
    id: event.params.streamId.toString(),
    plan_id: event.params.planId.toString(),
    payer: event.params.payer,
    deposited: event.params.deposit.toString(),
    claimed: "0",
    consumed: "0",
    status: "Active",
    createdAt: event.block.timestamp,
    cancelledAt: undefined,
  };
  context.Stream.set(stream);
});

StreamManager_StreamCancelled_handler(async ({ event, context }) => {
  const existing = await context.Stream.get(event.params.streamId.toString());
  if (!existing) return;
  context.Stream.set({
    ...existing,
    consumed: event.params.consumed.toString(),
    status: "Cancelled",
    cancelledAt: event.block.timestamp,
  });
});

StreamManager_StreamToppedUp_handler(async ({ event, context }) => {
  const existing = await context.Stream.get(event.params.streamId.toString());
  if (!existing) return;
  const newDeposited = (BigInt(existing.deposited) + event.params.amount).toString();
  context.Stream.set({ ...existing, deposited: newDeposited });
});

StreamManager_StreamPaused_handler(async ({ event, context }) => {
  const existing = await context.Stream.get(event.params.streamId.toString());
  if (!existing) return;
  context.Stream.set({ ...existing, status: "Paused" });
});

StreamManager_StreamResumed_handler(async ({ event, context }) => {
  const existing = await context.Stream.get(event.params.streamId.toString());
  if (!existing) return;
  context.Stream.set({ ...existing, status: "Active" });
});

StreamManager_Claimed_handler(async ({ event, context }) => {
  const existing = await context.Stream.get(event.params.streamId.toString());
  if (existing) {
    const newClaimed = (BigInt(existing.claimed) + event.params.amount).toString();
    context.Stream.set({ ...existing, claimed: newClaimed });
  }

  const claimId = `${event.params.streamId}-${event.block.hash}-${event.logIndex}`;
  const claim: ClaimEvent = {
    id: claimId,
    stream_id: event.params.streamId.toString(),
    merchant: event.params.merchant,
    amount: event.params.amount.toString(),
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
  };
  context.ClaimEvent.set(claim);
});

// ─── DisputeResolver ──────────────────────────────────────────────────────

DisputeResolver_DisputeOpened_handler(async ({ event, context }) => {
  const dispute: Dispute = {
    id: event.params.disputeId.toString(),
    stream_id: event.params.streamId.toString(),
    subscriber: event.params.subscriber,
    frozenAmount: event.params.frozenAmount.toString(),
    status: "Open",
    verdict: undefined,
    evidenceHash: undefined,
    openedAt: event.block.timestamp,
    settledAt: undefined,
  };
  context.Dispute.set(dispute);
});

DisputeResolver_DisputeResponded_handler(async ({ event, context }) => {
  const existing = await context.Dispute.get(event.params.disputeId.toString());
  if (!existing) return;
  context.Dispute.set({
    ...existing,
    status: "Responded",
    evidenceHash: event.params.evidenceHash,
  });
});

DisputeResolver_DisputeSettled_handler(async ({ event, context }) => {
  const existing = await context.Dispute.get(event.params.disputeId.toString());
  if (!existing) return;
  const verdictMap: Record<number, string> = { 0: "Pending", 1: "Subscriber", 2: "Merchant", 3: "Split" };
  context.Dispute.set({
    ...existing,
    status: "Settled",
    verdict: verdictMap[Number(event.params.verdict)] ?? "Unknown",
    settledAt: event.block.timestamp,
  });
});
