import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
