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
      // The Arc public RPC allows a 10,000-block eth_getLogs range (confirmed
      // directly), unlike Alchemy's free tier (10-block cap, unusable for a
      // backfill this wide). Its earlier crash was a requests-per-second
      // throttle tripped by many small-range calls, so fewer, larger calls
      // avoid it rather than provoke it. Stay safely under the 10k ceiling.
      pollingInterval: 5_000,
      ethGetLogsBlockRange: 5_000,
    },
  },
  contracts: {
    PlanRegistry: {
      chain: "arcTestnet",
      abi: PlanRegistryAbi,
      address: "0xe1deB4a0504f2Baf27D2C225B3807a5743113A73",
      // Scanning from the deploy block (53293655) meant backfilling ~86k
      // largely-empty blocks, fanned out across 3 contracts x several event
      // topics, which reliably tripped the public RPC's requests-per-second
      // throttle regardless of range size. Confirmed via direct eth_getLogs
      // scans that the only event in that whole range is the one plan
      // created at block 53379879 (PlanRegistry only; Stream/Dispute have
      // none). Starting close to it cuts the backfill to nearly zero.
      startBlock: 53379800,
    },
    StreamManager: {
      chain: "arcTestnet",
      abi: StreamManagerAbi,
      address: "0xf576f7aF812298B95bB440d6718A8b1d96d54395",
      // Scanning from the deploy block (53293655) meant backfilling ~86k
      // largely-empty blocks, fanned out across 3 contracts x several event
      // topics, which reliably tripped the public RPC's requests-per-second
      // throttle regardless of range size. Confirmed via direct eth_getLogs
      // scans that the only event in that whole range is the one plan
      // created at block 53379879 (PlanRegistry only; Stream/Dispute have
      // none). Starting close to it cuts the backfill to nearly zero.
      startBlock: 53379800,
    },
    DisputeResolver: {
      chain: "arcTestnet",
      abi: DisputeResolverAbi,
      address: "0xF87B65f0bFe749b0BDd0834D3a808B04c241714F",
      // Scanning from the deploy block (53293655) meant backfilling ~86k
      // largely-empty blocks, fanned out across 3 contracts x several event
      // topics, which reliably tripped the public RPC's requests-per-second
      // throttle regardless of range size. Confirmed via direct eth_getLogs
      // scans that the only event in that whole range is the one plan
      // created at block 53379879 (PlanRegistry only; Stream/Dispute have
      // none). Starting close to it cuts the backfill to nearly zero.
      startBlock: 53379800,
    },
  },
});
