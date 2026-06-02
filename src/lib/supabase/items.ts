"use server";

import { updateTag } from "next/cache";
import { createClient, createAdminClient } from "./server";
import { getMonthRange, getPreviousRange, parseIsoDate } from "@/lib/date-range";
import type {
  Item,
  ItemWithFolder,
  CreateItemData,
  UpdateItemData,
  MonthlyItemStats,
  MonthlySpending,
  MonthlyTrend,
  DateRange,
} from "@/types";

const DEFAULT_PAGE_SIZE = 100;

function invalidateItemTags(userId: string, folderIds: Array<string | null | undefined> = []) {
  updateTag(`user:${userId}:items`);
  updateTag(`user:${userId}:summary`);
  for (const folderId of new Set(folderIds.filter(Boolean))) {
    updateTag(`folder:${folderId}:items`);
  }
}

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to manage items");
  }

  return { supabase, userId: user.id };
}

export async function getItemsByFolder(
  folderId: string,
  range?: DateRange
): Promise<Item[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("items")
    .select("*")
    .eq("folder_id", folderId);

  if (range) {
    query = query.gte("date", range.startDate).lte("date", range.endDate);
  }

  const { data, error } = await query.order("date", { ascending: false });

  if (error) throw error;
  if (!data) return [];
  return data.map((item) => ({
    id: String(item.id),
    folder_id: String(item.folder_id),
    user_id: String(item.user_id),
    name: String(item.name),
    price: Number(item.price),
    quantity: Number(item.quantity),
    unit: String(item.unit),
    total: Number(item.total),
    date: String(item.date),
    note: item.note ? String(item.note) : null,
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    created_at: String(item.created_at),
  }));
}

