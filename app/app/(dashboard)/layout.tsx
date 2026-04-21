import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ConnectRouter } from "@/components/ConnectRouter";
import { MobileNav } from "@/components/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .topbar-desktop { display: none !important; }
          .mobile-nav { display: flex !important; }
          .main-content { padding: 16px 16px 80px !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>
      <ConnectRouter />
      <div className="topbar-desktop">
        <TopBar />
      </div>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div className="sidebar-desktop" style={{ display: "flex" }}>
          <Sidebar />
        </div>
        <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
