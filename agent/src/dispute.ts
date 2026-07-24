/**
 * Pure dispute math — no chain access, so the amounts an assessment would
 * freeze/bond are testable without a live wallet or contract.
 */

export interface StreamLedger {
  consumed: bigint;
  claimed: bigint;
  frozen: bigint;
}

/**
 * What's left to freeze: consumed but not yet claimed or already frozen.
 * Mirrors StreamManager's own `freezeForDispute` bound, so a call built from
 * this never reverts for exceeding it.
 */
export function computeAvailableToDispute(stream: StreamLedger): bigint {
  const available = stream.consumed - stream.claimed - stream.frozen;
  return available > 0n ? available : 0n;
}

/** DisputeResolver's bond is a fixed one-day charge at the stream's rate. */
export function computeDisputeBond(ratePerSecond: bigint): bigint {
  return ratePerSecond * 86_400n;
}
