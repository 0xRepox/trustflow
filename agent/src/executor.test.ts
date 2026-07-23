/** Self-check for Circle CLI command construction. Run: npx tsx src/executor.test.ts */
import assert from "node:assert/strict";
import { buildExecuteArgs, circleArg, parseTxHash } from "./executor.js";

const ADDR = "0xf576f7aF812298B95bB440d6718A8b1d96d54395" as const;
const USDC = "0x3600000000000000000000000000000000000000" as const;

// bigint args must serialise as plain decimal — not hex, not "123n".
assert.equal(circleArg(1000000n), "1000000");
assert.equal(circleArg(true), "true");
assert.equal(circleArg(ADDR), ADDR);

// approve(address,uint256): signature and args land in order, before the flags.
{
  const args = buildExecuteArgs(
    { contract: USDC, signature: "approve(address,uint256)", args: [ADDR, 5_000_000n] },
    ADDR,
    "ARC-TESTNET",
    "https://rpc.testnet.arc.network",
  );
  assert.deepEqual(args, [
    "wallet",
    "execute",
    "approve(address,uint256)",
    ADDR,
    "5000000",
    "--contract",
    USDC,
    "--address",
    ADDR,
    "--chain",
    "ARC-TESTNET",
    "--rpc-url",
    "https://rpc.testnet.arc.network",
  ]);
}

// A value-bearing call appends --amount; a valueless one must not.
{
  const withValue = buildExecuteArgs(
    { contract: ADDR, signature: "topUp(uint256,uint128)", args: [1n, 100n], value: 100n },
    ADDR,
    "ARC-TESTNET",
    "https://rpc",
  );
  assert.ok(withValue.includes("--amount"));
  assert.equal(withValue[withValue.indexOf("--amount") + 1], "100");

  const noValue = buildExecuteArgs(
    { contract: ADDR, signature: "cancel(uint256)", args: [1n] },
    ADDR,
    "ARC-TESTNET",
    "https://rpc",
  );
  assert.ok(!noValue.includes("--amount"));
}

// Hash extraction: finds the 64-hex hash, ignores shorter hex, fails loudly.
assert.equal(
  parseTxHash("Submitted. tx: 0x" + "a".repeat(64) + " done"),
  "0x" + "a".repeat(64),
);
assert.throws(() => parseTxHash("error: could not submit (chain ARC-TESTNET)"));

console.log("executor self-check passed");
