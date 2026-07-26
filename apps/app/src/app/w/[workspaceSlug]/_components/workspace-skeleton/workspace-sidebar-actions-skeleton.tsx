'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@shared/components/ui/skeleton';

export function WorkspaceSidebarActionsSkeleton() {
  return (
    <SidebarGroup className="pt-0">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem className="font-semibold">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <Skeleton className="h-4 w-32" />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem className="font-semibold">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <Skeleton className="h-4 w-32" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
