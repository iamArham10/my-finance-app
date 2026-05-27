"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, FolderKanban, Settings } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/manage", label: "Manage", icon: FolderKanban },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function MobileTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
      style={{
        height: 64,
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2"
            style={{ minWidth: 48 }}
          >
            <tab.icon
              className="w-5 h-5"
              style={{
                color: isActive ? "var(--accent)" : "var(--text-muted)",
              }}
            />
            <span
              className="text-[10px] font-medium"
              style={{
                color: isActive ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <div
                className="absolute bottom-1 w-1 h-1 rounded-full"
                style={{ background: "var(--accent)" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
