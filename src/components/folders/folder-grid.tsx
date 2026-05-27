"use client";

import { FolderCard } from "./folder-card";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { FolderWithStats } from "@/types";

interface FolderGridProps {
  folders: FolderWithStats[];
  loading: boolean;
  onCreateFolder: () => void;
  queryString?: string;
}

export function FolderGrid({
  folders,
  loading,
  onCreateFolder,
  queryString,
}: FolderGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <EmptyState
        emoji="🗂️"
        title="No folders yet"
        description="Create your first folder to start tracking expenses."
        actionLabel="Create Folder"
        onAction={onCreateFolder}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {folders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} queryString={queryString} />
      ))}
    </div>
  );
}
