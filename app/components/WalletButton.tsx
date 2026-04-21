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
          padding: "6px 14px", borderRadius: 8,
          border: "1px solid rgba(201,137,58,0.4)",
          background: "rgba(201,137,58,0.12)", color: "#C9893A",
          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Switch to Arc Testnet
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Address chip */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "5px 12px", borderRadius: 8,
          border: "1px solid rgba(172,198,233,0.12)",
          background: "rgba(172,198,233,0.05)",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#4CAF7D", boxShadow: "0 0 6px #4CAF7D",
            flexShrink: 0, display: "inline-block",
          }}/>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff",
          }}>
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </div>

        {/* Disconnect button — separate, clearly labelled */}
        <button
          onClick={() => disconnect()}
          style={{
            padding: "5px 10px", borderRadius: 8,
            border: "1px solid rgba(172,198,233,0.1)",
            background: "transparent",
            fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(172,198,233,0.45)",
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#E05555";
            e.currentTarget.style.borderColor = "rgba(224,85,85,0.35)";
            e.currentTarget.style.background = "rgba(224,85,85,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(172,198,233,0.45)";
            e.currentTarget.style.borderColor = "rgba(172,198,233,0.1)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected(), chainId: arcTestnet.id })}
      style={{
        padding: "6px 16px", borderRadius: 8, border: "none",
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
