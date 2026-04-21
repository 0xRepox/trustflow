import { createConfig } from "ponder";
import { http } from "viem";

import PlanRegistryAbi from "./abis/PlanRegistry.json";
import StreamManagerAbi from "./abis/StreamManager.json";
import DisputeResolverAbi from "./abis/DisputeResolver.json";

export default createConfig({
  database: {
    schema: "ponder",
  },
  chains: {
    arcTestnet: {
      id: 5042002,
      rpc: http(process.env.PONDER_RPC_URL ?? "https://rpc.testnet.arc.network"),
    },
  },
  contracts: {
    PlanRegistry: {
      chain: "arcTestnet",
      abi: PlanRegistryAbi,
      address: "0x276Ad3A0c2A96d2C135736c6Bde315Ff7d9F6648",
      startBlock: 37600000,
    },
    StreamManager: {
      chain: "arcTestnet",
      abi: StreamManagerAbi,
      address: "0xb4cC364d19eb4473852316Ec7B8bcc6D87EF3954",
      startBlock: 37600000,
    },
    DisputeResolver: {
      chain: "arcTestnet",
      abi: DisputeResolverAbi,
      address: "0xc2fd9616d9d8Af35a6D89290bed4838Da3F5083d",
      startBlock: 37600000,
    },
  },
});
