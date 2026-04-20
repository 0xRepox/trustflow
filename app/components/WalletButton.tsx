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
        style={{
          padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(201,137,58,0.4)",
          background: "rgba(201,137,58,0.12)", color: "#C9893A",
          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        Switch to Arc Testnet
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        title="Click to disconnect"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 14px", borderRadius: 8,
          border: "1px solid var(--border)", background: "var(--surface)",
          fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg2)",
          cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(224,85,85,0.4)";
          e.currentTarget.style.color = "var(--error)";
          e.currentTarget.querySelector("span")!.textContent = "Disconnect";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.color = "var(--fg2)";
          e.currentTarget.querySelector("span")!.textContent = `${address.slice(0, 6)}…${address.slice(-4)}`;
        }}
      >
        <span
          style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--success)", flexShrink: 0,
            display: "inline-block",
          }}
        />
        <span>{address.slice(0, 6)}…{address.slice(-4)}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected(), chainId: arcTestnet.id })}
      style={{
        padding: "8px 16px", borderRadius: 8, border: "none",
        background: "var(--cta)", color: "#fff",
        fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 500,
        cursor: "pointer", transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cta-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--cta)")}
    >
      Connect Wallet
    </button>
  );
}
