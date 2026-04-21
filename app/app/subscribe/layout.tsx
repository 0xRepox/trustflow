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
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 28 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "rgba(56,152,236,0.12)",
            border: "1px solid rgba(56,152,236,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
              <circle cx="5" cy="24" r="3.5" fill="#ACC6E9"/>
              <path d="M8.5 24 C13 24 13 15 19.5 15 C26 15 26 33 32.5 33 C37 33 38.5 27 39.5 24"
                    stroke="#ACC6E9" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M37 19.5 L43 24 L37 28.5" stroke="#3898EC" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="43" cy="24" r="1.5" fill="#3898EC"/>
            </svg>
          </div>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "#fff", margin: 0 }}>
            TrustFlow
          </p>
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
