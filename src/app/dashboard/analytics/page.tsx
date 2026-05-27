"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFolders } from "@/lib/supabase/folders";
import {
  getItemCount,
  getLast6MonthsTrend,
  getMonthlyItemStats,
  getMonthlySpendingByFolder,
  getTop5ExpensiveItems,
} from "@/lib/supabase/items";
import { Money, formatPKR } from "@/components/ui/money";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { PeriodSelector } from "@/components/nav/period-selector";
import { ExportLink } from "@/components/export/export-report-actions";
import { getRangeLabel, getRangeSearch, parseIsoDate } from "@/lib/date-range";
import { useDateRangeParams } from "@/lib/use-date-range-params";
import {
  ArrowDownRight,
  ArrowUpRight,
  Folder,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type {
  Folder as FolderType,
  ItemWithFolder,
  MonthlyItemStats,
  MonthlySpending,
  MonthlyTrend,
} from "@/types";

type TrendData = { month: string } & Record<string, string | number>;

const EMPTY_MONTHLY_STATS: MonthlyItemStats = {
  current_total: 0,
  previous_total: 0,
  current_count: 0,
  previous_count: 0,
  average_item_total: 0,
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpending[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [topItems, setTopItems] = useState<ItemWithFolder[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyItemStats>(
    EMPTY_MONTHLY_STATS
  );
  const [totalItems, setTotalItems] = useState(0);
  const { range, setRange } = useDateRangeParams();
  
  const supabase = useMemo(() => createClient(), []);
  const periodLabel = useMemo(() => getRangeLabel(range), [range]);
  const exportHref = useMemo(
    () => `/export?${getRangeSearch(range)}`,
    [range]
  );

  const loadData = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      const [rawFolders, spending, trend, expensiveItems, itemCount, stats] = await Promise.all([
        getFolders(uid),
        getMonthlySpendingByFolder(uid, range),
        getLast6MonthsTrend(uid, range),
        getTop5ExpensiveItems(uid, range),
        getItemCount(uid),
        getMonthlyItemStats(uid, range),
      ]);

      setFolders(rawFolders);
      setMonthlySpending(spending);
      setMonthlyTrend(trend);
      setTopItems(expensiveItems);
      setTotalItems(itemCount);
      setMonthlyStats(stats);
    } catch (err: unknown) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        loadData(user.id);
      }
    };
    getUser();
  }, [supabase, loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[var(--bg-elevated)] animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const currentTotal = monthlySpending.reduce((sum, item) => sum + item.total, 0);
  const lastTotal = monthlyStats.previous_total;

  const difference = currentTotal - lastTotal;
  const percentChange = lastTotal === 0 ? 100 : (difference / lastTotal) * 100;
  const activeCategories = monthlySpending.length;
  const currentMonthShareTotal = monthlySpending.reduce(
    (sum, folder) => sum + folder.total,
    0
  );
  const peakMonth = monthlyTrend.reduce(
    (peak, month) => (month.total > peak.total ? month : peak),
    { month: "—", total: 0, by_folder: [] } as MonthlyTrend
  );
  const averageMonthlyTotal =
    monthlyTrend.length > 0
      ? monthlyTrend.reduce((sum, month) => sum + month.total, 0) /
        monthlyTrend.length
      : 0;
  const rangeStart = parseIsoDate(range.startDate);
  const rangeEnd = parseIsoDate(range.endDate);
  const daysInRange =
    Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000)) +
    1;
  const dailyAverage = daysInRange > 0 ? currentTotal / daysInRange : 0;
  
  // --- Donut Chart Data (Current Month Split) ---
  const donutData = monthlySpending
    .map((folder) => ({
      name: folder.folder_name,
      value: folder.total,
    }))
    .sort((a, b) => b.value - a.value);

  // --- Bar Chart Data (Last 6 Months Trend) ---
  const barChartData: TrendData[] = monthlyTrend.map((month) => {
    const entry: TrendData = { month: month.month };
    for (const folder of month.by_folder) {
      entry[folder.folder_name] = folder.total;
    }
    return entry;
  });
  const allCategories = Array.from(
    new Set(
      monthlyTrend.flatMap((month) =>
        month.by_folder.map((folder) => folder.folder_name)
      )
    )
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-heading">
          <h1>Analytics</h1>
          <p>Insights for {periodLabel}</p>
        </div>
        <div className="page-actions">
          <ExportLink href={exportHref} />
          <PeriodSelector range={range} onRangeChange={setRange} />
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="card-base" style={{ padding: 24 }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Total Spent
            </p>
            <TrendingUp className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <div style={{ color: "var(--accent)" }}>
            <Money amount={currentTotal} className="text-2xl font-semibold" />
          </div>
          <div className="flex items-center gap-1 mt-2">
            {difference > 0 ? (
              <ArrowUpRight
                className="w-3 h-3"
                style={{ color: "var(--danger)" }}
              />
            ) : (
              <ArrowDownRight
                className="w-3 h-3"
                style={{ color: "var(--success)" }}
              />
            )}
            <p className="text-xs" style={{ color: difference > 0 ? "var(--danger)" : "var(--success)" }}>
              {Math.abs(percentChange).toFixed(1)}% {difference > 0 ? "more" : "less"} than previous period
            </p>
          </div>
        </div>

        <div className="card-base" style={{ padding: 24 }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Items
            </p>
            <ReceiptText className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <p className="text-2xl font-semibold mono" style={{ color: "var(--text-primary)" }}>
            {monthlyStats.current_count}
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            {monthlyStats.previous_count} previous period
          </p>
        </div>

        <div className="card-base" style={{ padding: 24 }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Average Item
            </p>
            <WalletCards className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <p className="text-2xl font-semibold mono" style={{ color: "var(--text-primary)" }}>
            {formatPKR(monthlyStats.average_item_total)}
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            {formatPKR(dailyAverage)} daily average
          </p>
        </div>

        <div className="card-base" style={{ padding: 24 }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Active Categories
            </p>
            <Folder className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <p className="text-2xl font-semibold mono" style={{ color: "var(--text-primary)" }}>
            {activeCategories}
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            of {folders.length} folders used
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card-base" style={{ padding: 20 }}>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Largest Category
          </p>
          <p className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {donutData[0]?.name || "N/A"}
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            {donutData[0] ? formatPKR(donutData[0].value) : "—"}
          </p>
        </div>

        <div className="card-base" style={{ padding: 20 }}>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Peak Month
          </p>
          <p className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {peakMonth.month}
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            {formatPKR(peakMonth.total)}
          </p>
        </div>

        <div className="card-base" style={{ padding: 20 }}>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            6-Month Average
          </p>
          <p className="text-xl font-semibold mono" style={{ color: "var(--text-primary)" }}>
            {formatPKR(averageMonthlyTotal)}
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            {totalItems} total items logged
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="card-base" style={{ padding: 24 }}>
          <h2 className="text-base font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
            Spending by Category
          </h2>
          {donutData.length > 0 ? (
            <DonutChart data={donutData} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-sm" style={{ color: "var(--text-muted)" }}>
              No data for this period
            </div>
          )}
        </div>

        <div className="card-base" style={{ padding: 24 }}>
          <h2 className="text-base font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
            6-Month Trend
          </h2>
          {allCategories.length > 0 ? (
            <BarChart data={barChartData} categories={allCategories} />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-sm" style={{ color: "var(--text-muted)" }}>
              No data available
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4">
        <div className="card-base" style={{ padding: 24 }}>
          <h2 className="text-base font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
            Category Breakdown
          </h2>

          {monthlySpending.length > 0 ? (
            <div className="space-y-4">
              {monthlySpending.map((folder) => {
                const share =
                  currentMonthShareTotal > 0
                    ? Math.round((folder.total / currentMonthShareTotal) * 100)
                    : 0;
                return (
                  <div key={folder.folder_id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span>{folder.folder_icon}</span>
                        <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {folder.folder_name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="mono text-sm font-semibold text-[var(--accent)]">
                          {formatPKR(folder.total)}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {share}%
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
            <div className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
              No category data for this period
            </div>
          )}
        </div>

        <div className="card-base" style={{ padding: 24 }}>
          <h2 className="text-base font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
            Top 5 Most Expensive Items
          </h2>
          
          {topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[var(--bg-elevated)]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div 
                      className="w-7 h-7 shrink-0 rounded flex items-center justify-center text-xs font-semibold"
                      style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}
                    >
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {item.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        <span className="flex items-center gap-1"><Folder className="w-3 h-3" /> {item.folder_name}</span>
                        <span>{new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold mono" style={{ color: "var(--accent)" }}>
                      {formatPKR(item.total)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
              No items logged yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
