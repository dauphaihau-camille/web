'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftIcon, Settings2Icon, UsersIcon } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

import { WorkspaceUserDropdown } from '../../_components/workspace-user-dropdown';

const workspaceSettingsItems = [
  { href: '', icon: Settings2Icon, label: 'General' },
  { href: '/members', icon: UsersIcon, label: 'Members' },
];

export function SettingsSidebar({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const settingsBaseHref = `/${workspaceId}/settings`;

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
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href={`/${workspaceId}`} />}
                  tooltip="Back to workspace"
                >
                  <ArrowLeftIcon />
                  <span>Back to workspace</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceSettingsItems.map((item) => {
                const href = `${settingsBaseHref}${item.href}`;

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={pathname === href}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
