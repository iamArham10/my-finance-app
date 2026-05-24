"use server";

import { createClient } from "./server";
import type {
  Folder,
  FolderWithStats,
  CreateFolderData,
  UpdateFolderData,
} from "@/types";

export async function getFolders(userId: string): Promise<Folder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data) return [];
  return data.map((item) => ({
    id: String(item.id),
    user_id: String(item.user_id),
    name: String(item.name),
    icon: String(item.icon),
    budget_limit: item.budget_limit ? Number(item.budget_limit) : null,
    created_at: String(item.created_at),
  }));
}

export async function getFoldersWithStats(
  userId: string
): Promise<FolderWithStats[]> {
  const supabase = await createClient();
  const folders = await getFolders(userId);

  if (folders.length === 0) return [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data, error } = await supabase
    .from("items")
    .select("folder_id,total,date")
    .eq("user_id", userId);

  if (error) throw error;

  const statsByFolder = new Map<
    string,
    { item_count: number; monthly_total: number }
  >();

  for (const item of data ?? []) {
    const folderId = String(item.folder_id);
    const stats = statsByFolder.get(folderId) ?? {
      item_count: 0,
      monthly_total: 0,
    };

    stats.item_count += 1;
    const itemDate = String(item.date);
    if (itemDate >= startOfMonth && itemDate <= endOfMonth) {
      stats.monthly_total += Number(item.total) || 0;
    }

    statsByFolder.set(folderId, stats);
  }

  return folders.map((folder) => ({
    ...folder,
    item_count: statsByFolder.get(folder.id)?.item_count ?? 0,
    monthly_total: statsByFolder.get(folder.id)?.monthly_total ?? 0,
  }));
}

export async function getFolderById(folderId: string): Promise<Folder | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("id", folderId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    id: String(data.id),
    user_id: String(data.user_id),
    name: String(data.name),
    icon: String(data.icon),
    budget_limit: data.budget_limit ? Number(data.budget_limit) : null,
    created_at: String(data.created_at),
  };
}

export async function createFolder(userId: string, data: CreateFolderData): Promise<Folder> {
  const supabase = await createClient();
  const { data: folder, error } = await supabase
    .from("folders")
    .insert({ ...data, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  if (!folder) throw new Error("Failed to create folder");
  return {
    id: String(folder.id),
    user_id: String(folder.user_id),
    name: String(folder.name),
    icon: String(folder.icon),
    budget_limit: folder.budget_limit ? Number(folder.budget_limit) : null,
    created_at: String(folder.created_at),
  };
}

export async function updateFolder(folderId: string, data: UpdateFolderData): Promise<Folder> {
  const supabase = await createClient();
  const { data: folder, error } = await supabase
    .from("folders")
    .update(data)
    .eq("id", folderId)
    .select()
    .single();

  if (error) throw error;
  if (!folder) throw new Error("Failed to update folder");
  return {
    id: String(folder.id),
    user_id: String(folder.user_id),
    name: String(folder.name),
    icon: String(folder.icon),
    budget_limit: folder.budget_limit ? Number(folder.budget_limit) : null,
    created_at: String(folder.created_at),
  };
}

export async function deleteFolder(folderId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folderId);

  if (error) throw error;
}

export async function getFolderMonthlyTotal(folderId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("items")
    .select("total")
    .eq("folder_id", folderId)
    .gte("date", startOfMonth)
    .lte("date", endOfMonth);

  if (error) throw error;
  if (!data) return 0;
  return data.reduce((sum, item) => sum + (item.total ? Number(item.total) : 0), 0);
}
