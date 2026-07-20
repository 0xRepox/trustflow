# TrustFlow

Per-second USDC subscription billing built on Arc. Merchants set a streaming rate; subscribers deposit a runway and pay only for time consumed. Cancel anytime — unused funds return instantly, no forms, no waiting.

**Live app:** [app-omega-two-83.vercel.app](https://app-omega-two-83.vercel.app)

---

## Contracts (Arc Testnet)

| Contract | Address |
|---|---|
| `PlanRegistry` | [`0x276Ad3A0c2A96d2C135736c6Bde315Ff7d9F6648`](https://testnet.arcscan.app/address/0x276Ad3A0c2A96d2C135736c6Bde315Ff7d9F6648) |
| `StreamManager` | [`0xb4cC364d19eb4473852316Ec7B8bcc6D87EF3954`](https://testnet.arcscan.app/address/0xb4cC364d19eb4473852316Ec7B8bcc6D87EF3954) |
| `DisputeResolver` | [`0xc2fd9616d9d8Af35a6D89290bed4838Da3F5083d`](https://testnet.arcscan.app/address/0xc2fd9616d9d8Af35a6D89290bed4838Da3F5083d) |
| USDC | `0x3600000000000000000000000000000000000000` |

Chain ID `5042002` · Explorer: [testnet.arcscan.app](https://testnet.arcscan.app)

---

## How it works

**Merchants** create a plan with a per-second USDC rate and share a checkout link (`/subscribe/[planId]`).

**Subscribers** deposit a buffer — 1 week, 1 month, or 3 months of runway. The deposit drains second-by-second to the merchant. Cancel anytime; the unspent portion returns instantly via Arc's sub-second finality.

**Disputes** freeze the contested amount onchain. The merchant has 7 days to submit an evidence hash. An arbitrator settles — Subscriber, Merchant, or 50/50 Split. If the merchant doesn't respond, the subscriber wins by default and the frozen funds return automatically.

---

## Architecture

```
PlanRegistry
  ratePerSecond    USDC wei/s  ($30/mo ≈ 11 wei/s)
  gracePeriod      seconds of buffer before stream expires
  disputePolicy    per-plan dispute ruleset

StreamManager
  createStream     subscriber deposits and starts streaming
  cancel           instant refund of unconsumed deposit
  topUp            extend runway without interrupting the stream
  claim            merchant pulls accrued revenue
  freezeForDispute locks disputed funds via DisputeResolver

DisputeResolver
  openDispute      subscriber freezes amount + posts 1-day-rate bond
  respondToDispute merchant commits evidence hash (7-day window)
  arbitrate        arbitrator settles with verdict
  defaultSettle    auto-resolves for subscriber if merchant is silent
```

---

## Stack

| Layer | Tech |
|---|---|
| Contracts | Solidity 0.8.24, Foundry |
| Indexer | Ponder (Railway) |
| Frontend | Next.js 16, wagmi v3, viem, React Query |
| Agent | Node 20, viem — autonomous subscriber |
| Chain | Arc Testnet — EVM, chain ID 5042002 |

## Layout

```
src/       Solidity contracts
test/      Foundry unit, fuzz and invariant tests
script/    deploy + seed scripts
indexer/   Ponder indexer — events → GraphQL
app/       Next.js dashboard and checkout
agent/     autonomous subscriber agent
```

---

## Local development

### Contracts

```bash
forge build
forge test
forge coverage

cp .env.example .env   # set PRIVATE_KEY + ARC_TESTNET_RPC_URL
forge script script/DeployMonth2.s.sol --rpc-url arc_testnet --broadcast --slow -vvvv
```

### Indexer

No Docker required — Ponder runs an embedded database in development.

```bash
cd indexer
npm install
npm run dev    # GraphQL at localhost:42069
```

First sync backfills from block 37,600,000. On the public RPC that takes hours;
set `PONDER_RPC_URL` to a dedicated Arc endpoint before deploying.

### Agent

```bash
cd agent
npm install
cp .env.example .env   # set AGENT_PRIVATE_KEY + PLAN_ID
npm run dev
```

### Frontend

```bash
cd app
npm install
npm run dev    # localhost:3000
```

Copy `.env.local` and set `NEXT_PUBLIC_INDEXER_URL` to your indexer's GraphQL
endpoint. Defaults to `localhost:42069` for local development.
