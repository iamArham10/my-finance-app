"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoalAmount,
  deleteSavingsGoal,
} from "@/lib/supabase/savings";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatPKR } from "@/components/ui/money";
import { Target, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SavingsGoal, CreateSavingsGoalData } from "@/types";

const GOAL_ICONS = ["🎯", "🏠", "✈️", "🚗", "📱", "🎓", "💍", "🏋️", "🎮", "💰"];

export function SavingsGoalsWidget() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(
    async (uid: string) => {
      const data = await getSavingsGoals(uid);
      setGoals(data);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        load(user.id);
      }
    };
    init();
  }, [supabase, load]);

  const handleCreate = async (data: CreateSavingsGoalData) => {
    if (!userId) return;
    await createSavingsGoal(userId, data);
    toast.success("Goal created!");
    setShowForm(false);
    load(userId);
  };

  const handleAddFunds = async (goal: SavingsGoal, amount: number) => {
    await updateSavingsGoalAmount(goal.id, goal.current_amount + amount);
    toast.success(`Added ${formatPKR(amount)} to ${goal.name}`);
    if (userId) load(userId);
  };

  const handleDelete = async (id: string) => {
    await deleteSavingsGoal(id);
    toast.success("Goal deleted");
    if (userId) load(userId);
  };

  if (loading) {
    return (
      <div className="card-base" style={{ padding: 24 }}>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Savings Goals
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-[var(--bg-elevated)]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-base" style={{ padding: 24 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Savings Goals
          </h2>
        </div>
        <button
          className="btn-ghost text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {showForm && (
        <GoalForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {goals.length === 0 && !showForm ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-6">
          No savings goals yet. Click &ldquo;Add&rdquo; to set one up.
        </p>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const percent =
              goal.target_amount > 0
                ? Math.min(
                    Math.round(
                      (goal.current_amount / goal.target_amount) * 100
                    ),
                    100
                  )
                : 0;
            const isComplete = goal.current_amount >= goal.target_amount;

            return (
              <div
                key={goal.id}
                className="rounded-lg border border-[var(--border)] p-4"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{goal.icon}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {goal.name}
                    </span>
                    {isComplete && (
                      <span className="text-xs bg-[var(--success-bg)] text-[var(--success)] px-2 py-0.5 rounded-full">
                        ✓ Done
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <QuickAddButton
                      onAdd={(amount) => handleAddFunds(goal, amount)}
                    />
                    <ConfirmDialog
                      title="Delete goal?"
                      description={`Delete "${goal.name}"? This cannot be undone.`}
                      confirmLabel="Delete"
                      onConfirm={() => handleDelete(goal.id)}
                      trigger={
                        <button className="rounded p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
                  <span className="mono">
                    {formatPKR(goal.current_amount)} / {formatPKR(goal.target_amount)}
                  </span>
                  <span>{percent}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-surface)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      background: isComplete
                        ? "var(--success)"
                        : "var(--accent)",
                    }}
                  />
                </div>

                {goal.deadline && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Deadline:{" "}
                    {new Date(`${goal.deadline}T00:00:00`).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GoalForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: CreateSavingsGoalData) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !target) return;
    setSaving(true);
    await onSubmit({
      name: name.trim(),
      icon,
      target_amount: parseFloat(target),
      deadline: deadline || undefined,
    });
    setSaving(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-lg border border-[var(--border)] p-4 space-y-3"
      style={{ background: "var(--bg-elevated)" }}
    >
      <div className="flex gap-2">
        <select
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-16 text-center"
          style={{ height: 40 }}
        >
          {GOAL_ICONS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Goal name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3"
          style={{ height: 40 }}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder="Target amount"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="px-3"
          style={{ height: 40 }}
          min={1}
          step="0.01"
          required
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="px-3"
          style={{ height: 40 }}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost text-xs" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary text-xs" disabled={saving}>
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Create"
          )}
        </button>
      </div>
    </form>
  );
}

function QuickAddButton({
  onAdd,
}: {
  onAdd: (amount: number) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [amount, setAmount] = useState("");

  if (!showInput) {
    return (
      <button
        className="rounded p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-surface)] transition-colors"
        onClick={() => setShowInput(true)}
        title="Add funds"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (val > 0) {
          onAdd(val);
          setAmount("");
          setShowInput(false);
        }
      }}
    >
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        className="w-24 px-2 text-xs"
        style={{ height: 28 }}
        autoFocus
        min={1}
        step="0.01"
      />
      <button type="submit" className="btn-primary text-xs h-7 px-2">
        +
      </button>
      <button
        type="button"
        className="text-xs text-[var(--text-muted)]"
        onClick={() => setShowInput(false)}
      >
        ✕
      </button>
    </form>
  );
}
