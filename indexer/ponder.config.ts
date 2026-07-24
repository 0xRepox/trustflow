import { createConfig } from "ponder";
import { http } from "viem";

import PlanRegistryAbi from "./abis/PlanRegistry.json";
import StreamManagerAbi from "./abis/StreamManager.json";
import DisputeResolverAbi from "./abis/DisputeResolver.json";

export default createConfig({
  chains: {
    arcTestnet: {
      id: 5042002,
      rpc: http(process.env.PONDER_RPC_URL ?? "https://rpc.testnet.arc.network"),
      // The public Arc RPC rate-limits aggressively — it crash-looped the
      // indexer during backfill. Poll gently and cap the getLogs window so we
      // stay under its ceiling. A dedicated PONDER_RPC_URL removes the need for
      // this, but these keep it alive on the free endpoint.
      pollingInterval: 10_000,
      ethGetLogsBlockRange: 1_000,
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
