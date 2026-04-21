# TrustFlow

Streaming subscription protocol on [Arc Network](https://arc.network). Replaces monthly billing with per-second USDC streams — subscribers pay only for time consumed, merchants receive real-time revenue with instant pro-rata refunds on cancel.

**Live on Arc Testnet** → [trustflow-production.up.railway.app](https://trustflow-production.up.railway.app)

---

## How it works

**Merchants** create subscription plans with a per-second USDC rate. They share a checkout link (`/subscribe/[planId]`) with subscribers.

**Subscribers** deposit a buffer (e.g. 1 week of runway), which streams to the merchant second-by-second. Cancel anytime — unspent deposit returns to the wallet instantly.

**Disputes** freeze the contested amount on-chain. The merchant has 7 days to submit evidence. A neutral arbitrator settles; if the merchant doesn't respond, the subscriber wins by default.

---

## Contracts (Arc Testnet)

| Contract | Address |
|---|---|
| `PlanRegistry` | [`0x276A…6648`](https://testnet.arcscan.app/address/0x276Ad3A0c2A96d2C135736c6Bde315Ff7d9F6648) |
| `StreamManager` | [`0xb4cC…3954`](https://testnet.arcscan.app/address/0xb4cC364d19eb4473852316Ec7B8bcc6D87EF3954) |
| `DisputeResolver` | [`0xc2fd…083d`](https://testnet.arcscan.app/address/0xc2fd9616d9d8Af35a6D89290bed4838Da3F5083d) |
| USDC | `0x3600000000000000000000000000000000000000` |

Chain ID: `5042002` · Explorer: [testnet.arcscan.app](https://testnet.arcscan.app)

---

## Architecture

```
PlanRegistry          — merchant creates/updates/deactivates plans
  └─ ratePerSecond    — USDC wei/s (e.g. $30/mo ≈ 11 wei-USDC/s)
  └─ gracePeriod      — seconds of tolerance after deposit depletes
  └─ disputePolicy    — 0=standard, configurable per plan

StreamManager         — core streaming engine
  └─ createStream     — subscriber deposits, stream starts
  └─ cancel           — instant refund of unconsumed deposit
  └─ topUp            — extend runway without interruption
  └─ claim            — merchant claims accrued revenue
  └─ freezeForDispute — locks funds pending resolution

DisputeResolver       — on-chain dispute arbitration
  └─ openDispute      — subscriber freezes contested amount + posts bond
  └─ respondToDispute — merchant submits evidence hash (7-day window)
  └─ arbitrate        — arbitrator settles (Subscriber / Merchant / Split)
  └─ defaultSettle    — auto-resolves for subscriber if merchant silent
```

**Rate unit**: USDC 6-decimal wei per second  
**Refund**: instant pro-rata on cancel (Arc sub-second finality)  
**Bond**: 1 day of stream rate — returned to subscriber if dispute upheld  
**Claim cap**: `ratePerSecond × 86400 × 2` per day  

---

## Stack

| Layer | Tech |
|---|---|
| Contracts | Solidity 0.8.24, Foundry |
| Indexer | [Envio HyperIndex](https://envio.dev), hosted on Railway |
| Frontend | Next.js 15 App Router, wagmi v2, viem, React Query |
| Chain | Arc Testnet (EVM, chain ID 5042002) |

---

## Local development

### Contracts

```bash
forge build
forge test
forge coverage        # target ≥ 80%

# Deploy
cp .env.example .env  # fill PRIVATE_KEY + ARC_TESTNET_RPC_URL
source .env
forge script script/DeployMonth2.s.sol --rpc-url arc_testnet --broadcast --slow -vvvv
```

### Indexer

```bash
cd indexer
pnpm install
pnpm codegen          # regenerate types from config.yaml + schema.graphql
pnpm dev              # requires Docker (Postgres + Hasura)
```

GraphQL endpoint: `http://localhost:8080/v1/graphql`

### Frontend

```bash
cd app
npm install
npm run dev           # http://localhost:3000
```

Set `NEXT_PUBLIC_ENVIO_URL` in `.env.local` — defaults to Railway in production, `localhost:42069/graphql` locally.

---

## User flows

**New wallet connects** → `ConnectRouter` checks Envio:  
- Has plans as owner → `/dashboard` (merchant)  
- Has streams as payer → `/account` (subscriber)  
- Neither → `/plans` (onboard as merchant)  

**Subscriber checkout**: merchant shares `/subscribe/[planId]` → subscriber approves USDC + creates stream → redirected to `/account`

**Merchant claim**: `/streams` → live per-second ticker → `Claim $X.XX` button → `StreamManager.claim`

---

## Deliverables

### Month 1
- `PlanRegistry` + `StreamManager` deployed, verified on arcscan
- Full Foundry TDD suite — 60+ tests, ≥ 88% coverage

### Month 2
- `DisputeResolver` — freeze/respond/arbitrate/default-settle
- `StreamManager` updated with freeze support
- Envio HyperIndex — Plans, Streams, Disputes, ClaimEvents queryable
- Next.js merchant dashboard — overview, plans, streams, disputes, account
- Subscribe page with adaptive runway display (rate-tier-based units)
- Smart connect routing (merchant vs subscriber detection)
- Tagged `v0.2.0-testnet`
