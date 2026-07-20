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

## Lifecycle

```
openStream    approve USDC, deposit a runway, start consuming
monitor       read position each tick, compute remaining runway
topUp         restore runway to target before it expires
assessService detect degradation → freeze funds → open dispute
cancelStream  stop, reclaim the unspent deposit instantly
```

State is read fresh from chain every tick, so a restart adopts the existing
stream rather than opening a duplicate.

## Run

```bash
npm install
cp .env.example .env    # set AGENT_PRIVATE_KEY and PLAN_ID
npm run dev
```

The wallet needs testnet USDC. On Arc that same balance pays gas too, so the
agent can never be funded-but-stuck holding the wrong asset.

## Checks

```bash
npx tsx src/runway.test.ts   # funding decision self-check
npm run typecheck
```

## Status

Implemented: config validation, chain clients, runway maths, the poll loop.

Stubbed (marked `TODO` in `subscriber.ts`): `openStream`, `adoptExistingStream`,
`cancelStream`, `assessService`. The dispute path is the differentiator — build
it before the others.
