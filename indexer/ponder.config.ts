import { createConfig } from "ponder";
import { http } from "viem";

import PlanRegistryAbi from "./abis/PlanRegistry.json";
import StreamManagerAbi from "./abis/StreamManager.json";
import DisputeResolverAbi from "./abis/DisputeResolver.json";

export default createConfig({
  chains: {
    arcTestnet: {
      id: 5042002,
      rpc: http(process.env.PONDER_RPC_URL ?? "https://arc-testnet.g.alchemy.com/v2/aBUFIodHwlcOqs0-A7nLf"),
      // The Arc public RPC allows a big eth_getLogs range but proved flaky
      // under retry regardless of call size or volume. With startBlock now
      // near the tip (see below), the real backfill window is only a few
      // hundred blocks, so Alchemy's 10-block-per-call free-tier cap is cheap
      // to work within and its overall throughput is far more reliable.
      pollingInterval: 3_000,
      ethGetLogsBlockRange: 10,
    },
  },
  contracts: {
    PlanRegistry: {
      chain: "arcTestnet",
      abi: PlanRegistryAbi,
      address: "0xe1deB4a0504f2Baf27D2C225B3807a5743113A73",
      // Scanning from the deploy block (53293655) meant backfilling ~86k
      // largely-empty blocks, which reliably tripped the public RPC's
      // requests-per-second throttle. The one plan created in that range
      // (block 53379879) is already indexed from here; leave this alone.
      startBlock: 53379800,
    },
    StreamManager: {
      chain: "arcTestnet",
      abi: StreamManagerAbi,
      address: "0xf576f7aF812298B95bB440d6718A8b1d96d54395",
      // While PlanRegistry's window stayed tiny, the gap between it and "now"
      // kept growing as real chain time passed, and the indexer never caught
      // up to the first stream (confirmed on-chain at block 53407885) at
      // 10 blocks/call on Alchemy's free tier. Jumping just ahead of it
      // avoids re-crawling the dead gap in between.
      startBlock: 53407800,
    },
    DisputeResolver: {
      chain: "arcTestnet",
      abi: DisputeResolverAbi,
      address: "0xF87B65f0bFe749b0BDd0834D3a808B04c241714F",
      // No events yet; start alongside StreamManager so a dispute opened
      // around the same time as the stream isn't missed.
      startBlock: 53407800,
    },
  },
});
