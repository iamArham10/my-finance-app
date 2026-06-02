import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  getItemCount,
  getItemsWithFoldersPageForUser,
  getLast6MonthsTrend,
  getMonthlyItemStats,
  getMonthlySpendingByFolder,
  getRecentItems,
  getTop5ExpensiveItems,
} from "@/lib/supabase/items";
import { getFolderById, getFolders, getFoldersWithStats } from "@/lib/supabase/folders";
import type {
  DateRange,
  Folder,
  FolderWithStats,
  Item,
  ItemWithFolder,
  MonthlyItemStats,
  MonthlySpending,
  MonthlyTrend,
} from "@/types";

const DASHBOARD_CACHE_LIFE = {
  stale: 300,
  revalidate: 3600,
  expire: 86400,
};

export type PaginatedItems = {
  items: ItemWithFolder[];
  nextCursor: string | null;
};

export type DashboardSummary = {
  folders: FolderWithStats[];
  monthlyStats: MonthlyItemStats;
  recentItems: ItemWithFolder[];
};

export type ManageInitialData = {
  folders: FolderWithStats[];
  items: ItemWithFolder[];
  nextCursor: string | null;
};

export type AnalyticsInitialData = {
  folders: Folder[];
  monthlySpending: MonthlySpending[];
  monthlyTrend: MonthlyTrend[];
  topItems: ItemWithFolder[];
  monthlyStats: MonthlyItemStats;
  totalItems: number;
};

export type FolderDetailInitialData = {
  folder: Folder;
  items: Item[];
};

function toItem(item: ItemWithFolder): Item {
  return {
    id: item.id,
    folder_id: item.folder_id,
    user_id: item.user_id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    unit: item.unit,
    total: item.total,
    date: item.date,
    note: item.note,
    tags: item.tags,
    created_at: item.created_at,
  };
}

export async function getDashboardSummary({
  userId,
  range,
}: {
  userId: string;
  range: DateRange;
}): Promise<DashboardSummary> {
  "use cache";
  cacheLife(DASHBOARD_CACHE_LIFE);
  cacheTag(`user:${userId}:folders`);
  cacheTag(`user:${userId}:items`);
  cacheTag(`user:${userId}:summary`);

  const [folders, monthlyStats, recentItems] = await Promise.all([
    getFoldersWithStats(userId, range),
    getMonthlyItemStats(userId, range),
    getRecentItems(userId, 5, range),
  ]);

  return { folders, monthlyStats, recentItems };
}

export async function getManageInitialData({
  userId,
  range,
  limit = 100,
  cursor,
}: {
  userId: string;
  range: DateRange;
  limit?: number;
  cursor?: string;
}): Promise<ManageInitialData> {
  "use cache";
  cacheLife(DASHBOARD_CACHE_LIFE);
  cacheTag(`user:${userId}:folders`);
  cacheTag(`user:${userId}:items`);
  cacheTag(`user:${userId}:summary`);

  const [folders, page] = await Promise.all([
    getFoldersWithStats(userId, range),
    getItemsWithFoldersPageForUser({ userId, range, limit, cursor }),
  ]);

  return {
    folders,
    items: page.items,
    nextCursor: page.nextCursor,
  };
}

export async function getAnalyticsInitialData({
  userId,
  range,
}: {
  userId: string;
  range: DateRange;
}): Promise<AnalyticsInitialData> {
  "use cache";
  cacheLife(DASHBOARD_CACHE_LIFE);
  cacheTag(`user:${userId}:folders`);
  cacheTag(`user:${userId}:items`);
  cacheTag(`user:${userId}:summary`);

  const [folders, monthlySpending, monthlyTrend, topItems, totalItems, monthlyStats] =
    await Promise.all([
      getFolders(userId),
      getMonthlySpendingByFolder(userId, range),
      getLast6MonthsTrend(userId, range),
      getTop5ExpensiveItems(userId, range),
      getItemCount(userId),
      getMonthlyItemStats(userId, range),
    ]);

  return {
    folders,
    monthlySpending,
    monthlyTrend,
    topItems,
    monthlyStats,
    totalItems,
  };
}

export async function getFolderDetailInitialData({
  userId,
  folderId,
  range,
}: {
  userId: string;
  folderId: string;
  range: DateRange;
}): Promise<FolderDetailInitialData | null> {
  "use cache";
  cacheLife(DASHBOARD_CACHE_LIFE);
  cacheTag(`user:${userId}:folders`);
  cacheTag(`user:${userId}:items`);
  cacheTag(`folder:${folderId}:items`);

  const [folder, page] = await Promise.all([
    getFolderById(folderId),
    getItemsWithFoldersPageForUser({ userId, range, folderId, limit: 100 }),
  ]);

  if (!folder || folder.user_id !== userId) return null;

  return {
    folder,
    items: page.items.map(toItem),
  };
}
