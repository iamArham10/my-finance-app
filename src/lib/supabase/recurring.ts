"use server";

import { updateTag } from "next/cache";
import { createClient, createAdminClient } from "./server";
import type {
  RecurringTransaction,
  RecurringWithFolder,
  CreateRecurringData,
} from "@/types";

type RecurringTransactionRow = {
  id: string;
  user_id: string;
  folder_id: string;
  name: string;
  price: number | string;
  quantity: number | string;
  unit: string;
  note: string | null;
  frequency: RecurringTransaction["frequency"];
  next_due_date: string;
  is_active: boolean;
  created_at: string;
  folders?: {
    name?: string | null;
    icon?: string | null;
  } | null;
};

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to manage recurring transactions");
  }

  return { supabase, userId: user.id };
}

function invalidateRecurringTags(userId: string, folderIds: Array<string | null | undefined> = []) {
  updateTag(`user:${userId}:summary`);
  updateTag(`user:${userId}:items`);
  for (const folderId of new Set(folderIds.filter(Boolean))) {
    updateTag(`folder:${folderId}:items`);
  }
}

export async function getRecurringTransactions(
  userId: string
): Promise<RecurringWithFolder[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*, folders(name, icon)")
    .eq("user_id", userId)
    .order("next_due_date", { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return (data as RecurringTransactionRow[]).map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    folder_id: String(row.folder_id),
    name: String(row.name),
    price: Number(row.price),
    quantity: Number(row.quantity),
    unit: String(row.unit),
    note: row.note ? String(row.note) : null,
    frequency: row.frequency as RecurringTransaction["frequency"],
    next_due_date: String(row.next_due_date),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    folder_name: String(row.folders?.name ?? ""),
    folder_icon: String(row.folders?.icon ?? "📁"),
  }));
}

export async function createRecurringTransaction(
  data: CreateRecurringData
): Promise<RecurringTransaction> {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { data: row, error } = await supabase
    .from("recurring_transactions")
    .insert({ ...data, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  if (!row) throw new Error("Failed to create recurring transaction");
  invalidateRecurringTags(userId);
  return row as unknown as RecurringTransaction;
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  invalidateRecurringTags(userId);
}

export async function toggleRecurringActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { error } = await supabase
    .from("recurring_transactions")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  invalidateRecurringTags(userId);
}

/**
 * Processes due recurring transactions by creating items for them
 * and advancing their next_due_date.
 */
export async function processDueRecurring(): Promise<number> {
  const { supabase, userId } = await getAuthenticatedUserId();
  const today = new Date().toISOString().split("T")[0];

  const { data: dueItems, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .lte("next_due_date", today);

  if (error) throw error;
  if (!dueItems || dueItems.length === 0) return 0;

  let processed = 0;
  const affectedFolderIds: string[] = [];

  for (const rec of dueItems) {
    // Create the item
    const { error: insertError } = await supabase.from("items").insert({
      user_id: userId,
      folder_id: rec.folder_id,
      name: rec.name,
      price: rec.price,
      quantity: rec.quantity,
      unit: rec.unit,
      date: rec.next_due_date,
      note: rec.note ? `${rec.note} (recurring)` : "(recurring)",
    });

    if (insertError) {
      console.error("Failed to insert recurring item:", insertError);
      continue;
    }
    affectedFolderIds.push(String(rec.folder_id));

    // Advance next_due_date
    const nextDate = advanceDate(rec.next_due_date, rec.frequency);
    await supabase
      .from("recurring_transactions")
      .update({ next_due_date: nextDate })
      .eq("id", rec.id);

    processed++;
  }

  if (processed > 0) {
    invalidateRecurringTags(userId, affectedFolderIds);
  }

  return processed;
}

function advanceDate(dateStr: string, frequency: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().split("T")[0];
}
