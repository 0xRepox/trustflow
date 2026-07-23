# TrustFlow Agent

Autonomous subscriber. Funds, monitors, and cancels its own stream — after the
wallet is funded once, no human signs anything.

## Why this exists

Agents can't hold credit cards. The alternatives all assume a human is present:
prepaid API credits strand capital, postpaid invoicing needs an account holder,
and per-request payment (x402) doesn't cover continuous consumption — a
six-hour job, a persistent data feed, a long-running service dependency.

The harder gap is recourse. An agent receiving degraded service just keeps
paying; a human would notice and dispute. This agent can freeze payment itself
and escalate onchain, which is what makes handing it a budget safe.

## Wallet

Two signing paths, one env var apart:

- **Circle Agent Wallet (production).** Writes go through Circle CLI. The MPC key
  shares never enter this process, and Circle enforces the wallet's spending
  policy before any transaction is submitted — that policy is the budget you hand
  the agent. Set `CIRCLE_WALLET_ADDRESS`.
- **Raw key (local dev / tests).** The agent holds a private key directly. Set
  `AGENT_PRIVATE_KEY` and leave `CIRCLE_WALLET_ADDRESS` empty.

Reads always use viem against Arc; only writes differ between the two.

### Circle wallet setup

```bash
npm install -g @circle-fin/cli
circle wallet login <email> --init          # returns a request id
circle wallet login --request <id> --otp <code>
circle wallet create --type agent --testnet
circle wallet list --type agent             # copy the address
```

Fund that address with testnet USDC — on Arc the same balance pays gas, so the
agent can never be funded-but-stuck holding the wrong asset. Optionally scope it:

```bash
circle wallet limit set --address <addr> --chain ARC-TESTNET \
  --policy-type transfer --rule-type amount --daily <usdc>
```

## Lifecycle

```
adoptStream   on start, resume an existing live stream if one exists
openStream    approve USDC, deposit a runway, start consuming
monitor       read position each tick, compute remaining runway
topUp         restore runway to target before it expires
assessService detect degradation → freeze funds → open dispute   (TODO)
cancelStream  stop, reclaim the unspent deposit instantly        (TODO)
```

State is read fresh from chain every tick, so a restart adopts the existing
stream rather than opening a duplicate.

## Run

```bash
npm install
cp .env.example .env    # set CIRCLE_WALLET_ADDRESS (or AGENT_PRIVATE_KEY) + PLAN_ID
npm run dev
```

## Checks

```bash
npx tsx src/runway.test.ts     # funding decision self-check
npx tsx src/executor.test.ts   # Circle CLI command construction
npm run typecheck
```

## Status

Implemented: dual-mode wallet (Circle CLI + raw key), config validation, chain
clients, runway maths, the poll loop, `openStream`, `adoptExistingStream`,
`topUp`.

The live Circle path can't run in CI — it needs an authenticated wallet — so the
command construction is covered by `executor.test.ts` instead. Stubbed
(`TODO` in `subscriber.ts`): `cancelStream`, and `assessService`, the dispute
trigger that is the differentiator — build it next.
