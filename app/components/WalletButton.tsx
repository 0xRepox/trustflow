"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { arcTestnet } from "@/lib/wagmi";

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== arcTestnet.id;

  if (isWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: arcTestnet.id })}
        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm transition-colors"
      >
        Switch to Arc Testnet
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
      >
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected(), chainId: arcTestnet.id })}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
