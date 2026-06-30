'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';

export function DocumentTreeLoading() {
  return (
    <div>
      <SidebarMenu className="space-y-0.5">
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}

export function TeamspaceDocumentTreeLoading() {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 px-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        </SidebarMenu>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 px-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </div>
  );
}
