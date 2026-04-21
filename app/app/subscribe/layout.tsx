import { Providers } from "@/components/Providers";

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div style={{
        minHeight: "100vh",
        background: "var(--bg, #08111C)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}>
        {children}
      </div>
    </Providers>
  );
}
