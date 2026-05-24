"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  LayoutDashboard,
  Leaf,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/nav/theme-toggle";

interface SidebarProps {
  userName: string;
  userEmail: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  userName,
  userEmail,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-30 hidden flex-col transition-[width] duration-200 md:flex"
      style={{
        width: collapsed ? 76 : 220,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center gap-2 px-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex min-w-0 items-center gap-2",
            collapsed && "justify-center"
          )}
        >
          <Leaf className="h-5 w-5 shrink-0" style={{ color: "var(--accent)" }} />
          {!collapsed && (
            <span
              className="truncate text-lg font-semibold"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
            >
              Kharcha
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggleCollapsed}
            className="rounded-lg p-2 transition-colors hover:bg-[var(--bg-elevated)]"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {collapsed && (
          <button
            onClick={onToggleCollapsed}
            className="mb-3 flex h-10 w-full items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center rounded-lg text-sm font-medium transition-colors duration-150",
                collapsed ? "justify-center px-0" : "gap-3 px-3"
              )}
              style={{
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                background: isActive ? "var(--accent-light)" : "transparent",
              }}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div
        className="px-4 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "flex-col gap-3" : "gap-3"
          )}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{
              background: "var(--accent-light)",
              color: "var(--accent)",
            }}
          >
            {getInitials(userName || userEmail)}
          </div>
          {!collapsed && (
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {userName || "User"}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {userEmail}
            </p>
          </div>
          )}
          {!collapsed && <ThemeToggle />}
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md transition-colors duration-150"
            style={{ color: "var(--text-muted)" }}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
