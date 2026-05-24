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
import { formatPKR } from "@/components/ui/money";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [folderData, itemsData] = await Promise.all([
        getFolderById(folderId),
        getItemsByFolder(folderId),
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
  }, [folderId, router]);

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
      router.push("/dashboard");
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

  // Calculate current month's spending and chart data
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const currentMonthItems = items.filter(
    (item) => item.date >= startOfMonth && item.date <= endOfMonth
  );
  
  const monthlyTotal = currentMonthItems.reduce((sum, item) => sum + item.total, 0);
  
  // Aggregate data for MiniBarChart (daily totals for current month)
  const chartDataMap = new Map<string, number>();
  // Pre-fill days of the month (1 to 31 depending on month)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    chartDataMap.set(i.toString(), 0);
  }
  
  currentMonthItems.forEach((item) => {
    const day = parseInt(item.date.split("-")[2], 10).toString();
    chartDataMap.set(day, (chartDataMap.get(day) || 0) + item.total);
  });
  
  const chartData = Array.from(chartDataMap.entries()).map(([day, amount]) => ({
    date: day,
    amount,
  }));

  const isOverBudget = folder?.budget_limit ? monthlyTotal > folder.budget_limit : false;
  const budgetPercentage = folder?.budget_limit 
    ? Math.min((monthlyTotal / folder.budget_limit) * 100, 100) 
    : 0;

  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 -ml-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {loading ? (
            <div className="h-8 w-48 bg-[var(--bg-elevated)] animate-pulse rounded" />
          ) : (
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowEditFolder(true)}
            >
              <span className="text-3xl">{folder?.icon}</span>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                {folder?.name}
              </h1>
            </div>
          )}
        </div>
        
        {!loading && (
          <div className="flex items-center gap-2">
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
              <span className="mono font-medium">{formatPKR(monthlyTotal)}</span> spent of <span className="mono">{formatPKR(folder.budget_limit)}</span> budget this month
            </p>
            <span className="mono font-medium">{Math.round(budgetPercentage)}% used</span>
          </div>
        </div>
      )}

      {/* Mini Chart */}
      {!loading && currentMonthItems.length > 0 && (
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
      />
    </div>
  );
}
