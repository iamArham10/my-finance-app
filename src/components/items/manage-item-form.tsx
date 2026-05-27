"use client";

import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPKR } from "@/components/ui/money";
import {
  CalendarDays,
  Folder,
  Hash,
  Loader2,
  Package,
  ReceiptText,
  Tag,
} from "lucide-react";
import type { CreateItemData, Folder as FolderType, ItemWithFolder } from "@/types";

interface ManageItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateItemData) => Promise<void>;
  folders: FolderType[];
  initialData?: ItemWithFolder;
  defaultFolderId?: string;
  defaultDate?: string;
}

const UNIT_OPTIONS = ["litres", "kg", "pcs", "hours", "months"];

export function ManageItemForm({
  open,
  onOpenChange,
  onSubmit,
  folders,
  initialData,
  defaultFolderId,
  defaultDate,
}: ManageItemFormProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full overflow-y-auto p-0 sm:max-w-[520px]"
        style={{
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <ManageItemFormFields
          key={`${open ? "open" : "closed"}-${initialData?.id ?? "new"}`}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
          folders={folders}
          initialData={initialData}
          defaultFolderId={defaultFolderId}
          defaultDate={defaultDate}
        />
      </SheetContent>
    </Sheet>
  );
}

function ManageItemFormFields({
  onOpenChange,
  onSubmit,
  folders,
  initialData,
  defaultFolderId,
  defaultDate,
}: Omit<ManageItemFormProps, "open">) {
  const initialUnit = initialData
    ? UNIT_OPTIONS.includes(initialData.unit)
      ? initialData.unit
      : "custom"
    : "pcs";
  const fallbackFolderId = folders[0]?.id ?? "";

  const [folderId, setFolderId] = useState(
    initialData?.folder_id ?? defaultFolderId ?? fallbackFolderId
  );
  const [name, setName] = useState(initialData?.name ?? "");
  const [price, setPrice] = useState(initialData?.price.toString() ?? "");
  const [quantity, setQuantity] = useState(
    initialData?.quantity.toString() ?? "1"
  );
  const [unit, setUnit] = useState(initialUnit);
  const [customUnit, setCustomUnit] = useState(
    initialData && !UNIT_OPTIONS.includes(initialData.unit)
      ? initialData.unit
      : ""
  );
  const [date, setDate] = useState(
    initialData?.date ?? defaultDate ?? new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState(initialData?.note ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const liveTotal =
    parseFloat(price || "0") * parseFloat(quantity || "0") || 0;
  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === folderId),
    [folderId, folders]
  );
  const fieldClass =
    "h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-3 focus:ring-[var(--accent-light)]";
  const fieldWithIconClass = `${fieldClass} pl-10`;
  const iconClass =
    "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]";
  const labelClass =
    "mb-1.5 block text-sm font-medium text-[var(--text-primary)]";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!folderId) {
      setError("Choose a folder for this item.");
      return;
    }
    if (!name.trim()) {
      setError("Item name is required.");
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseFloat(quantity);
    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError("Enter a valid price and quantity.");
      return;
    }

    const finalUnit = unit === "custom" ? customUnit.trim() : unit;
    if (!finalUnit) {
      setError("Unit is required.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        folder_id: folderId,
        name: name.trim(),
        price: parsedPrice,
        quantity: parsedQuantity,
        unit: finalUnit,
        date,
        note: note.trim() || undefined,
      });
      onOpenChange(false);
    } catch {
      setError("Failed to save item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SheetHeader className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <SheetTitle
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          {initialData ? "Edit Item" : "Add Item"}
        </SheetTitle>
      </SheetHeader>

      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-6">
        <div>
          <label htmlFor="manage-item-folder" className={labelClass}>
            Folder
          </label>
          <div className="relative">
            <Folder className={iconClass} />
            <select
              id="manage-item-folder"
              value={folderId}
              onChange={(event) => setFolderId(event.target.value)}
              required
              className={fieldWithIconClass}
            >
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.icon} {folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="manage-item-name" className={labelClass}>
            Item Name
          </label>
          <div className="relative">
            <Package className={iconClass} />
            <input
              id="manage-item-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Shell Petrol"
              required
              className={fieldWithIconClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="manage-item-price" className={labelClass}>
              Price per unit
            </label>
            <div className="relative">
              <Tag className={iconClass} />
              <input
                id="manage-item-price"
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                className={`${fieldWithIconClass} mono`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="manage-item-quantity" className={labelClass}>
              Quantity
            </label>
            <div className="relative">
              <Hash className={iconClass} />
              <input
                id="manage-item-quantity"
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="1"
                min="0.001"
                step="0.001"
                required
                className={`${fieldWithIconClass} mono`}
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="manage-item-unit" className={labelClass}>
            Unit
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr]">
            <select
              id="manage-item-unit"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              className={fieldClass}
            >
              {UNIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {unit === "custom" && (
              <input
                type="text"
                value={customUnit}
                onChange={(event) => setCustomUnit(event.target.value)}
                placeholder="e.g. boxes"
                required
                className={fieldClass}
              />
            )}
          </div>
        </div>

        <div
          className="rounded-lg border p-4"
          style={{
            background: "var(--accent-light)",
            borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-[var(--accent)]">
                <ReceiptText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--accent-text)]">
                  Total
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedFolder?.name ?? "Selected folder"}
                </p>
              </div>
            </div>
            <span className="mono text-right text-xl font-semibold text-[var(--accent)]">
              {formatPKR(liveTotal)}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="manage-item-date" className={labelClass}>
            Date
          </label>
          <div className="relative">
            <CalendarDays className={iconClass} />
            <input
              id="manage-item-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className={fieldWithIconClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="manage-item-note" className={labelClass}>
            Note{" "}
            <span className="font-normal text-[var(--text-muted)]">
              (optional)
            </span>
          </label>
          <textarea
            id="manage-item-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add details..."
            rows={2}
            className={`${fieldClass} min-h-20 py-2`}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || folders.length === 0}
          className="btn-primary mt-2 w-full"
          style={{ height: 44 }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : initialData ? (
            "Save Changes"
          ) : (
            "Add Item"
          )}
        </button>
      </form>
    </>
  );
}
