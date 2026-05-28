"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getRecurringTransactions,
  createRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringActive,
  processDueRecurring,
} from "@/lib/supabase/recurring";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatPKR } from "@/components/ui/money";
import {
  RefreshCw,
  Plus,
  Trash2,
  Loader2,
  Pause,
  Play,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type {
  RecurringWithFolder,
  CreateRecurringData,
  FolderWithStats,
  RecurringFrequency,
} from "@/types";

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function RecurringWidget({
  folders,
}: {
  folders: FolderWithStats[];
}) {
  const [items, setItems] = useState<RecurringWithFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async (uid: string) => {
    const data = await getRecurringTransactions(uid);
    setItems(data);
    setLoading(false);
  }, []);

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

  const handleCreate = async (data: CreateRecurringData) => {
    if (!userId) return;
    await createRecurringTransaction(userId, data);
    toast.success("Recurring transaction created!");
    setShowForm(false);
    load(userId);
  };

  const handleDelete = async (id: string) => {
    await deleteRecurringTransaction(id);
    toast.success("Recurring transaction deleted");
    if (userId) load(userId);
  };

  const handleToggle = async (id: string, current: boolean) => {
    await toggleRecurringActive(id, !current);
    toast.success(!current ? "Activated" : "Paused");
    if (userId) load(userId);
  };

  const handleProcessDue = async () => {
    if (!userId) return;
    setProcessing(true);
    try {
      const count = await processDueRecurring(userId);
      if (count > 0) {
        toast.success(`Processed ${count} due transaction${count > 1 ? "s" : ""}`);
      } else {
        toast.info("No due transactions to process");
      }
      load(userId);
    } catch {
      toast.error("Failed to process");
    }
    setProcessing(false);
  };

  const dueCount = items.filter(
    (i) => i.is_active && i.next_due_date <= new Date().toISOString().split("T")[0]
  ).length;

  if (loading) {
    return (
      <div className="card-base" style={{ padding: 24 }}>
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Recurring
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-[var(--bg-elevated)]"
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
          <RefreshCw className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Recurring
          </h2>
          {dueCount > 0 && (
            <span className="rounded-full bg-[var(--warning-bg)] text-[var(--warning)] px-2 py-0.5 text-xs font-medium">
              {dueCount} due
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {dueCount > 0 && (
            <button
              className="btn-ghost text-xs"
              onClick={handleProcessDue}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              Process
            </button>
          )}
          <button
            className="btn-ghost text-xs"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {showForm && (
        <RecurringForm
          folders={folders}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {items.length === 0 && !showForm ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-6">
          No recurring transactions. Click &ldquo;Add&rdquo; to set one up.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const isDue =
              item.is_active &&
              item.next_due_date <=
                new Date().toISOString().split("T")[0];

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
                  isDue
                    ? "border-[var(--warning)] bg-[var(--warning-bg)]"
                    : "border-[var(--border)]"
                } ${!item.is_active ? "opacity-50" : ""}`}
                style={{ background: isDue ? undefined : "var(--bg-elevated)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span>{item.folder_icon}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {item.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] shrink-0">
                      {FREQUENCY_LABELS[item.frequency]}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Next: {new Date(`${item.next_due_date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {formatPKR(item.price * item.quantity)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="rounded p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                    onClick={() => handleToggle(item.id, item.is_active)}
                    title={item.is_active ? "Pause" : "Resume"}
                  >
                    {item.is_active ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <ConfirmDialog
                    title="Delete recurring?"
                    description={`Delete "${item.name}"? This won't delete previously created items.`}
                    confirmLabel="Delete"
                    onConfirm={() => handleDelete(item.id)}
                    trigger={
                      <button className="rounded p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecurringForm({
  folders,
  onSubmit,
  onCancel,
}: {
  folders: FolderWithStats[];
  onSubmit: (data: CreateRecurringData) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState(folders[0]?.id || "");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [nextDate, setNextDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !folderId) return;
    setSaving(true);
    await onSubmit({
      folder_id: folderId,
      name: name.trim(),
      price: parseFloat(price),
      quantity: 1,
      unit: "pcs",
      frequency,
      next_due_date: nextDate,
    });
    setSaving(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-lg border border-[var(--border)] p-4 space-y-3"
      style={{ background: "var(--bg-elevated)" }}
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 col-span-2"
          style={{ height: 40 }}
          required
        />
        <select
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          className="px-3"
          style={{ height: 40 }}
          required
        >
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.icon} {f.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Amount"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="px-3"
          style={{ height: 40 }}
          min={0.01}
          step="0.01"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
          className="px-3"
          style={{ height: 40 }}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input
          type="date"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
          className="px-3"
          style={{ height: 40 }}
          required
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
