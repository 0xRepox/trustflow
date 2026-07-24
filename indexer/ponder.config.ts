import { createConfig } from "ponder";
import { fallback, http } from "viem";

import PlanRegistryAbi from "./abis/PlanRegistry.json";
import StreamManagerAbi from "./abis/StreamManager.json";
import DisputeResolverAbi from "./abis/DisputeResolver.json";

export default createConfig({
  chains: {
    arcTestnet: {
      id: 5042002,
      // Arc's Blockscout eth-rpc proxy (backed by its own indexed DB, not a
      // rate-limited node) served the entire ~86k-block historical range in
      // one eth_getLogs call with no chunking. Both the public RPC and
      // Alchemy's free tier proved unable to sustain a real backfill here:
      // the public endpoint throttled on request volume regardless of range
      // size, and Alchemy's free tier caps eth_getLogs at 10 blocks/call.
      //
      // But Blockscout hard-rejects the bare `eth_getLogs({ blockHash })`
      // call Ponder issues once realtime sync catches up to the tip (it
      // requires an address or topics filter: "Must supply one of address
      // and topics") — not a timeout, an immediate JSON-RPC error, so it
      // retries forever and permanently stalls new-block sync. The public
      // RPC answers that exact call fine, and at realtime cadence (one
      // query per new block) its throttling isn't the problem it is for a
      // wide historical backfill. Fall back to it for whatever shape
      // Blockscout can't serve.
      rpc: fallback([
        http(process.env.PONDER_RPC_URL ?? "https://testnet.arcscan.app/api/eth-rpc"),
        http("https://rpc.testnet.arc.network"),
      ]),
      // Without an explicit range, Ponder chunks conservatively and can issue
      // hundreds of small requests even against a provider that tolerates a
      // huge range in one call, burning through Blockscout's fairly tight
      // request quota before the backfill ever finishes. Confirmed directly
      // that a single call spanning the whole deploy-to-tip range succeeds.
      ethGetLogsBlockRange: 200_000,
    },
  },
  contracts: {
    PlanRegistry: {
      chain: "arcTestnet",
      abi: PlanRegistryAbi,
      address: "0xe1deB4a0504f2Baf27D2C225B3807a5743113A73",
      startBlock: 53293655,
    },
    StreamManager: {
      chain: "arcTestnet",
      abi: StreamManagerAbi,
      address: "0xf576f7aF812298B95bB440d6718A8b1d96d54395",
      startBlock: 53293655,
    },
    DisputeResolver: {
      chain: "arcTestnet",
      abi: DisputeResolverAbi,
      address: "0xF87B65f0bFe749b0BDd0834D3a808B04c241714F",
      startBlock: 53293655,
    },
  },
});
