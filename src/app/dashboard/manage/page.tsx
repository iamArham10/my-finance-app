"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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

      <div className="flex flex-col gap-6">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[600px] overflow-y-auto pr-2 pb-2">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button, input, a')) return;
                    router.push(`/dashboard/folders/${folder.id}?${rangeQueryString}`);
                  }}
                  className="group relative flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--border-focus)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-page)] text-xl" role="img" aria-label={folder.name}>
                        {folder.icon}
                      </span>
                      <span
                        className="font-semibold text-[var(--text-primary)] group-hover:underline text-[15px]"
                      >
                        {folder.name}
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] font-medium">
                      {folder.item_count} items
                    </span>
                  </div>

                  <div className="mb-4 flex items-end justify-between">
                    <div className="text-[var(--accent)] text-xl font-semibold mono">
                      {formatPKR(folder.monthly_total)}
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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

                  {folder.budget_limit && folder.budget_limit > 0 && (
                    <div className="mt-auto">
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

          <div className="mb-5 flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

            {filteredItems.length > 0 && (
              <div className="flex items-center pb-2 border-b border-[var(--border)]">
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
                  id="select-all-items"
                />
                <label htmlFor="select-all-items" className="ml-2 text-sm text-[var(--text-secondary)] font-medium cursor-pointer">
                  Select All
                </label>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-xl bg-[var(--bg-elevated)]"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[600px] overflow-y-auto pr-2 pb-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button, input, a')) return;
                    router.push(`/dashboard/folders/${item.folder_id}?${rangeQueryString}`);
                  }}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer ${selectedItems.has(item.id) ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] bg-[var(--bg-surface)]'}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--text-primary)] text-[15px] truncate group-hover:underline">
                        {item.name}
                      </p>
                      {item.note && (
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                          {item.note}
                        </p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] flex-shrink-0"
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="flex-shrink-0">{item.folder_icon}</span>
                      <span className="truncate">{item.folder_name}</span>
                    </div>
                    <div className="flex-shrink-0 whitespace-nowrap ml-2">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--text-muted)] mb-0.5">
                        {item.quantity > 1 ? `${item.quantity} ${item.unit}` : 'Total'}
                      </p>
                      <p className="mono font-semibold text-[var(--accent)] text-lg truncate">
                        {formatPKR(item.total)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                        onClick={() => {
                          setEditingItem(item);
                          setShowItemForm(true);
                        }}
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
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
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
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
