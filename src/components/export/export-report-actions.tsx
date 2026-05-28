"use client";

import { Download, Printer, FileSpreadsheet } from "lucide-react";
import type { ItemWithFolder } from "@/types";

function convertToCSV(items: ItemWithFolder[]) {
  const headers = ["Date", "Item", "Folder", "Price", "Quantity", "Unit", "Total", "Note"];
  
  const escapeCsv = (str: string | null | undefined) => {
    if (!str) return '""';
    const escaped = str.toString().replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = items.map(item => [
    escapeCsv(item.date),
    escapeCsv(item.name),
    escapeCsv(item.folder_name),
    item.price,
    item.quantity,
    escapeCsv(item.unit),
    item.total,
    escapeCsv(item.note)
  ]);

  return [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");
}

export function ExportReportActions({ items = [] }: { items?: ItemWithFolder[] }) {
  const handleDownloadCSV = () => {
    if (!items.length) return;
    const csvContent = convertToCSV(items);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kharcha_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="no-print fixed right-6 top-6 z-10 flex gap-2">
      <button type="button" className="btn-ghost bg-[var(--bg-surface)]" onClick={() => window.close()}>
        Close
      </button>
      <button type="button" className="btn-ghost bg-[var(--bg-surface)] text-[var(--accent)]" onClick={handleDownloadCSV} disabled={items.length === 0}>
        <FileSpreadsheet className="h-4 w-4 mr-1.5" />
        CSV
      </button>
      <button type="button" className="btn-primary" onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-1.5" />
        PDF
      </button>
    </div>
  );
}

export function ExportLink({
  href,
  label = "Export",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="export-link">
      <Download className="h-4 w-4" />
      {label}
    </a>
  );
}