export async function createItem(data: CreateItemData): Promise<Item> {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { data: item, error } = await supabase
    .from("items")
    .insert({ ...data, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  if (!item) throw new Error("Failed to create item");
  invalidateItemTags(userId, [String(item.folder_id)]);
  return {
    id: String(item.id),
    folder_id: String(item.folder_id),
    user_id: String(item.user_id),
    name: String(item.name),
    price: Number(item.price),
    quantity: Number(item.quantity),
    unit: String(item.unit),
    total: Number(item.total),
    date: String(item.date),
    note: item.note ? String(item.note) : null,
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    created_at: String(item.created_at),
  };
}

export async function updateItem(itemId: string, data: UpdateItemData): Promise<Item> {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { data: existing, error: existingError } = await supabase
    .from("items")
    .select("user_id, folder_id")
    .eq("id", itemId)
    .eq("user_id", userId)
    .single();

  if (existingError) throw existingError;

  const { data: item, error } = await supabase
    .from("items")
    .update(data)
    .eq("id", itemId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  if (!item) throw new Error("Failed to update item");
  invalidateItemTags(userId, [String(existing.folder_id), String(item.folder_id)]);
  return {
    id: String(item.id),
    folder_id: String(item.folder_id),
    user_id: String(item.user_id),
    name: String(item.name),
    price: Number(item.price),
    quantity: Number(item.quantity),
    unit: String(item.unit),
    total: Number(item.total),
    date: String(item.date),
    note: item.note ? String(item.note) : null,
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    created_at: String(item.created_at),
  };
}

export async function deleteItem(itemId: string): Promise<void> {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { data: existing, error: existingError } = await supabase
    .from("items")
    .select("user_id, folder_id")
    .eq("id", itemId)
    .eq("user_id", userId)
    .single();

  if (existingError) throw existingError;

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw error;
  invalidateItemTags(userId, [String(existing.folder_id)]);
}

export async function getItemCount(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}

export async function getMonthlyItemStats(
  userId: string,
  range: DateRange = getMonthRange()
): Promise<MonthlyItemStats> {
  const supabase = createAdminClient();
  const previousRange = getPreviousRange(range);

  const { data, error } = await supabase
    .from("expense_daily_folder_totals")
    .select("total,item_count,date")
    .eq("user_id", userId)
    .gte("date", previousRange.startDate)
    .lte("date", range.endDate);

  if (error) throw error;

  let currentTotal = 0;
  let previousTotal = 0;
  let currentCount = 0;
  let previousCount = 0;

  for (const item of data ?? []) {
    const itemDate = String(item.date);
    const total = Number(item.total) || 0;
    const itemCount = Number(item.item_count) || 0;

    if (itemDate >= range.startDate && itemDate <= range.endDate) {
      currentTotal += total;
      currentCount += itemCount;
    } else if (
      itemDate >= previousRange.startDate &&
      itemDate <= previousRange.endDate
    ) {
      previousTotal += total;
      previousCount += itemCount;
    }
  }

  return {
    current_total: currentTotal,
    previous_total: previousTotal,
    current_count: currentCount,
    previous_count: previousCount,
    average_item_total: currentCount > 0 ? currentTotal / currentCount : 0,
  };
}

export async function getRecentItems(
  userId: string,
  limit = 5,
  range?: DateRange
): Promise<ItemWithFolder[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("items")
    .select(`
      *,
      folders!inner (
        name,
        icon
      )
    `)
    .eq("user_id", userId);

  if (range) {
    query = query.gte("date", range.startDate).lte("date", range.endDate);
  }

  const { data, error } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rawData = data as unknown as RawExpensiveItem[];
  if (!rawData) return [];

  return rawData.map(mapItemWithFolder);
}

export async function getItemsWithFolders(
  userId: string,
  range?: DateRange
): Promise<ItemWithFolder[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("items")
    .select(`
      *,
      folders!inner (
        name,
        icon
      )
    `)
    .eq("user_id", userId);

  if (range) {
    query = query.gte("date", range.startDate).lte("date", range.endDate);
  }

  const { data, error } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rawData = data as unknown as RawExpensiveItem[];
  if (!rawData) return [];

  return rawData.map(mapItemWithFolder);
}

export type ItemsPageParams = {
  userId: string;
  range?: DateRange;
  folderId?: string;
  limit?: number;
  cursor?: string | null;
};

export type ItemsPage = {
  items: ItemWithFolder[];
  nextCursor: string | null;
};

function encodeItemCursor(item: ItemWithFolder): string {
  return `${item.date}|${item.created_at}|${item.id}`;
}

function decodeItemCursor(cursor: string): {
  date: string;
  createdAt: string;
  id: string;
} {
  const [date, createdAt, id] = cursor.split("|");
  return { date, createdAt, id };
}

export async function getItemsWithFoldersPageForUser({
  userId,
  range,
  folderId,
  limit = DEFAULT_PAGE_SIZE,
  cursor,
}: ItemsPageParams): Promise<ItemsPage> {
  const supabase = createAdminClient();
  const pageSize = Math.min(Math.max(limit, 1), 250);
  let query = supabase
    .from("items")
    .select(`
      *,
      folders!inner (
        name,
        icon
      )
    `)
    .eq("user_id", userId);

  if (folderId) {
    query = query.eq("folder_id", folderId);
  }

  if (range) {
    query = query.gte("date", range.startDate).lte("date", range.endDate);
  }

  if (cursor) {
    const decoded = decodeItemCursor(cursor);
    query = query.or(
      `date.lt.${decoded.date},and(date.eq.${decoded.date},created_at.lt.${decoded.createdAt}),and(date.eq.${decoded.date},created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`
    );
  }

  const { data, error } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);

  if (error) throw error;

  const rawData = data as unknown as RawExpensiveItem[];
  const mapped = (rawData ?? []).map(mapItemWithFolder);
  const items = mapped.slice(0, pageSize);

  return {
    items,
    nextCursor: mapped.length > pageSize ? encodeItemCursor(items[items.length - 1]) : null,
  };
}

export async function getItemsWithFoldersPage({
  range,
  folderId,
  limit,
  cursor,
}: Omit<ItemsPageParams, "userId">): Promise<ItemsPage> {
  const { userId } = await getAuthenticatedUserId();
  return getItemsWithFoldersPageForUser({ userId, range, folderId, limit, cursor });
}

export async function getReportItems(
  userId: string,
  range: DateRange,
  folderId?: string
): Promise<ItemWithFolder[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("items")
    .select(`
      *,
      folders!inner (
        name,
        icon
      )
    `)
    .eq("user_id", userId)
    .gte("date", range.startDate)
    .lte("date", range.endDate);

  if (folderId) {
    query = query.eq("folder_id", folderId);
  }

  const { data, error } = await query
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rawData = data as unknown as RawExpensiveItem[];
  if (!rawData) return [];

  return rawData.map(mapItemWithFolder);
}

interface RawMonthlySpendingItem {
  folder_id?: string;
  total: number | string;
  folders: {
    id: string;
    name: string;
    icon: string;
  } | {
    id: string;
    name: string;
    icon: string;
  }[] | null;
}

export async function getMonthlySpendingByFolder(
  userId: string,
  range: DateRange = getMonthRange()
): Promise<MonthlySpending[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("expense_daily_folder_totals")
    .select(`
      folder_id,
      total,
      folders!inner (
        id,
        name,
        icon
      )
    `)
    .eq("user_id", userId)
    .gte("date", range.startDate)
    .lte("date", range.endDate);

  if (error) throw error;
  
  const rawData = data as unknown as RawMonthlySpendingItem[];
  if (!rawData) return [];

  const byFolder = new Map<string, MonthlySpending>();
  for (const item of rawData) {
    if (!item.folders) continue;
    const folder = Array.isArray(item.folders) ? item.folders[0] : item.folders;
    if (!folder) continue;

    const folderId = String(folder.id);
    const existing = byFolder.get(folderId);
    const amount = Number(item.total);
    if (existing) {
      existing.total += amount;
    } else {
      byFolder.set(folderId, {
        folder_id: folderId,
        folder_name: String(folder.name),
        folder_icon: String(folder.icon),
        total: amount,
      });
    }
  }

  return Array.from(byFolder.values()).sort((a, b) => b.total - a.total);
}

interface RawTrendItem {
  folder_id?: string;
  total: number | string;
  date: string;
  folders: {
    name: string;
  } | {
    name: string;
  }[] | null;
}

export async function getLast6MonthsTrend(
  userId: string,
  range: DateRange = getMonthRange()
): Promise<MonthlyTrend[]> {
  const supabase = createAdminClient();
  const rangeEnd = parseIsoDate(range.endDate);
  const sixMonthsAgo = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() - 5, 1);
  const startDate = sixMonthsAgo.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("expense_daily_folder_totals")
    .select(`
      folder_id,
      total,
      date,
      folders!inner (
        name
      )
    `)
    .eq("user_id", userId)
    .gte("date", startDate);

  if (error) throw error;
  
  const rawData = data as unknown as RawTrendItem[];
  const months = new Map<string, MonthlyTrend>();
  
  for (let i = 0; i < 6; i++) {
    const d = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    months.set(key, { month: monthName, total: 0, by_folder: [] });
  }

  if (rawData) {
    for (const item of rawData) {
      const itemDate = new Date(item.date);
      const key = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, "0")}`;
      const monthData = months.get(key);
      if (!monthData) continue;

      if (!item.folders) continue;
      const folder = Array.isArray(item.folders) ? item.folders[0] : item.folders;
      if (!folder) continue;

      const folderName = String(folder.name);
      const totalVal = Number(item.total);
      monthData.total += totalVal;

      const existing = monthData.by_folder.find((f) => f.folder_name === folderName);
      if (existing) {
        existing.total += totalVal;
      } else {
        monthData.by_folder.push({ folder_name: folderName, total: totalVal });
      }
    }
  }

  return Array.from(months.values());
}

interface RawExpensiveItem {
  id: string;
  folder_id: string;
  user_id: string;
  name: string;
  price: number | string;
  quantity: number | string;
  unit: string;
  total: number | string;
  date: string;
  note: string | null;
  tags?: string[];
  created_at: string;
  folders: {
    name: string;
    icon: string;
  } | {
    name: string;
    icon: string;
  }[] | null;
}

function mapItemWithFolder(item: RawExpensiveItem): ItemWithFolder {
  const folder = Array.isArray(item.folders) ? item.folders[0] : item.folders;
  return {
    id: String(item.id),
    folder_id: String(item.folder_id),
    user_id: String(item.user_id),
    name: String(item.name),
    price: Number(item.price),
    quantity: Number(item.quantity),
    unit: String(item.unit),
    total: Number(item.total),
    date: String(item.date),
    note: item.note ? String(item.note) : null,
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    created_at: String(item.created_at),
    folder_name: folder ? String(folder.name) : "Unknown",
    folder_icon: folder ? String(folder.icon) : "🗂️",
  };
}

export async function getTop5ExpensiveItems(
  userId: string,
  range?: DateRange
): Promise<ItemWithFolder[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("items")
    .select(`
      *,
      folders!inner (
        name,
        icon
      )
    `)
    .eq("user_id", userId);

  if (range) {
    query = query.gte("date", range.startDate).lte("date", range.endDate);
  }

  const { data, error } = await query
    .order("total", { ascending: false })
    .limit(5);

  if (error) throw error;
  
  const rawData = data as unknown as RawExpensiveItem[];
  if (!rawData) return [];

  return rawData.map(mapItemWithFolder);
}
