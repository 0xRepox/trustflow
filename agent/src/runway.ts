/**
 * Runway maths. Pure functions — no chain access — so the decision logic is
 * testable without a node.
 */

export interface StreamPosition {
  /** Unconsumed deposit still held by the stream, in USDC micro-units. */
  usable: bigint;
  /** Snapshotted rate for this stream, in USDC micro-units per second. */
  ratePerSecond: bigint;
}

export type Decision =
  | { action: "hold"; runwaySeconds: number }
  | { action: "topUp"; amount: bigint; runwaySeconds: number }
  | { action: "expired" };

/** Seconds of service the remaining balance still buys. */
export function runwaySeconds(position: StreamPosition): number {
  if (position.ratePerSecond === 0n) return Number.POSITIVE_INFINITY;
  return Number(position.usable / position.ratePerSecond);
}

/**
 * Decide what the agent should do about its funding position.
 *
 * Deliberately conservative: it tops up to `targetSeconds` rather than to some
 * multiple of spend, so a misconfigured rate can't drain the wallet in one call.
 */
export function decide(
  position: StreamPosition,
  minSeconds: number,
  targetSeconds: number,
): Decision {
  const remaining = runwaySeconds(position);

  if (remaining <= 0) return { action: "expired" };
  if (remaining > minSeconds) return { action: "hold", runwaySeconds: remaining };

  const deficitSeconds = BigInt(Math.ceil(targetSeconds - remaining));
  return {
    action: "topUp",
    amount: deficitSeconds * position.ratePerSecond,
    runwaySeconds: remaining,
  };
}
