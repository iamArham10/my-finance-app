import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRangeFromSearch } from "@/lib/date-range";
import { getDashboardSummary } from "@/lib/supabase/dashboard-data";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

type DashboardSearchParams = Promise<{
  from?: string;
  to?: string;
}>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const params = await searchParams;
  const range = getRangeFromSearch(toRangeQuery(params));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initialData = await getDashboardSummary({ userId: user.id, range });

  return <DashboardClient initialData={initialData} />;
}

function toRangeQuery(params: Awaited<DashboardSearchParams>) {
  const query = new URLSearchParams();
  if (typeof params.from === "string") query.set("from", params.from);
  if (typeof params.to === "string") query.set("to", params.to);
  return query.toString();
}
