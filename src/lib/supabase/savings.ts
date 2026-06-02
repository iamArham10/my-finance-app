"use server";

import { updateTag } from "next/cache";
import { createClient, createAdminClient } from "./server";
import type { SavingsGoal, CreateSavingsGoalData } from "@/types";

type SavingsGoalRow = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  target_amount: number | string;
  current_amount: number | string;
  deadline: string | null;
  created_at: string;
};

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to manage savings goals");
  }

  return { supabase, userId: user.id };
}

export async function getSavingsGoals(
  userId: string
): Promise<SavingsGoal[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return (data as SavingsGoalRow[]).map((row) => ({
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
  data: CreateSavingsGoalData
): Promise<SavingsGoal> {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { data: row, error } = await supabase
    .from("savings_goals")
    .insert({ ...data, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  if (!row) throw new Error("Failed to create savings goal");
  updateTag(`user:${userId}:summary`);
  return row as unknown as SavingsGoal;
}

export async function updateSavingsGoalAmount(
  id: string,
  amount: number
): Promise<void> {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { error } = await supabase
    .from("savings_goals")
    .update({ current_amount: amount })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  updateTag(`user:${userId}:summary`);
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  updateTag(`user:${userId}:summary`);
}
