import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFolderById, getFoldersWithStats } from "@/lib/supabase/folders";
import { getReportItems } from "@/lib/supabase/items";
import { ExportReportActions } from "@/components/export/export-report-actions";
import { formatPKR } from "@/components/ui/money";
import { getRangeFromSearch, getRangeLabel } from "@/lib/date-range";
import type { DateRange, FolderWithStats, ItemWithFolder } from "@/types";

type ExportSearchParams = Promise<{
  from?: string;
  to?: string;
  folderId?: string;
}>;

export default async function ExportPage({
  searchParams,
}: {
  searchParams: ExportSearchParams;
}) {
  const params = await searchParams;
  const range = getReportRange(params);
  const folderId = typeof params.folderId === "string" ? params.folderId : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [folders, items, selectedFolder] = await Promise.all([
    getFoldersWithStats(user.id, range),
    getReportItems(user.id, range, folderId),
    folderId ? getFolderById(folderId) : Promise.resolve(null),
  ]);

  if (folderId && (!selectedFolder || selectedFolder.user_id !== user.id)) {
    redirect("/dashboard");
  }

  const reportFolders = folderId
    ? folders.filter((folder) => folder.id === folderId)
    : folders;
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const title = selectedFolder
    ? `${selectedFolder.icon} ${selectedFolder.name} Expense Report`
    : "Expense Report";
  const periodLabel = getRangeLabel(range);
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-950 print:px-0 print:py-0">
      <ExportReportActions />
      <article className="mx-auto max-w-[980px] rounded-lg border border-slate-200 bg-white p-8 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <ReportHeader
          title={title}
          periodLabel={periodLabel}
          generatedAt={generatedAt}
          total={total}
          itemCount={items.length}
          folderCount={reportFolders.filter((folder) => folder.monthly_total > 0).length}
        />

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Metric label="Total Spent" value={formatPKR(total)} />
          <Metric label="Items" value={String(items.length)} />
          <Metric
            label={selectedFolder ? "Folder" : "Active Folders"}
            value={
              selectedFolder
                ? selectedFolder.name
                : String(reportFolders.filter((folder) => folder.monthly_total > 0).length)
            }
          />
        </section>

        <FolderSummary folders={reportFolders} total={total} />
        <ItemsSection items={items} />
      </article>
    </main>
  );
}

function getReportRange(params: Awaited<ExportSearchParams>): DateRange {
  const query = new URLSearchParams();
  if (typeof params.from === "string") query.set("from", params.from);
  if (typeof params.to === "string") query.set("to", params.to);
  return getRangeFromSearch(query.toString());
}

function ReportHeader({
  title,
  periodLabel,
  generatedAt,
  total,
  itemCount,
  folderCount,
}: {
  title: string;
  periodLabel: string;
  generatedAt: string;
  total: number;
  itemCount: number;
  folderCount: number;
}) {
  return (
    <header className="border-b border-slate-200 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Kharcha
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">{periodLabel}</p>
        </div>
        <div className="rounded-lg border border-slate-200 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
            Report Total
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-emerald-700">
            {formatPKR(total)}
          </p>
        </div>
      </div>
      <p className="mt-5 text-xs text-slate-500">
        Generated {generatedAt} · {itemCount} items · {folderCount} active folders
      </p>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function FolderSummary({
  folders,
  total,
}: {
  folders: FolderWithStats[];
  total: number;
}) {
  const activeFolders = folders
    .filter((folder) => folder.monthly_total > 0)
    .sort((a, b) => b.monthly_total - a.monthly_total);

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-950">Folder Summary</h2>
      {activeFolders.length === 0 ? (
        <p className="mt-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
          No folder spending in this date range.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Folder</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Share</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {activeFolders.map((folder) => (
                <tr key={folder.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-950">
                    {folder.icon} {folder.name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {folder.item_count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {total > 0 ? Math.round((folder.monthly_total / total) * 100) : 0}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-950">
                    {formatPKR(folder.monthly_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ItemsSection({ items }: { items: ItemWithFolder[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-950">Item Details</h2>
      {items.length === 0 ? (
        <p className="mt-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
          No items found for this date range.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Folder</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="break-inside-avoid border-t border-slate-200">
                  <td className="px-4 py-3 text-slate-700">{formatDate(item.date)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-950">{item.name}</p>
                    {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.folder_icon} {item.folder_name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {formatPKR(item.price)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-950">
                    {formatPKR(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
