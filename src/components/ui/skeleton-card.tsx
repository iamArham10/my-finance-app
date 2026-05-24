import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <div
      className="card-base"
      style={{ padding: 24 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-7 w-24 mb-3" />
      <Skeleton className="h-1.5 w-full rounded-full" />
      <Skeleton className="h-4 w-40 mt-2" />
    </div>
  );
}
