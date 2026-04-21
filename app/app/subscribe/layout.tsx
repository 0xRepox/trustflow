import { Providers } from "@/components/Providers";

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div style={{
        minHeight: "100vh",
        background: "var(--bg, #08111C)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}>
        {/* Logo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 28,
          textDecoration: "none",
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "linear-gradient(135deg, #1A3A5C 0%, #0D2035 100%)",
            border: "1px solid rgba(56,152,236,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2L7 7M7 7L4 5M7 7L10 5" stroke="#3898EC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 9.5C3 9.5 4.5 12 7 12C9.5 12 11 9.5 11 9.5" stroke="#4CAF7D" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            letterSpacing: "-0.01em",
          }}>
            TrustFlow
          </span>
        </div>

        {children}

        <p style={{
          marginTop: 20,
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 10,
          color: "rgba(172,198,233,0.3)",
          letterSpacing: "0.06em",
          textAlign: "center",
        }}>
          SECURED BY SMART CONTRACT · FUNDS STREAM PER-SECOND ONCHAIN
        </p>
      </div>
    </Providers>
  );
}
