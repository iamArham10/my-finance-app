"use server";

import { createClient } from "./server";
import type {
  RecurringTransaction,
  RecurringWithFolder,
  CreateRecurringData,
} from "@/types";

export async function getRecurringTransactions(
  userId: string
): Promise<RecurringWithFolder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*, folders(name, icon)")
    .eq("user_id", userId)
    .order("next_due_date", { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map((row: any) => ({
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
  userId: string,
  data: CreateRecurringData
): Promise<RecurringTransaction> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("recurring_transactions")
    .insert({ ...data, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  if (!row) throw new Error("Failed to create recurring transaction");
  return row as unknown as RecurringTransaction;
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function toggleRecurringActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_transactions")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Processes due recurring transactions by creating items for them
 * and advancing their next_due_date.
 */
export async function processDueRecurring(userId: string): Promise<number> {
  const supabase = await createClient();
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

    // Advance next_due_date
    const nextDate = advanceDate(rec.next_due_date, rec.frequency);
    await supabase
      .from("recurring_transactions")
      .update({ next_due_date: nextDate })
      .eq("id", rec.id);

    processed++;
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
