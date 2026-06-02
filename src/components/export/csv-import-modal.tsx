"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type ImportedItem = {
  user_id: string;
  folder_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  total: number;
  date: string;
  note: string | null;
};

function isImportedItem(item: ImportedItem | null): item is ImportedItem {
  return item !== null;
}

/** Simple regex-based CSV parser handling basic quoted fields. */
function parseCSV(csv: string) {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) return null;

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const expectedCols = headers.length;

  const data = lines.slice(1).map(line => {
    const row: string[] = [];
    let inQuotes = false;
    let currentValue = "";
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    row.push(currentValue.trim());

    // Basic padding if rows are short
    while (row.length < expectedCols) row.push("");

    return headers.reduce((acc, header, i) => {
      acc[header] = row[i];
      return acc;
    }, {} as Record<string, string>);
  });

  return { headers, data };
}

export function CSVImportModal({ open, onOpenChange, onSuccess }: CSVImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImport = async (text: string) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = parseCSV(text);
      if (!parsed) {
        throw new Error("Invalid or empty CSV file.");
      }

      // Check required columns (expecting at least name, folder, total, date)
      const required = ["name", "folder", "total", "date"];
      for (const req of required) {
        if (!parsed.headers.includes(req)) {
          throw new Error(`Missing required column: "${req}"`);
        }
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Get or create folders
      const uniqueFolders = Array.from(new Set(parsed.data.map(r => r.folder).filter(Boolean)));
      
      const { data: existingFolders, error: efError } = await supabase
        .from("folders")
        .select("id, name")
        .eq("user_id", user.id);
        
      if (efError) throw efError;

      const folderMap = new Map<string, string>();
      for (const ef of existingFolders || []) {
        folderMap.set(ef.name.toLowerCase(), ef.id);
      }

      for (const folderName of uniqueFolders) {
        if (!folderMap.has(folderName.toLowerCase())) {
          const { data: newFolder, error: nfError } = await supabase
            .from("folders")
            .insert({
              user_id: user.id,
              name: folderName,
              icon: "📁",
              budget_limit: null,
            })
            .select("id")
            .single();
            
          if (nfError) throw nfError;
          folderMap.set(folderName.toLowerCase(), newFolder.id);
        }
      }

      // 2. Insert items
      const itemsToInsert = parsed.data.map((row): ImportedItem | null => {
        const folderId = folderMap.get(row.folder.toLowerCase());
        if (!folderId) return null;

        // Try to parse number, default to 0
        const total = parseFloat(row.total.replace(/[^0-9.-]+/g,"")) || 0;
        const qty = parseFloat(row.quantity?.replace(/[^0-9.-]+/g,"")) || 1;
        
        let date = row.date;
        // Basic date validation, fallback to today if invalid
        if (Number.isNaN(new Date(date).getTime())) {
          date = new Date().toISOString().split("T")[0];
        } else {
          date = new Date(date).toISOString().split("T")[0];
        }

        return {
          user_id: user.id,
          folder_id: folderId,
          name: row.name || "Imported Item",
          price: qty > 0 ? total / qty : total,
          quantity: qty,
          unit: row.unit || "pcs",
          total: total,
          date: date,
          note: row.note || null,
        };
      }).filter(isImportedItem);

      if (itemsToInsert.length === 0) {
        throw new Error("No valid rows found to import.");
      }

      const { error: insertError } = await supabase
        .from("items")
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      toast.success(`Successfully imported ${itemsToInsert.length} items`);
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to process import");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file (.csv)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processImport(text);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[var(--accent)]" />
            Import CSV
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Upload a CSV file containing your expenses. Required columns: <code className="bg-[var(--bg-elevated)] px-1 py-0.5 rounded">name</code>, <code className="bg-[var(--bg-elevated)] px-1 py-0.5 rounded">folder</code>, <code className="bg-[var(--bg-elevated)] px-1 py-0.5 rounded">total</code>, and <code className="bg-[var(--bg-elevated)] px-1 py-0.5 rounded">date</code> (YYYY-MM-DD). Missing folders will be created automatically.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--danger-bg)] text-[var(--danger)] text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div 
            className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[var(--border-focus)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {loading ? (
              <>
                <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-3" />
                <p className="text-sm font-medium text-[var(--text-primary)]">Processing import...</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">This may take a moment</p>
              </>
            ) : (
              <>
                <FileText className="w-8 h-8 text-[var(--text-muted)] mb-3" />
                <p className="text-sm font-medium text-[var(--text-primary)]">Click to browse files</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Accepts standard .csv format</p>
              </>
            )}
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
