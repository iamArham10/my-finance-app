"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFoldersWithStats, createFolder } from "@/lib/supabase/folders";
import { getMonthlyItemStats, getRecentItems } from "@/lib/supabase/items";
import { FolderGrid } from "@/components/folders/folder-grid";
import { FolderForm } from "@/components/folders/folder-form";
import { ItemForm } from "@/components/items/item-form";
import { PeriodSelector } from "@/components/nav/period-selector";
import { ExportLink } from "@/components/export/export-report-actions";
import { useKeyboardShortcutsContext } from "@/components/keyboard-shortcuts-provider";
import { Money, formatPKR } from "@/components/ui/money";
import { BudgetBar } from "@/components/ui/budget-bar";
import { SavingsGoalsWidget } from "@/components/savings/savings-goals-widget";
import { RecurringWidget } from "@/components/recurring/recurring-widget";
import { getRangeLabel, getRangeSearch } from "@/lib/date-range";
import { useDateRangeParams } from "@/lib/use-date-range-params";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  FolderOpen,
  Plus,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import type {
  CreateFolderData,
  FolderWithStats,
  ItemWithFolder,
  MonthlyItemStats,
  CreateItemData,
} from "@/types";

const EMPTY_MONTHLY_STATS: MonthlyItemStats = {
  current_total: 0,
  previous_total: 0,
  current_count: 0,
  previous_count: 0,
  average_item_total: 0,
};

