import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRangeFromSearch } from "@/lib/date-range";
import { getFolderDetailInitialData } from "@/lib/supabase/dashboard-data";
import { FolderDetailClient } from "@/components/dashboard/folder-detail-client";

type FolderDetailSearchParams = Promise<{
  from?: string;
  to?: string;
}>;

export default async function FolderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: FolderDetailSearchParams;
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const range = getRangeFromSearch(toRangeQuery(resolvedSearchParams));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initialData = await getFolderDetailInitialData({
    userId: user.id,
    folderId: id,
    range,
  });

  if (!initialData) redirect("/dashboard");

  return <FolderDetailClient folderId={id} initialData={initialData} />;
}

function toRangeQuery(params: Awaited<FolderDetailSearchParams>) {
  const query = new URLSearchParams();
  if (typeof params.from === "string") query.set("from", params.from);
  if (typeof params.to === "string") query.set("to", params.to);
  return query.toString();
}
