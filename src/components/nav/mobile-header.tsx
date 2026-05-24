"use client";

import { useMemo } from "react";
import { Leaf, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MobileHeaderProps {
  userName: string;
  userEmail: string;
}

export function MobileHeader({ userName, userEmail }: MobileHeaderProps) {
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
    <header
      className="md:hidden flex items-center justify-between px-4 sticky top-0 z-30"
      style={{
        height: 56,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-2">
        <Leaf className="w-5 h-5" style={{ color: "var(--accent)" }} />
        <span
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          Kharcha
        </span>
      </div>

      <Popover>
        <PopoverTrigger
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{
            background: "var(--accent-light)",
            color: "var(--accent)",
          }}
          aria-label="User menu"
        >
          {getInitials(userName || userEmail)}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-48 p-2"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="px-2 py-1.5 mb-1">
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
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors duration-150"
            style={{ color: "var(--danger)" }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </PopoverContent>
      </Popover>
    </header>
  );
}
