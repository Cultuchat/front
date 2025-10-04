import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar/index";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 md:ml-[var(--sidebar-width)] transition-all duration-300 p-4 md:p-8 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
