'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { WorkspaceUserDropdown } from '../workspace-user-dropdown';
import { PrivateDocumentsGroup } from './private-documents-group';
import { FavoritesDocumentsGroup } from './favorites-documents-group';
import { WorkspaceSearchButton } from './workspace-search-button';
import { WorkspaceTrashButton } from './workspace-trash-button/workspace-trash-button';

export function WorkspaceSidebar({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <Sidebar
      collapsible="none"
      className="h-auto min-h-svh self-stretch border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="gap-3 p-1">
        <WorkspaceUserDropdown workspaceSlug={workspaceSlug} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className='pt-0'>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="font-semibold">
                <WorkspaceSearchButton workspaceSlug={workspaceSlug} />
              </SidebarMenuItem>
              <SidebarMenuItem className="font-semibold">
                <WorkspaceTrashButton workspaceSlug={workspaceSlug} />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <FavoritesDocumentsGroup workspaceId={workspaceSlug} />
        <PrivateDocumentsGroup workspaceSlug={workspaceSlug} />
      </SidebarContent>
    </Sidebar>
  );
}
