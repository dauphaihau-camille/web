'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar';

import { WorkspaceSidebarActionsSkeleton } from './workspace-sidebar-actions-skeleton';
import { WorkspaceSidebarTreeSkeleton } from './workspace-sidebar-tree-skeleton';
import { WorkspaceUserDropdownSkeleton } from './workspace-user-dropdown-skeleton';

export function WorkspaceSidebarSkeleton() {
  return (
    <Sidebar
      collapsible="none"
      className="h-auto min-h-svh self-stretch border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="gap-3 p-1">
        <WorkspaceUserDropdownSkeleton />
      </SidebarHeader>

      <SidebarContent>
        <WorkspaceSidebarActionsSkeleton />
        <WorkspaceSidebarTreeSkeleton animate />
      </SidebarContent>
    </Sidebar>
  );
}
