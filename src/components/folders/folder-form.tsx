"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search } from "lucide-react";
import type { CreateFolderData } from "@/types";
import { EMOJI_CATEGORIES, EMOJI_OPTIONS } from "./emoji-options";

interface FolderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateFolderData) => Promise<void>;
  initialData?: { name: string; icon: string; budget_limit: number | null };
  title?: string;
}

export function FolderForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title = "New Folder",
}: FolderFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [icon, setIcon] = useState(initialData?.icon ?? "🗂️");
  const [budgetLimit, setBudgetLimit] = useState(
    initialData?.budget_limit?.toString() ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [iconSearch, setIconSearch] = useState("");
  const [iconCategory, setIconCategory] = useState("All");

  const filteredEmojiOptions = useMemo(() => {
    const query = iconSearch.trim().toLowerCase();
    const categoryOptions =
      iconCategory === "All"
        ? EMOJI_OPTIONS
        : EMOJI_OPTIONS.filter((option) => option.category === iconCategory);

    if (!query) return categoryOptions;

    return categoryOptions.filter(
      (option) =>
        option.emoji.includes(query) ||
        option.label.toLowerCase().includes(query) ||
        option.keywords.includes(query)
    );
  }, [iconCategory, iconSearch]);

  const selectedEmoji = useMemo(
    () => EMOJI_OPTIONS.find((option) => option.emoji === icon),
    [icon]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Folder name is required.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        icon,
        budget_limit: budgetLimit ? parseFloat(budgetLimit) : null,
      });
      // Reset form
      if (!initialData) {
        setName("");
        setIcon("🗂️");
        setBudgetLimit("");
      }
      onOpenChange(false);
    } catch {
      setError("Failed to save folder. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          maxWidth: 520,
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Folder Name */}
          <div>
            <label
              htmlFor="folder-name"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              Folder Name
            </label>
            <input
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries"
              className="w-full px-3"
              style={{ border: "1px solid var(--border)" }}
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Icon
            </label>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-page)] p-3">
              <div className="mb-3 grid grid-cols-[72px_1fr] gap-3">
                <div className="flex h-[72px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-4xl">
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {selectedEmoji?.label ?? "Custom icon"}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {filteredEmojiOptions.length} options shown
                  </p>
                  <div className="relative mt-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="search"
                      value={iconSearch}
                      onChange={(event) => setIconSearch(event.target.value)}
                      placeholder="Search fuel, food, bills..."
                      className="h-9 w-full px-3 pl-9"
                      style={{ border: "1px solid var(--border)" }}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-[92px_1fr] gap-2">
                <select
                  value={iconCategory}
                  onChange={(event) => setIconCategory(event.target.value)}
                  className="h-9 px-2 text-xs"
                  style={{ border: "1px solid var(--border)" }}
                  aria-label="Emoji category"
                >
                  {EMOJI_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="flex min-w-0 items-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-muted)]">
                  {iconCategory === "All"
                    ? "All categories"
                    : `${iconCategory} category`}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2">
                <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
                  {filteredEmojiOptions.map(({ emoji, keywords, label }, index) => (
                    <button
                      key={`${index}-${emoji}`}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className="flex h-9 w-full items-center justify-center rounded-md text-lg transition-all duration-150 hover:bg-[var(--accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                      aria-label={`Use ${emoji} icon for ${label}`}
                      title={`${label} — ${keywords}`}
                      style={{
                        background:
                          icon === emoji
                            ? "var(--accent-light)"
                            : "transparent",
                        border:
                          icon === emoji
                            ? "1px solid var(--accent)"
                            : "1px solid transparent",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {filteredEmojiOptions.length === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-[var(--text-muted)]">
                    No matching emojis
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Budget Limit */}
          <div>
            <label
              htmlFor="folder-budget"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              Monthly Budget Limit
            </label>
            <input
              id="folder-budget"
              type="number"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(e.target.value)}
              placeholder="in PKR — leave blank for no limit"
              min="0"
              step="100"
              className="w-full px-3"
              style={{ border: "1px solid var(--border)" }}
            />
          </div>

          {error && (
            <div
              className="text-sm rounded-lg px-3 py-2"
              style={{
                color: "var(--danger)",
                background: "var(--danger-bg)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            style={{ height: 40 }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {initialData ? "Saving…" : "Creating…"}
              </>
            ) : initialData ? (
              "Save Changes"
            ) : (
              "Create Folder"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
