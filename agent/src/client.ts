import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, type AgentConfig } from "./config.js";

export interface AgentClients {
  publicClient: ReturnType<typeof createPublicClient>;
  /** Present only in local mode; Circle mode reads on-chain but signs via CLI. */
  walletClient?: ReturnType<typeof createWalletClient>;
  address: Address;
}

export function createClients(config: AgentConfig): AgentClients {
  const transport = http(config.rpcUrl);
  const publicClient = createPublicClient({ chain: arcTestnet, transport });

  if (config.walletMode === "circle") {
    return { publicClient, address: config.circleWalletAddress! };
  }

  const account = privateKeyToAccount(config.privateKey!);
  return {
    publicClient,
    walletClient: createWalletClient({ account, chain: arcTestnet, transport }),
    address: account.address,
  };
}
