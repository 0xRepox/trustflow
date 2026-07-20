import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, type AgentConfig } from "./config.js";

export interface AgentClients {
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
  address: Address;
}

export function createClients(config: AgentConfig): AgentClients {
  const account = privateKeyToAccount(config.privateKey);
  const transport = http(config.rpcUrl);

  return {
    publicClient: createPublicClient({ chain: arcTestnet, transport }),
    walletClient: createWalletClient({ account, chain: arcTestnet, transport }),
    address: account.address,
  };
}
