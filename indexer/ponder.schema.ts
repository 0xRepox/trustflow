import { onchainTable, relations } from "ponder";

export const plan = onchainTable("plan", (t) => ({
  id: t.text().primaryKey(),
  owner: t.text().notNull(),
  ratePerSecond: t.text().notNull(),
  gracePeriod: t.integer().notNull().default(0),
  disputePolicy: t.integer().notNull().default(0),
  active: t.boolean().notNull().default(true),
  createdAt: t.integer().notNull(),
}));

export const stream = onchainTable("stream", (t) => ({
  id: t.text().primaryKey(),
  planId: t.text().notNull(),
  payer: t.text().notNull(),
  deposited: t.text().notNull(),
  claimed: t.text().notNull().default("0"),
  consumed: t.text().notNull().default("0"),
  status: t.text().notNull().default("Active"),
  createdAt: t.integer().notNull(),
  cancelledAt: t.integer(),
}));

export const claimEvent = onchainTable("claim_event", (t) => ({
  id: t.text().primaryKey(),
  streamId: t.text().notNull(),
  merchant: t.text().notNull(),
  amount: t.text().notNull(),
  timestamp: t.integer().notNull(),
  blockNumber: t.integer().notNull(),
}));

export const dispute = onchainTable("dispute", (t) => ({
  id: t.text().primaryKey(),
  streamId: t.text().notNull(),
  subscriber: t.text().notNull(),
  frozenAmount: t.text().notNull(),
  status: t.text().notNull().default("Open"),
  verdict: t.text(),
  evidenceHash: t.text(),
  openedAt: t.integer().notNull(),
  settledAt: t.integer(),
}));

export const planRelations = relations(plan, ({ many }) => ({
  streams: many(stream),
}));

export const streamRelations = relations(stream, ({ one, many }) => ({
  plan: one(plan, { fields: [stream.planId], references: [plan.id] }),
  claims: many(claimEvent),
  disputes: many(dispute),
}));

export const claimEventRelations = relations(claimEvent, ({ one }) => ({
  stream: one(stream, { fields: [claimEvent.streamId], references: [stream.id] }),
}));

export const disputeRelations = relations(dispute, ({ one }) => ({
  stream: one(stream, { fields: [dispute.streamId], references: [stream.id] }),
}));
