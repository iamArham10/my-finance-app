"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileHeader } from "@/components/nav/mobile-header";
import { MobileTabs } from "@/components/nav/mobile-tabs";

interface DashboardShellProps {
  children: ReactNode;
  userName: string;
  userEmail: string;
}

const SIDEBAR_COLLAPSED_KEY = "kharcha-sidebar-collapsed";

export function DashboardShell({
  children,
  userName,
  userEmail,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  });

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <MobileHeader userName={userName} userEmail={userEmail} />

      <main
        className="pb-20 transition-[margin-left] duration-200 md:ml-[var(--sidebar-offset)] md:pb-8"
        style={{
          minHeight: "100vh",
          "--sidebar-offset": `${collapsed ? 76 : 220}px`,
        } as CSSProperties}
      >
        <div
          className="page-enter mx-auto px-4 py-6 md:px-6 md:py-8"
          style={{ maxWidth: 1120 }}
        >
          {children}
        </div>
      </main>

      <MobileTabs />
    </div>
  );
}
