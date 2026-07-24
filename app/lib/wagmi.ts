import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { injected, walletConnect } from "wagmi/connectors";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
});

// Only wire WalletConnect when a real project id is present. An empty or
// placeholder id makes the connector throw on init and takes the whole app
// down, so injected (browser-extension) wallets must keep working without it.
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const hasWalletConnect = !!projectId && projectId !== "your_project_id_here";

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected(),
    ...(hasWalletConnect ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [arcTestnet.id]: http("https://rpc.testnet.arc.network"),
  },
});
