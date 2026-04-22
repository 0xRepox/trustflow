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
| Indexer | Envio HyperIndex (Railway) |
| Frontend | Next.js 15, wagmi v2, viem, React Query |
| Chain | Arc Testnet — EVM, chain ID 5042002 |

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

Requires Docker.

```bash
cd indexer
pnpm install
pnpm codegen   # regenerate types after changing config.yaml or schema.graphql
pnpm dev       # Postgres + Hasura + indexer at localhost:8080
```

### Frontend

```bash
cd app
npm install
npm run dev    # localhost:3000
```

Copy `.env.local` and set `NEXT_PUBLIC_ENVIO_URL`. Points to Railway by default.
