import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRangeFromSearch } from "@/lib/date-range";
import { getAnalyticsInitialData } from "@/lib/supabase/dashboard-data";
import { AnalyticsClient } from "@/components/dashboard/analytics-client";

type AnalyticsSearchParams = Promise<{
  from?: string;
  to?: string;
}>;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: AnalyticsSearchParams;
}) {
  const params = await searchParams;
  const range = getRangeFromSearch(toRangeQuery(params));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initialData = await getAnalyticsInitialData({ userId: user.id, range });

  return <AnalyticsClient initialData={initialData} />;
}

function toRangeQuery(params: Awaited<AnalyticsSearchParams>) {
  const query = new URLSearchParams();
  if (typeof params.from === "string") query.set("from", params.from);
  if (typeof params.to === "string") query.set("to", params.to);
  return query.toString();
}
