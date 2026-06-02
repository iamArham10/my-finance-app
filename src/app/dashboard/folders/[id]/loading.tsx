import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function FolderDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 animate-pulse rounded bg-[var(--bg-elevated)]" />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
