"use client";

import { useState } from "react";
import { useMemo } from "react";
import { formatPKR } from "@/components/ui/money";
import { DateLabel } from "@/components/ui/date-label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Pencil,
  Trash2,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
} from "lucide-react";
import type { Item } from "@/types";

interface ItemsTableProps {
  items: Item[];
  loading: boolean;
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => Promise<void>;
  onAddItem: () => void;
}

type SortField = "date" | "name" | "price" | "total";
type SortOrder = "asc" | "desc";

function SortIcon({
  field,
  sortField,
  sortOrder,
}: {
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
}) {
  if (sortField !== field) {
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  }

  return sortOrder === "asc" ? (
    <ArrowUp className="w-3 h-3 ml-1" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1" />
  );
}

export function ItemsTable({ items, loading, onEdit, onDelete, onAddItem }: ItemsTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [query, setQuery] = useState("");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredItems = normalizedQuery
      ? items.filter((item) =>
          [item.name, item.unit, item.note ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        )
      : items;

    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      if (sortField === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "price") {
        comparison = a.price - b.price;
      } else if (sortField === "total") {
        comparison = a.total - b.total;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [items, query, sortField, sortOrder]);

  const totalValue = useMemo(
    () => sortedItems.reduce((sum, item) => sum + item.total, 0),
    [sortedItems]
  );

  if (loading) {
    return (
      <div className="w-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-[var(--border)]">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        emoji="🧾"
        title="No items yet"
        description="Add your first item to this folder."
        actionLabel="Add Item"
        onAction={onAddItem}
      />
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {sortedItems.length} {sortedItems.length === 1 ? "item" : "items"}
          </p>
          <p className="mono text-xs text-[var(--text-muted)]">
            {formatPKR(totalValue)} shown
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search items"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-8 text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            No matching items
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Try a different search term.
          </p>
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr
            className="text-[12px] uppercase tracking-[0.08em] border-b border-[var(--border)]"
            style={{ color: "var(--text-muted)" }}
          >
            <th
              className="py-3 px-2 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              onClick={() => handleSort("date")}
            >
              <div className="flex items-center">Date <SortIcon field="date" sortField={sortField} sortOrder={sortOrder} /></div>
            </th>
            <th
              className="py-3 px-2 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center">Name <SortIcon field="name" sortField={sortField} sortOrder={sortOrder} /></div>
            </th>
            <th className="py-3 px-2">Qty</th>
            <th
              className="py-3 px-2 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              onClick={() => handleSort("price")}
            >
              <div className="flex items-center">Price/unit <SortIcon field="price" sortField={sortField} sortOrder={sortOrder} /></div>
            </th>
            <th
              className="py-3 px-2 text-right cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              onClick={() => handleSort("total")}
            >
              <div className="flex items-center justify-end">Total <SortIcon field="total" sortField={sortField} sortOrder={sortOrder} /></div>
            </th>
            <th className="py-3 px-2 w-[80px]"></th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <tr
              key={item.id}
              className="group border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
              style={{ height: 48 }}
            >
              <td className="px-2">
                <DateLabel date={item.date} />
              </td>
              <td className="px-2 font-medium" style={{ color: "var(--text-primary)" }}>
                {item.name}
              </td>
              <td className="px-2 text-sm">
                <span className="mr-1">{item.quantity}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--bg-elevated)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.unit}
                </span>
              </td>
              <td className="px-2 text-sm mono" style={{ color: "var(--text-secondary)" }}>
                {formatPKR(item.price)}
              </td>
              <td className="px-2 text-right font-semibold mono" style={{ color: "var(--accent)" }}>
                {formatPKR(item.total)}
              </td>
              <td className="px-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 rounded hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label="Edit item"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <ConfirmDialog
                    title="Delete item?"
                    description={`Are you sure you want to delete "${item.name}"? This cannot be undone.`}
                    confirmLabel="Delete"
                    onConfirm={() => onDelete(item.id)}
                    trigger={
                      <button
                        className="p-1.5 rounded hover:bg-[var(--danger-bg)] text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors"
                        aria-label="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
