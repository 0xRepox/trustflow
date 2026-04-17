# TrustFlow

Streaming subscription protocol on [Arc Network](https://arc.network). Replaces monthly billing with per-second USDC streams — subscribers pay only for time consumed, merchants receive real-time revenue with no chargebacks.

## Quickstart

```bash
# Build
forge build

# Test
forge test

# Coverage
forge coverage

# Deploy to Arc Testnet
cp .env.example .env   # fill in PRIVATE_KEY and ARC_TESTNET_RPC_URL
source .env
forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast --slow -vvvv
```

## Contracts

| Contract | Description |
|---|---|
| `PlanRegistry` | Merchant-defined subscription plans (rate, grace period, dispute policy) |
| `StreamManager` | Core streaming: deposit, per-second accounting, cancel with pro-rata refund, merchant claim |

## Architecture

- Rate unit: USDC 6-decimal wei per second (`$30/month ≈ 11 wei-USDC/sec`)
- Cancel produces instant pro-rata refund (Arc sub-second finality)
- USDC blocklist safety: auto-pauses stream instead of reverting
- Daily claim cap: `ratePerSecond × 86400 × 2`
- Permit2 path for bounded per-stream allowances

## Network

- Chain: Arc Testnet (chain ID `5042002`)
- USDC: `0x3600000000000000000000000000000000000000`
- Explorer: https://testnet.arcscan.app

## Month 1 Deliverables

- Foundry scaffold with full TDD test suite
- `PlanRegistry` and `StreamManager` deployed to Arc Testnet
- Verified on arcscan
- ≥80% test coverage

See [TrustFlow_PRD.docx](./TrustFlow_PRD.docx) for full product spec.