export default function DashboardPage() {
  const [folders, setFolders] = useState<FolderWithStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyItemStats>(
    EMPTY_MONTHLY_STATS
  );
  const [recentItems, setRecentItems] = useState<ItemWithFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { range, setRange } = useDateRangeParams();
  const { registerGlobalShortcuts } = useKeyboardShortcutsContext();
  
  const supabase = useMemo(() => createClient(), []);
  const rangeQueryString = useMemo(() => getRangeSearch(range), [range]);
  const exportHref = useMemo(
    () => `/export?${rangeQueryString}`,
    [rangeQueryString]
  );
  const periodLabel = useMemo(() => getRangeLabel(range), [range]);

  const loadFolders = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      const [foldersWithStats, stats, recent] = await Promise.all([
        getFoldersWithStats(uid, range),
        getMonthlyItemStats(uid, range),
        getRecentItems(uid, 5, range),
      ]);

      setFolders(foldersWithStats);
      setMonthlyStats(stats);
      setRecentItems(recent);
    } catch (err: unknown) {
      console.error("Failed to load folders:", err);
      toast.error("Failed to load folders");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadFolders(user.id);
      }
    };
    getUser();
  }, [supabase, loadFolders]);

  useEffect(() => {
    registerGlobalShortcuts([
      {
        key: "f",
        description: "New Folder",
        category: "Actions",
        action: () => setShowCreateModal(true),
      },
      {
        key: "c",
        description: "New Item",
        category: "Actions",
        action: () => setShowItemModal(true),
      },
    ]);
  }, [registerGlobalShortcuts]);

  const handleCreateFolder = async (data: CreateFolderData) => {
    if (!userId) return;
    await createFolder(userId, data);
    toast.success("Folder created!");
    loadFolders(userId);
  };

  const handleCreateItem = async (data: CreateItemData) => {
    if (!userId) return;
    const { createItem } = await import("@/lib/supabase/items");
    await createItem(userId, data);
    toast.success("Item added!");
    loadFolders(userId);
  };

  // Calculate summary stats
  const totalSpent = monthlyStats.current_total;
  const totalBudget = folders.reduce(
    (sum, folder) => sum + (folder.budget_limit ?? 0),
    0
  );
  const budgetUsedPercent =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const monthDifference = totalSpent - monthlyStats.previous_total;
  const monthChangePercent =
    monthlyStats.previous_total > 0
      ? Math.round((monthDifference / monthlyStats.previous_total) * 100)
      : totalSpent > 0
        ? 100
        : 0;
  const itemDifference =
    monthlyStats.current_count - monthlyStats.previous_count;
  const topFolders = [...folders]
    .filter((folder) => folder.monthly_total > 0)
    .sort((a, b) => b.monthly_total - a.monthly_total)
    .slice(0, 4);

  // Find folder closest to budget
  const budgetAlertFolder = folders
    .filter((f) => f.budget_limit && f.budget_limit > 0)
    .sort((a, b) => {
      const aPercent = a.monthly_total / (a.budget_limit || 1);
      const bPercent = b.monthly_total / (b.budget_limit || 1);
      return bPercent - aPercent;
    })[0];

  return (
    <div>
      {/* Page Title */}
      <div className="page-header">
        <div className="page-heading">
          <h1>Dashboard</h1>
          <p>{periodLabel}</p>
        </div>
        <div className="page-actions">
          <ExportLink href={exportHref} />
          <PeriodSelector range={range} onRangeChange={setRange} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Total Spent */}
        <div
          className="card-base"
          style={{
            padding: 24,
            background: "var(--accent-light)",
            borderColor: "transparent",
          }}
        >
          <p
            className="text-sm font-medium mb-2"
            style={{ color: "var(--accent-text)" }}
          >
            Total Spent
          </p>
          <div style={{ color: "var(--accent)" }}>
            <Money amount={totalSpent} className="text-2xl font-semibold" />
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--accent-text)", opacity: 0.7 }}>
            spent in {periodLabel}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: monthDifference > 0 ? "var(--danger)" : "var(--success)" }}>
            {monthDifference > 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(monthChangePercent)}% {monthDifference > 0 ? "more" : "less"} than previous period
          </div>
        </div>

        {/* Monthly Items */}
        <div className="card-base" style={{ padding: 24 }}>
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Items
            </p>
            <ReceiptText
              className="w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
          <p
            className="text-2xl font-semibold mono"
            style={{ color: "var(--text-primary)" }}
          >
            {monthlyStats.current_count}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {Math.abs(itemDifference)} {itemDifference >= 0 ? "more" : "fewer"} than previous period
          </p>
        </div>

        {/* Average Item */}
        <div className="card-base" style={{ padding: 24 }}>
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Average Item
            </p>
            <WalletCards
              className="w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
          <p
            className="text-2xl font-semibold mono"
            style={{ color: "var(--text-primary)" }}
          >
            {formatPKR(monthlyStats.average_item_total)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            across {folders.length} folders
          </p>
        </div>

        {/* Budget Alert */}
        <div className="card-base" style={{ padding: 24 }}>
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Budget Alert
            </p>
            <AlertTriangle
              className="w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
          {budgetAlertFolder ? (
            <>
              <BudgetBar
                spent={budgetAlertFolder.monthly_total}
                budget={budgetAlertFolder.budget_limit!}
                className="mb-2"
              />
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {budgetAlertFolder.icon} {budgetAlertFolder.name} ·{" "}
                <span className="mono">
                  {Math.round(
                    (budgetAlertFolder.monthly_total /
                      budgetAlertFolder.budget_limit!) *
                      100
                  )}
                  %
                </span>{" "}
                of {formatPKR(budgetAlertFolder.budget_limit!)}
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No budgets configured
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-4 mb-8">
        <div className="card-base" style={{ padding: 24 }}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Spending Focus
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Categories driving this period&apos;s total
              </p>
            </div>
            {totalBudget > 0 && (
              <span className="mono rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                {budgetUsedPercent}% budget
              </span>
            )}
          </div>

          {topFolders.length > 0 ? (
            <div className="space-y-4">
              {topFolders.map((folder) => {
                const share =
                  totalSpent > 0
                    ? Math.round((folder.monthly_total / totalSpent) * 100)
                    : 0;
                return (
                  <div key={folder.id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-lg">{folder.icon}</span>
                        <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {folder.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="mono text-sm font-semibold text-[var(--accent)]">
                          {formatPKR(folder.monthly_total)}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {share}% of period
                        </p>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Add items to see which folders are driving your spend.
            </p>
          )}
        </div>

        <div className="card-base" style={{ padding: 24 }}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Recent Activity
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Latest logged expenses
              </p>
            </div>
            <FolderOpen className="h-4 w-4 text-[var(--text-muted)]" />
          </div>

          {recentItems.length > 0 ? (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-[var(--bg-elevated)] px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-lg">{item.folder_icon}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {item.folder_name} · {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <p className="mono shrink-0 text-sm font-semibold text-[var(--accent)]">
                    {formatPKR(item.total)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Recent items will appear here once you start logging expenses.
            </p>
          )}
        </div>
      </div>

      {/* Recurring & Savings */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecurringWidget folders={folders} />
        <SavingsGoalsWidget />
      </div>

      {/* Folder Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Folders
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Category totals for {periodLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowItemModal(true)}
              className="btn-ghost hidden sm:inline-flex"
              disabled={folders.length === 0}
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              New Folder
            </button>
          </div>
        </div>

        <FolderGrid
          folders={folders}
          loading={loading}
          onCreateFolder={() => setShowCreateModal(true)}
          queryString={rangeQueryString}
        />
      </div>

      {/* Create Folder Modal */}
      <FolderForm
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateFolder}
      />

      <ItemForm
        open={showItemModal}
        onOpenChange={setShowItemModal}
        onSubmit={handleCreateItem}
        folders={folders}
      />
    </div>
  );
}
