"use client";

import Link from "next/link";
import { Money, formatPKR } from "@/components/ui/money";
import { BudgetBar } from "@/components/ui/budget-bar";
import { Sparkline } from "@/components/ui/sparkline";
import type { FolderWithStats } from "@/types";

interface FolderCardProps {
  folder: FolderWithStats;
  queryString?: string;
}

export function FolderCard({ folder, queryString }: FolderCardProps) {
  const href = queryString
    ? `/dashboard/folders/${folder.id}?${queryString}`
    : `/dashboard/folders/${folder.id}`;

  return (
    <Link href={href}>
      <div className="card-base interactive-card cursor-pointer" style={{ padding: 24 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={folder.name}>
              {folder.icon}
            </span>
            <h3
              className="font-semibold"
              style={{ color: "var(--text-primary)", fontSize: 16 }}
            >
              {folder.name}
            </h3>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-muted)",
            }}
          >
            {folder.item_count} items
          </span>
        </div>

        <div className="mb-3 flex items-end justify-between text-[var(--accent)]">
          <Money
            amount={folder.monthly_total}
            className="text-xl font-semibold"
          />
          {folder.sparkline_data && (
            <Sparkline data={folder.sparkline_data} className="h-8 w-16" />
          )}
        </div>

        {folder.budget_limit && folder.budget_limit > 0 && (
          <>
            <BudgetBar spent={folder.monthly_total} budget={folder.budget_limit} />
            <p
              className="text-xs mt-2 mono"
              style={{ color: "var(--text-muted)" }}
            >
              {formatPKR(folder.monthly_total)} of {formatPKR(folder.budget_limit)}
            </p>
          </>
        )}
      </div>
    </Link>
  );
}
