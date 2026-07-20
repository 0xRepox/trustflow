/** Self-check for the funding decision logic. Run: npx tsx src/runway.test.ts */
import assert from "node:assert/strict";
import { decide, runwaySeconds } from "./runway.js";

const RATE = 100n; // micro-USDC per second

// 1000s of runway left, threshold 3600 → below floor, must top up.
{
  const d = decide({ usable: 100_000n, ratePerSecond: RATE }, 3600, 21_600);
  assert.equal(d.action, "topUp");
  assert.equal(runwaySeconds({ usable: 100_000n, ratePerSecond: RATE }), 1000);
  // Restores to target, not beyond: (21600 - 1000) * 100
  if (d.action === "topUp") assert.equal(d.amount, 2_060_000n);
}

// Comfortably funded → hold, no transaction.
{
  const d = decide({ usable: 10_000_000n, ratePerSecond: RATE }, 3600, 21_600);
  assert.equal(d.action, "hold");
}

// Drained → expired, not a top-up of the whole target.
{
  const d = decide({ usable: 0n, ratePerSecond: RATE }, 3600, 21_600);
  assert.equal(d.action, "expired");
}

// A zero rate must not divide by zero or trigger spurious top-ups.
{
  const d = decide({ usable: 0n, ratePerSecond: 0n }, 3600, 21_600);
  assert.equal(d.action, "hold");
}

// Exactly at the floor counts as needing a top-up, not holding.
{
  const d = decide({ usable: 360_000n, ratePerSecond: RATE }, 3600, 21_600);
  assert.equal(d.action, "topUp");
}

console.log("runway self-check passed");
