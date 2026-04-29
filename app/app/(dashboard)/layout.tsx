import { Header } from "@/components/Header";
import { ConnectRouter } from "@/components/ConnectRouter";
import { MobileNav } from "@/components/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 768px) {
          .header-nav-links { display: none !important; }
          .mobile-nav { display: flex !important; }
          .main-content { padding: 16px 16px 80px !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>
      <ConnectRouter />
      <Header />
      <main className="main-content" style={{ flex: 1, padding: "32px 32px", maxWidth: 1200, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
