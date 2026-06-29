'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FilePlus2Icon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useWorkspaceQuery } from '@/domains/workspace';

import { PageTree } from './page-tree';
import { WorkspaceUserDropdown } from './workspace-user-dropdown';

const favoritePages = [
  { icon: StarIcon, label: 'Pinned notes' },
  { icon: StarIcon, label: 'Weekly review' },
];

const quickActions = [
  { icon: SearchIcon, label: 'Search' },
  { icon: FilePlus2Icon, label: 'New page' },
  { icon: Trash2Icon, label: 'Trash' },
];

export function WorkspaceSidebar({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const workspaceQuery = useWorkspaceQuery(workspaceId);
  const workspace = workspaceQuery.data;

  return (
    <Sidebar
      collapsible="none"
      className="h-auto min-h-svh self-stretch border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="gap-3 p-3">
        <WorkspaceUserDropdown workspaceId={workspaceId} />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.label}>
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
        <SidebarGroup>
          <SidebarGroupLabel>Favorites</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {favoritePages.map((item) => (
                <SidebarMenuItem key={item.label}>
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
        <SidebarGroup>
          <SidebarGroupLabel>Teamspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href={`/${workspaceId}`} />}
                  isActive={pathname === `/${workspaceId}`}
                  tooltip="Workspace"
                >
                  <UsersIcon />
                  <span>{workspace?.name ?? 'Workspace'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Private pages</SidebarGroupLabel>
          <SidebarGroupContent>
            <PageTree workspaceId={workspaceId} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
