'use client';

import { Skeleton } from '@shared/components/ui/skeleton';

export function WorkspaceUserDropdownSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5">
      <Skeleton className="size-6 shrink-0 rounded" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-6 w-44" />
      </div>
    </div>
  );
}
