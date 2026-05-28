"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPKR } from "@/components/ui/money";
import {
  CalendarDays,
  Hash,
  Loader2,
  Package,
  ReceiptText,
  Tag,
  FolderOpen,
} from "lucide-react";
import type { CreateItemData, Item } from "@/types";

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Item;
  defaultDate?: string;
  folders?: { id: string; name: string; icon?: string }[];
}

const UNIT_OPTIONS = ["litres", "kg", "pcs", "hours", "months"];

export function ItemForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  defaultDate,
  folders,
}: ItemFormProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full overflow-y-auto p-0 sm:max-w-[520px]"
        style={{
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <ItemFormFields
          key={`${open ? "open" : "closed"}-${initialData?.id ?? "new"}`}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
          initialData={initialData}
          defaultDate={defaultDate}
          folders={folders}
        />
      </SheetContent>
    </Sheet>
  );
}

function ItemFormFields({
  onOpenChange,
  onSubmit,
  initialData,
  defaultDate,
  folders,
}: Omit<ItemFormProps, "open">) {
  const initialUnit = initialData
    ? UNIT_OPTIONS.includes(initialData.unit)
      ? initialData.unit
      : "custom"
    : "pcs";

  const [name, setName] = useState(initialData?.name ?? "");
  const [folderId, setFolderId] = useState(
    initialData?.folder_id ?? (folders && folders.length > 0 ? folders[0].id : "")
  );
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
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const liveTotal =
    parseFloat(price || "0") * parseFloat(quantity || "0") || 0;
  const fieldClass =
    "h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-3 focus:ring-[var(--accent-light)]";
  const fieldWithIconClass = `${fieldClass} pl-10`;
  const iconClass =
    "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]";
  const labelClass =
    "mb-1.5 block text-sm font-medium text-[var(--text-primary)]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      const payload: any = {
        name: name.trim(),
        price: parsedPrice,
        quantity: parsedQuantity,
        unit: finalUnit,
        date,
        note: note.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };
      if (folders) {
        payload.folder_id = folderId;
      }
      await onSubmit(payload);
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
            <label htmlFor="item-name" className={labelClass}>
              Item Name
            </label>
            <div className="relative">
              <Package className={iconClass} />
              <input
                id="item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shell Petrol"
                required
                className={fieldWithIconClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item-price" className={labelClass}>
                Price per unit
              </label>
              <div className="relative">
                <Tag className={iconClass} />
                <input
                  id="item-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  className={`${fieldWithIconClass} mono`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="item-quantity" className={labelClass}>
                Quantity
              </label>
              <div className="relative">
                <Hash className={iconClass} />
                <input
                  id="item-quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
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
            <label htmlFor="item-unit" className={labelClass}>
              Unit
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr]">
              <select
                id="item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={fieldClass}
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="custom">Custom...</option>
              </select>
              {unit === "custom" && (
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
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
                  <p
                    className="text-xs font-medium uppercase tracking-[0.08em]"
                    style={{ color: "var(--accent-text)" }}
                  >
                    Total
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Price x quantity
                  </p>
                </div>
              </div>
              <span
                className="mono text-right text-xl font-semibold"
                style={{ color: "var(--accent)" }}
              >
                {formatPKR(liveTotal)}
              </span>
            </div>
          </div>

          {folders && (
            <div>
              <label htmlFor="item-folder" className={labelClass}>
                Folder
              </label>
              <div className="relative">
                <FolderOpen className={iconClass} />
                <select
                  id="item-folder"
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className={fieldWithIconClass}
                  required
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.icon} {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="item-date" className={labelClass}>
              Date
            </label>
            <div className="relative">
              <CalendarDays className={iconClass} />
              <input
                id="item-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={fieldWithIconClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="item-note" className={labelClass}>
              Note{" "}
              <span className="text-[var(--text-muted)] font-normal">
                (optional)
              </span>
            </label>
            <textarea
              id="item-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add details..."
              rows={2}
              className={`${fieldClass} min-h-20 py-2`}
            />
          </div>

          <div>
            <label className={labelClass}>Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-text)]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((_, i) => i !== index))}
                    className="ml-0.5 text-[var(--accent-text)] hover:text-black dark:hover:text-white"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  const newTag = tagInput.trim().toLowerCase();
                  if (newTag && !tags.includes(newTag)) {
                    setTags([...tags, newTag]);
                    setTagInput("");
                  }
                }
              }}
              placeholder="Type a tag and press Enter"
              className={fieldClass}
            />
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full"
            style={{ height: 44 }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              initialData ? "Save Changes" : "Add Item"
            )}
          </button>
        </form>
    </>
  );
}
