"use server";

import { createClient } from "./server";
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

export async function getItemsByFolder(
  folderId: string,
  range?: DateRange
): Promise<Item[]> {
  const supabase = await createClient();
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
    created_at: String(item.created_at),
  }));
}

export async function createItem(userId: string, data: CreateItemData): Promise<Item> {
  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("items")
    .insert({ ...data, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  if (!item) throw new Error("Failed to create item");
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
    created_at: String(item.created_at),
  };
}

export async function updateItem(itemId: string, data: UpdateItemData): Promise<Item> {
  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("items")
    .update(data)
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  if (!item) throw new Error("Failed to update item");
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
    created_at: String(item.created_at),
  };
}

export async function deleteItem(itemId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}

export async function getItemCount(userId: string): Promise<number> {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const previousRange = getPreviousRange(range);

  const { data, error } = await supabase
    .from("items")
    .select("total,date")
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

    if (itemDate >= range.startDate && itemDate <= range.endDate) {
      currentTotal += total;
      currentCount += 1;
    } else if (
      itemDate >= previousRange.startDate &&
      itemDate <= previousRange.endDate
    ) {
      previousTotal += total;
      previousCount += 1;
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
  const supabase = await createClient();
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

export async function getReportItems(
  userId: string,
  range: DateRange,
  folderId?: string
): Promise<ItemWithFolder[]> {
  const supabase = await createClient();
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("items")
    .select(`
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
  const supabase = await createClient();
  const rangeEnd = parseIsoDate(range.endDate);
  const sixMonthsAgo = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() - 5, 1);
  const startDate = sixMonthsAgo.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("items")
    .select(`
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
    created_at: String(item.created_at),
    folder_name: folder ? String(folder.name) : "Unknown",
    folder_icon: folder ? String(folder.icon) : "🗂️",
  };
}

export async function getTop5ExpensiveItems(
  userId: string,
  range?: DateRange
): Promise<ItemWithFolder[]> {
  const supabase = await createClient();
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
