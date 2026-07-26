'use client';

import { Skeleton } from '@shared/components/ui/skeleton';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { DocumentTreeSkeleton } from './document-tree-skeleton';

export function WorkspaceSidebarTreeSkeleton({
  animate = false,
}: {
  animate?: boolean;
}) {
  return (
    <SidebarGroup className="space-y-0.5 py-0.5">
      <div className="flex items-center gap-2 rounded-md pl-2 pr-1 text-sidebar-foreground/70">
        <SidebarGroupLabel className="h-7 flex-1 justify-start px-0 font-semibold text-inherit">
          <Skeleton className="h-4 w-20 rounded-sm" />
        </SidebarGroupLabel>
        <Skeleton className="size-5 rounded-sm" />
      </div>
      <SidebarGroupContent className="pb-2">
        <DocumentTreeSkeleton animate={animate} />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
