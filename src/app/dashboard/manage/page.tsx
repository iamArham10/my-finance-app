import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRangeFromSearch } from "@/lib/date-range";
import { getManageInitialData } from "@/lib/supabase/dashboard-data";
import { ManageClient } from "@/components/dashboard/manage-client";

type ManageSearchParams = Promise<{
  from?: string;
  to?: string;
}>;

export default async function ManagePage({
  searchParams,
}: {
  searchParams: ManageSearchParams;
}) {
  const params = await searchParams;
  const range = getRangeFromSearch(toRangeQuery(params));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initialData = await getManageInitialData({
    userId: user.id,
    range,
    limit: 100,
  });

  const dataKey = [
    range.startDate,
    range.endDate,
    initialData.folders.length,
    initialData.items.length,
    initialData.items[0]?.id ?? "empty",
    initialData.nextCursor ?? "end",
  ].join(":");

  return <ManageClient key={dataKey} initialData={initialData} />;
}

function toRangeQuery(params: Awaited<ManageSearchParams>) {
  const query = new URLSearchParams();
  if (typeof params.from === "string") query.set("from", params.from);
  if (typeof params.to === "string") query.set("to", params.to);
  return query.toString();
}
