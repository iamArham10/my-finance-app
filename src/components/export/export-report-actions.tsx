"use client";

import { Download, Printer } from "lucide-react";

export function ExportReportActions() {
  return (
    <div className="no-print fixed right-6 top-6 z-10 flex gap-2">
      <button type="button" className="btn-ghost bg-[var(--bg-surface)]" onClick={() => window.close()}>
        Close
      </button>
      <button type="button" className="btn-primary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Save PDF
      </button>
    </div>
  );
}

export function ExportLink({
  href,
  label = "Export PDF",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="btn-ghost">
      <Download className="h-4 w-4" />
      {label}
    </a>
  );
}
