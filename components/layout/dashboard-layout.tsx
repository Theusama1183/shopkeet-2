"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  storeId: string;
  storeName: string;
  storeSubdomain: string;
}

export function DashboardLayout({
  children,
  storeId,
  storeName,
  storeSubdomain,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const sidebarW = isMobile ? 0 : isCollapsed ? 64 : 240;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar
        storeId={storeId}
        storeName={storeName}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((p) => !p)}
        isMobile={isMobile}
      />

      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarW }}
      >
        <Topbar
          storeName={storeName}
          storeSubdomain={storeSubdomain}
          isCollapsed={isCollapsed}
          onToggleSidebar={() => setIsCollapsed((p) => !p)}
          isMobile={isMobile}
        />

        <main className="flex-1 p-6">
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
