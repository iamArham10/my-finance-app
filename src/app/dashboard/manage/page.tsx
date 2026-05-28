"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  createFolder,
  deleteFolder,
  getFoldersWithStats,
  updateFolder,
} from "@/lib/supabase/folders";
import {
  createItem,
  deleteItem,
  getItemsWithFolders,
  updateItem,
} from "@/lib/supabase/items";
import { FolderForm } from "@/components/folders/folder-form";
import { ManageItemForm } from "@/components/items/manage-item-form";
import { PeriodSelector } from "@/components/nav/period-selector";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { formatPKR } from "@/components/ui/money";
import { getRangeLabel, getRangeSearch, toIsoDate } from "@/lib/date-range";
import { useDateRangeParams } from "@/lib/use-date-range-params";
import {
  ArrowRight,
  Edit2,
  FolderOpen,
  ListFilter,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  Copy,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import type {
  CreateFolderData,
  CreateItemData,
  FolderWithStats,
  ItemWithFolder,
} from "@/types";

const ALL_FOLDERS = "all";

export default function ManagePage() {
  const [folders, setFolders] = useState<FolderWithStats[]>([]);
  const [items, setItems] = useState<ItemWithFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [folderQuery, setFolderQuery] = useState("");
  const [itemQuery, setItemQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState(ALL_FOLDERS);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderWithStats | null>(
    null
  );
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemWithFolder | undefined>();
  const [duplicatingItem, setDuplicatingItem] = useState<ItemWithFolder | undefined>();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [defaultFolderId, setDefaultFolderId] = useState<string | undefined>();
  const { range, setRange } = useDateRangeParams();

  const supabase = useMemo(() => createClient(), []);
  const periodLabel = useMemo(() => getRangeLabel(range), [range]);
  const rangeQueryString = useMemo(() => getRangeSearch(range), [range]);
  const defaultItemDate = useMemo(() => {
    const today = toIsoDate(new Date());
    return today >= range.startDate && today <= range.endDate
      ? today
      : range.endDate;
  }, [range]);

  const loadData = useCallback(
    async (uid: string) => {
      try {
        setLoading(true);
        const [folderData, itemData] = await Promise.all([
          getFoldersWithStats(uid, range),
          getItemsWithFolders(uid, range),
        ]);
        setFolders(folderData);
        setItems(itemData);
      } catch (error) {
        console.error("Failed to load management data:", error);
        toast.error("Failed to load management data");
      } finally {
        setLoading(false);
      }
    },
    [range]
  );

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadData(user.id);
      }
    };
    getUser();
  }, [loadData, supabase]);

  const filteredFolders = useMemo(() => {
    const query = folderQuery.trim().toLowerCase();
    if (!query) return folders;
    return folders.filter((folder) =>
      [folder.name, folder.icon].join(" ").toLowerCase().includes(query)
    );
  }, [folderQuery, folders]);

  const filteredItems = useMemo(() => {
    const query = itemQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFolder =
        folderFilter === ALL_FOLDERS || item.folder_id === folderFilter;
      const matchesQuery =
        !query ||
        [
          item.name,
          item.folder_name,
          item.unit,
          item.note ?? "",
          item.date,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesFolder && matchesQuery;
    });
  }, [folderFilter, itemQuery, items]);

  const shownTotal = useMemo(
    () => filteredItems.reduce((sum, item) => sum + item.total, 0),
    [filteredItems]
  );
  const budgetedFolders = folders.filter(
    (folder) => folder.budget_limit && folder.budget_limit > 0
  ).length;

  const refresh = () => {
    if (userId) loadData(userId);
  };

  const handleSaveFolder = async (data: CreateFolderData) => {
    if (!userId) return;
    if (editingFolder) {
      await updateFolder(editingFolder.id, data);
      toast.success("Folder updated");
    } else {
      await createFolder(userId, data);
      toast.success("Folder created");
    }
    setEditingFolder(null);
    refresh();
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      toast.success("Folder deleted");
      refresh();
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  const handleSaveItem = async (data: CreateItemData) => {
    if (!userId) return;
    if (editingItem) {
      await updateItem(editingItem.id, data);
      toast.success("Item updated");
    } else {
      await createItem(userId, data);
      toast.success("Item added");
    }
    setEditingItem(undefined);
    setDuplicatingItem(undefined);
    refresh();
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId);
      toast.success("Item deleted");
      refresh();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const handleDuplicateItem = (item: ItemWithFolder) => {
    setDuplicatingItem(item);
    setShowItemForm(true);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    try {
      setLoading(true);
      await Promise.all(Array.from(selectedItems).map(id => deleteItem(id)));
      toast.success(`Deleted ${selectedItems.size} items`);
      setSelectedItems(new Set());
      refresh();
    } catch {
      toast.error("Failed to delete some items");
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItems(newSet);
  };

  const openNewItem = (folderId?: string) => {
    setEditingItem(undefined);
    setDuplicatingItem(undefined);
    setDefaultFolderId(folderId ?? folders[0]?.id);
    setShowItemForm(true);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-heading">
          <h1>Manage</h1>
          <p>Create folders, log expenses, and find records for {periodLabel}</p>
        </div>
        <div className="page-actions">
          <button
            className="btn-ghost"
            onClick={() => {
              setEditingFolder(null);
              setShowFolderForm(true);
            }}
          >
            <FolderOpen className="h-4 w-4" />
            New Folder
          </button>
          <button
            className="btn-primary"
            disabled={folders.length === 0}
            onClick={() => openNewItem()}
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
          <PeriodSelector range={range} onRangeChange={setRange} />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card-base" style={{ padding: 20 }}>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Folders
          </p>
          <p className="mono mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {folders.length}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {budgetedFolders} with budgets
          </p>
        </div>
        <div className="card-base" style={{ padding: 20 }}>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Items Shown
          </p>
          <p className="mono mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {filteredItems.length}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {items.length} in this period
          </p>
        </div>
        <div className="card-base" style={{ padding: 20 }}>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Shown Total
          </p>
          <p className="mono mt-2 text-2xl font-semibold text-[var(--accent)]">
            {formatPKR(shownTotal)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            after search and filters
          </p>
        </div>
        <div className="card-base" style={{ padding: 20 }}>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Active Filter
          </p>
          <p className="mt-2 truncate text-xl font-semibold text-[var(--text-primary)]">
            {folderFilter === ALL_FOLDERS
              ? "All folders"
              : folders.find((folder) => folder.id === folderFilter)?.name ??
                "Folder"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {periodLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(420px,0.95fr)_minmax(0,1.05fr)]">
        <section className="card-base" style={{ padding: 24 }}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Folders
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Search, edit budgets, or add an item directly
              </p>
            </div>
            <div className="relative w-full sm:max-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="search"
                value={folderQuery}
                onChange={(event) => setFolderQuery(event.target.value)}
                placeholder="Search folders"
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-8 text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                No matching folders
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Try another search term.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="group border-b border-[var(--border)] p-4 transition-colors last:border-b-0 hover:bg-[var(--bg-elevated)]"
                >
                  <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-start">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-page)] text-2xl sm:h-12 sm:w-12">
                      {folder.icon}
                    </div>

                    <Link
                      href={`/dashboard/folders/${folder.id}?${rangeQueryString}`}
                      className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                    >
                      <span className="block min-w-0">
                        <span className="block break-words text-sm font-semibold leading-snug text-[var(--text-primary)]">
                          {folder.name}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
                          <span>{folder.item_count} items</span>
                          <span className="hidden text-[var(--border)] sm:inline">
                            /
                          </span>
                          <span className="mono">
                            {formatPKR(folder.monthly_total)}
                          </span>
                        </span>
                      </span>
                    </Link>

                    <div className="col-span-2 mt-3 flex items-center justify-between gap-2 sm:col-span-1 sm:mt-0 sm:justify-end">
                      <Link
                        href={`/dashboard/folders/${folder.id}?${rangeQueryString}`}
                        className="btn-ghost h-8 px-2 text-xs sm:hidden"
                      >
                        Open
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <div className="flex items-center gap-1">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                        onClick={() => openNewItem(folder.id)}
                        aria-label={`Add item to ${folder.name}`}
                        title="Add item"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                        onClick={() => {
                          setEditingFolder(folder);
                          setShowFolderForm(true);
                        }}
                        aria-label={`Edit ${folder.name}`}
                        title="Edit folder"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <ConfirmDialog
                        title="Delete folder?"
                        description={`Delete "${folder.name}" and all items inside it? This cannot be undone.`}
                        confirmLabel="Delete Folder"
                        onConfirm={() => handleDeleteFolder(folder.id)}
                        trigger={
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                            aria-label={`Delete ${folder.name}`}
                            title="Delete folder"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        }
                      />
                      </div>
                    </div>
                  </div>

                  {folder.budget_limit && folder.budget_limit > 0 && (
                    <div className="mt-4 pl-0 sm:pl-[60px]">
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="text-[var(--text-muted)]">
                          Budget
                        </span>
                        <span className="mono text-[var(--text-secondary)]">
                          {formatPKR(folder.monthly_total)} /{" "}
                          {formatPKR(folder.budget_limit)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)]"
                          style={{
                            width: `${Math.min(
                              Math.round(
                                (folder.monthly_total / folder.budget_limit) *
                                  100
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card-base" style={{ padding: 24 }}>
          {selectedItems.size > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-[var(--accent-light)] px-4 py-2 border border-[var(--border)]">
              <span className="text-sm font-medium" style={{ color: "var(--accent-text)" }}>
                {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
              </span>
              <ConfirmDialog
                title="Delete items?"
                description={`Are you sure you want to delete ${selectedItems.size} items? This cannot be undone.`}
                confirmLabel="Delete All"
                onConfirm={handleBulkDelete}
                trigger={
                  <button className="btn-danger h-8 px-3 text-xs">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete Selected
                  </button>
                }
              />
            </div>
          )}

          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Items
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Manage expenses across every folder
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="search"
                  value={itemQuery}
                  onChange={(event) => setItemQuery(event.target.value)}
                  placeholder="Search items"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] pl-9 pr-3 text-sm"
                />
              </div>
              <div className="relative">
                <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <select
                  value={folderFilter}
                  onChange={(event) => setFolderFilter(event.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] pl-9 pr-3 text-sm"
                  aria-label="Filter items by folder"
                >
                  <option value={ALL_FOLDERS}>All folders</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-lg bg-[var(--bg-elevated)]"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-10 text-center">
              <ReceiptText className="mx-auto mb-3 h-6 w-6 text-[var(--text-muted)]" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                No matching items
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Add a new item or adjust the current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    <th className="px-2 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedItems.size > 0 && selectedItems.size === filteredItems.length}
                        ref={input => {
                          if (input) {
                            input.indeterminate = selectedItems.size > 0 && selectedItems.size < filteredItems.length;
                          }
                        }}
                        onChange={toggleSelectAll}
                        className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                      />
                    </th>
                    <th className="px-2 py-3">Date</th>
                    <th className="px-2 py-3">Item</th>
                    <th className="px-2 py-3">Folder</th>
                    <th className="px-2 py-3">Qty</th>
                    <th className="px-2 py-3 text-right">Total</th>
                    <th className="w-[86px] px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="group border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-elevated)]"
                      style={{ height: 52 }}
                    >
                      <td className="px-2 w-10">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                        />
                      </td>
                      <td className="px-2 text-sm text-[var(--text-secondary)]">
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-2">
                        <p className="font-medium text-[var(--text-primary)]">
                          {item.name}
                        </p>
                        {item.note && (
                          <p className="max-w-[260px] truncate text-xs text-[var(--text-muted)]">
                            {item.note}
                          </p>
                        )}
                      </td>
                      <td className="px-2 text-sm text-[var(--text-secondary)]">
                        <span className="mr-1">{item.folder_icon}</span>
                        {item.folder_name}
                      </td>
                      <td className="px-2 text-sm text-[var(--text-secondary)]">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="mono px-2 text-right text-sm font-semibold text-[var(--accent)]">
                        {formatPKR(item.total)}
                      </td>
                      <td className="px-2">
                        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          <button
                            className="rounded p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                            onClick={() => {
                              setEditingItem(item);
                              setShowItemForm(true);
                            }}
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                            onClick={() => handleDuplicateItem(item)}
                            aria-label={`Duplicate ${item.name}`}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <ConfirmDialog
                            title="Delete item?"
                            description={`Delete "${item.name}"? This cannot be undone.`}
                            confirmLabel="Delete"
                            onConfirm={() => handleDeleteItem(item.id)}
                            trigger={
                              <button
                                className="rounded p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                                aria-label={`Delete ${item.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <FolderForm
        open={showFolderForm}
        onOpenChange={(open) => {
          setShowFolderForm(open);
          if (!open) setTimeout(() => setEditingFolder(null), 200);
        }}
        onSubmit={handleSaveFolder}
        initialData={editingFolder ?? undefined}
        title={editingFolder ? "Edit Folder" : "New Folder"}
      />

      <ManageItemForm
        open={showItemForm}
        onOpenChange={(open) => {
          setShowItemForm(open);
          if (!open) {
            setTimeout(() => {
              setEditingItem(undefined);
              setDuplicatingItem(undefined);
            }, 200);
          }
        }}
        onSubmit={handleSaveItem}
        folders={folders}
        initialData={editingItem ?? duplicatingItem ?? undefined}
        defaultFolderId={defaultFolderId}
        defaultDate={defaultItemDate}
      />
    </div>
  );
}
