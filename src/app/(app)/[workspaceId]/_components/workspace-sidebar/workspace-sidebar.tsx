'use client';

import { SearchIcon, StarIcon } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { CollapsibleSidebarGroup } from './collapsible-sidebar-group';
import { WorkspaceUserDropdown } from '../workspace-user-dropdown';
import { PrivateDocumentsGroup } from './private-documents-group';

const favoritePages = [
  { icon: StarIcon, label: 'Pinned notes' },
  { icon: StarIcon, label: 'Weekly review' },
];

const quickActions = [
  { icon: SearchIcon, label: 'Search' },
];

export function WorkspaceSidebar({ workspaceId }: { workspaceId: string }) {
  return (
    <Sidebar
      collapsible="none"
      className="h-auto min-h-svh self-stretch border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="gap-3 p-3">
        <WorkspaceUserDropdown workspaceId={workspaceId} />
      </SidebarHeader>

      <SidebarContent className='px-2'>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.label} className="font-semibold">
                  <SidebarMenuButton
                    disabled
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>Soon</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <CollapsibleSidebarGroup label="Favorites">
          <SidebarMenu>
            {favoritePages.map((item) => (
              <SidebarMenuItem key={item.label} className="font-semibold">
                <SidebarMenuButton
                  disabled
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>Soon</SidebarMenuBadge>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </CollapsibleSidebarGroup>

        <PrivateDocumentsGroup workspaceId={workspaceId} />
      </SidebarContent>
    </Sidebar>
  );
}
