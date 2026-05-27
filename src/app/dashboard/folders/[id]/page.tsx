"use client";

import { useEffect, useState, useCallback, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getFolderById, updateFolder, deleteFolder } from "@/lib/supabase/folders";
import { getItemsByFolder, createItem, updateItem, deleteItem } from "@/lib/supabase/items";
import { ItemsTable } from "@/components/items/items-table";
import { ItemForm } from "@/components/items/item-form";
import { FolderForm } from "@/components/folders/folder-form";
import { MiniBarChart } from "@/components/charts/mini-bar-chart";
import { PeriodSelector } from "@/components/nav/period-selector";
import { ExportLink } from "@/components/export/export-report-actions";
import { formatPKR } from "@/components/ui/money";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getRangeLabel,
  getRangeSearch,
  parseIsoDate,
  toIsoDate,
} from "@/lib/date-range";
import { useDateRangeParams } from "@/lib/use-date-range-params";
import { ArrowLeft, Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Folder, Item, CreateFolderData, CreateItemData } from "@/types";

export default function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const folderId = unwrappedParams.id;
  const router = useRouter();
  
  const supabase = useMemo(() => createClient(), []);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [showEditFolder, setShowEditFolder] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const { range, setRange } = useDateRangeParams();
  const periodLabel = useMemo(() => getRangeLabel(range), [range]);
  const exportHref = useMemo(
    () => `/export?${getRangeSearch(range)}&folderId=${encodeURIComponent(folderId)}`,
    [folderId, range]
  );
  const defaultItemDate = useMemo(() => {
    const today = toIsoDate(new Date());
    return today >= range.startDate && today <= range.endDate ? today : range.endDate;
  }, [range]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [folderData, itemsData] = await Promise.all([
        getFolderById(folderId),
        getItemsByFolder(folderId, range),
      ]);
      setFolder(folderData);
      setItems(itemsData);
    } catch (err: unknown) {
      console.error("Failed to load folder data:", err);
      toast.error("Folder not found");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [folderId, range, router]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadData();
      }
    };
    getUser();
  }, [supabase, loadData]);

  const handleUpdateFolder = async (data: CreateFolderData) => {
    await updateFolder(folderId, data);
    toast.success("Folder updated");
    loadData();
  };

  const handleDeleteFolder = async () => {
    try {
      await deleteFolder(folderId);
      toast.success("Folder deleted");
      router.push(`/dashboard?${getRangeSearch(range)}`);
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  const handleSaveItem = async (data: Omit<CreateItemData, "folder_id">) => {
    if (!userId) return;
    if (editingItem) {
      await updateItem(editingItem.id, data);
      toast.success("Item updated");
    } else {
      await createItem(userId, { ...data, folder_id: folderId });
      toast.success("Item added");
    }
    loadData();
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId);
      toast.success("Item deleted");
      loadData();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  if (!folder && !loading) return null;

  const periodTotal = items.reduce((sum, item) => sum + item.total, 0);
  
  const chartDataMap = new Map<string, number>();
  const startDate = parseIsoDate(range.startDate);
  const endDate = parseIsoDate(range.endDate);
  for (const day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
    chartDataMap.set(toIsoDate(day), 0);
  }
  
  items.forEach((item) => {
    chartDataMap.set(item.date, (chartDataMap.get(item.date) || 0) + item.total);
  });
  
  const chartData = Array.from(chartDataMap.entries()).map(([date, amount]) => ({
    date: parseIsoDate(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    amount,
  }));

  const isOverBudget = folder?.budget_limit ? periodTotal > folder.budget_limit : false;
  const budgetPercentage = folder?.budget_limit 
    ? Math.min((periodTotal / folder.budget_limit) * 100, 100) 
    : 0;

  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      <div className="page-header">
        <div className="flex min-w-0 items-start gap-4">
          <button
            onClick={() => router.push(`/dashboard?${getRangeSearch(range)}`)}
            className="p-2 -ml-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {loading ? (
            <div className="h-8 w-48 bg-[var(--bg-elevated)] animate-pulse rounded" />
          ) : (
            <div className="page-heading">
              <button
                className="flex min-w-0 items-center gap-3 text-left transition-opacity hover:opacity-80"
                onClick={() => setShowEditFolder(true)}
              >
                <span className="text-3xl">{folder?.icon}</span>
                <span className="min-w-0">
                  <h1>{folder?.name}</h1>
                  <p>{periodLabel}</p>
                </span>
              </button>
            </div>
          )}
        </div>
        
        {!loading && (
          <div className="page-actions">
            <ExportLink href={exportHref} label="Export" />
            <button
              onClick={() => setShowEditFolder(true)}
              className="btn-ghost hidden sm:inline-flex"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <ConfirmDialog
              title="Delete folder?"
              description={`Are you sure you want to delete "${folder?.name}"? All items inside will be permanently deleted.`}
              confirmLabel="Delete Folder"
              onConfirm={handleDeleteFolder}
              trigger={
                <button className="btn-ghost text-[var(--danger)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] hidden sm:inline-flex">
                  <Trash2 className="w-4 h-4" />
                </button>
              }
            />
          </div>
        )}
      </div>

      <div className="mb-6 flex justify-start sm:justify-end">
        <PeriodSelector range={range} onRangeChange={setRange} />
      </div>

      {/* Budget Banner */}
      {!loading && folder?.budget_limit && (
        <div className="mb-8">
          <div
            className="w-full rounded-full overflow-hidden mb-2"
            style={{ height: 8, background: "var(--bg-elevated)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${budgetPercentage}%`,
                background: isOverBudget ? "var(--budget-over)" : budgetPercentage >= 50 ? "var(--budget-warn)" : "var(--budget-safe)",
              }}
            />
          </div>
          <div
            className={`p-3 rounded-lg text-sm flex items-center justify-between ${
              isOverBudget ? "bg-[var(--danger-bg)] text-[var(--danger)]" : ""
            }`}
          >
            <p className={isOverBudget ? "text-[var(--danger)]" : "text-[var(--text-secondary)]"}>
              <span className="mono font-medium">{formatPKR(periodTotal)}</span> spent of <span className="mono">{formatPKR(folder.budget_limit)}</span> budget in {periodLabel}
            </p>
            <span className="mono font-medium">{Math.round(budgetPercentage)}% used</span>
          </div>
        </div>
      )}

      {/* Mini Chart */}
      {!loading && items.length > 0 && (
        <MiniBarChart data={chartData} />
      )}

      {/* Table */}
      <div className="mb-20">
        <ItemsTable
          items={items}
          loading={loading}
          onEdit={(item) => {
            setEditingItem(item);
            setShowItemForm(true);
          }}
          onDelete={handleDeleteItem}
          onAddItem={() => {
            setEditingItem(undefined);
            setShowItemForm(true);
          }}
        />
      </div>

      {/* Add Item FAB / Sticky Button */}
      {!loading && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-20">
          <button
            onClick={() => {
              setEditingItem(undefined);
              setShowItemForm(true);
            }}
            className="btn-primary shadow-lg"
            style={{ height: 48, padding: "0 24px", borderRadius: 24 }}
          >
            <Plus className="w-5 h-5 mr-1" />
            Add Item
          </button>
        </div>
      )}

      {/* Modals/Sheets */}
      {folder && (
        <FolderForm
          open={showEditFolder}
          onOpenChange={setShowEditFolder}
          onSubmit={handleUpdateFolder}
          initialData={folder}
          title="Edit Folder"
        />
      )}

      <ItemForm
        open={showItemForm}
        onOpenChange={(open) => {
          setShowItemForm(open);
          if (!open) setTimeout(() => setEditingItem(undefined), 200);
        }}
        onSubmit={handleSaveItem}
        initialData={editingItem}
        defaultDate={defaultItemDate}
      />
    </div>
  );
}
