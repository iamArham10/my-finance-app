"use server";

import { createClient } from "./server";
import type { SavingsGoal, CreateSavingsGoalData } from "@/types";

export async function getSavingsGoals(
  userId: string
): Promise<SavingsGoal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((row: any) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    icon: String(row.icon),
    target_amount: Number(row.target_amount),
    current_amount: Number(row.current_amount),
    deadline: row.deadline ? String(row.deadline) : null,
    created_at: String(row.created_at),
  }));
}

export async function createSavingsGoal(
  userId: string,
  data: CreateSavingsGoalData
): Promise<SavingsGoal> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("savings_goals")
    .insert({ ...data, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  if (!row) throw new Error("Failed to create savings goal");
  return row as unknown as SavingsGoal;
}

export async function updateSavingsGoalAmount(
  id: string,
  amount: number
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("savings_goals")
    .update({ current_amount: amount })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
