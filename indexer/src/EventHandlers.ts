import {
  PlanRegistry_PlanCreated,
  PlanRegistry_PlanUpdated,
  PlanRegistry_PlanDeactivated,
  StreamManager_StreamCreated,
  StreamManager_StreamCancelled,
  StreamManager_StreamToppedUp,
  StreamManager_StreamPaused,
  StreamManager_StreamResumed,
  StreamManager_Claimed,
  DisputeResolver_DisputeOpened,
  DisputeResolver_DisputeResponded,
  DisputeResolver_DisputeSettled,
  Plan,
  Stream,
  ClaimEvent,
  Dispute,
} from "../generated/src/Types.gen";

// ─── PlanRegistry ─────────────────────────────────────────────────────────

PlanRegistry_PlanCreated.handler(async ({ event, context }) => {
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

PlanRegistry_PlanUpdated.handler(async ({ event, context }) => {
  const existing = await context.Plan.get(event.params.planId.toString());
  if (!existing) return;
  context.Plan.set({
    ...existing,
    ratePerSecond: event.params.ratePerSecond.toString(),
    gracePeriod: event.params.gracePeriod,
    disputePolicy: event.params.disputePolicy,
  });
});

PlanRegistry_PlanDeactivated.handler(async ({ event, context }) => {
  const existing = await context.Plan.get(event.params.planId.toString());
  if (!existing) return;
  context.Plan.set({ ...existing, active: false });
});

// ─── StreamManager ────────────────────────────────────────────────────────

StreamManager_StreamCreated.handler(async ({ event, context }) => {
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

StreamManager_StreamCancelled.handler(async ({ event, context }) => {
  const existing = await context.Stream.get(event.params.streamId.toString());
  if (!existing) return;
  context.Stream.set({
    ...existing,
    consumed: event.params.consumed.toString(),
    status: "Cancelled",
    cancelledAt: event.block.timestamp,
  });
});

StreamManager_StreamToppedUp.handler(async ({ event, context }) => {
  const existing = await context.Stream.get(event.params.streamId.toString());
  if (!existing) return;
  const newDeposited = (BigInt(existing.deposited) + event.params.amount).toString();
  context.Stream.set({ ...existing, deposited: newDeposited });
});

StreamManager_StreamPaused.handler(async ({ event, context }) => {
  const existing = await context.Stream.get(event.params.streamId.toString());
  if (!existing) return;
  context.Stream.set({ ...existing, status: "Paused" });
});

StreamManager_StreamResumed.handler(async ({ event, context }) => {
  const existing = await context.Stream.get(event.params.streamId.toString());
  if (!existing) return;
  context.Stream.set({ ...existing, status: "Active" });
});

StreamManager_Claimed.handler(async ({ event, context }) => {
  const existing = await context.Stream.get(event.params.streamId.toString());
  if (existing) {
    const newClaimed = (BigInt(existing.claimed) + event.params.amount).toString();
    context.Stream.set({ ...existing, claimed: newClaimed });
  }

  const claimId = `${event.params.streamId}-${event.transaction.hash}-${event.logIndex}`;
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

DisputeResolver_DisputeOpened.handler(async ({ event, context }) => {
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

DisputeResolver_DisputeResponded.handler(async ({ event, context }) => {
  const existing = await context.Dispute.get(event.params.disputeId.toString());
  if (!existing) return;
  context.Dispute.set({
    ...existing,
    status: "Responded",
    evidenceHash: event.params.evidenceHash,
  });
});

DisputeResolver_DisputeSettled.handler(async ({ event, context }) => {
  const existing = await context.Dispute.get(event.params.disputeId.toString());
  if (!existing) return;
  const verdictMap: Record<number, string> = { 0: "Pending", 1: "Subscriber", 2: "Merchant", 3: "Split" };
  context.Dispute.set({
    ...existing,
    status: "Settled",
    verdict: verdictMap[event.params.verdict] ?? "Unknown",
    settledAt: event.block.timestamp,
  });
});
