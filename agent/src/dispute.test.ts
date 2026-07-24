/** Self-check for dispute math. Run: npx tsx src/dispute.test.ts */
import assert from "node:assert/strict";
import { computeAvailableToDispute, computeDisputeBond } from "./dispute.js";

// Straightforward case: consumed minus claimed, nothing already frozen.
assert.equal(computeAvailableToDispute({ consumed: 1000n, claimed: 400n, frozen: 0n }), 600n);

// A prior freeze reduces what's left to dispute further.
assert.equal(computeAvailableToDispute({ consumed: 1000n, claimed: 400n, frozen: 300n }), 300n);

// Nothing left (or over-claimed by rounding elsewhere) must floor at zero,
// never go negative — a negative amount would underflow uint128 on-chain.
assert.equal(computeAvailableToDispute({ consumed: 1000n, claimed: 1000n, frozen: 0n }), 0n);
assert.equal(computeAvailableToDispute({ consumed: 500n, claimed: 600n, frozen: 0n }), 0n);

// Bond is exactly one day at the snapshotted rate.
assert.equal(computeDisputeBond(38n), 38n * 86_400n);
assert.equal(computeDisputeBond(0n), 0n);

console.log("dispute self-check passed");
