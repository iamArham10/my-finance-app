import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-56 animate-pulse rounded bg-[var(--bg-elevated)]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
