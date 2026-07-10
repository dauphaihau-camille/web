'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftIcon, Settings2Icon, UsersIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';

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
} from '@/components/ui/sidebar';
import { workspaceRoutes } from '@/domains/workspace';

import { WorkspaceUserDropdown } from '../../_components/workspace-user-dropdown';

const workspaceSettingsItems = [
  { getHref: workspaceRoutes.settings, icon: Settings2Icon, label: 'General' },
  {
    getHref: workspaceRoutes.settingsMembers,
    icon: UsersIcon,
    label: 'Members',
    disabled: true,
    unavailableMessage: 'Feature not available',
  },
];

export function SettingsSidebar({ workspaceSlug }: { workspaceSlug: string }) {
  const pathname = usePathname();
  const workspaceHref = workspaceRoutes.detail(workspaceSlug);

  return (
    <Sidebar
      collapsible="none"
      className="h-auto min-h-svh self-stretch border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="gap-3 py-3">
        <WorkspaceUserDropdown workspaceSlug={workspaceSlug} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href={workspaceHref} />}
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
                const href = item.getHref(workspaceSlug);
                const button = (
                  <SidebarMenuButton
                    render={item.disabled ? undefined : <Link href={href} />}
                    isActive={!item.disabled && pathname === href}
                    tooltip={item.label}
                    disabled={item.disabled}
                    aria-disabled={item.disabled}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                );

                return (
                  <SidebarMenuItem key={item.label}>
                    {item.disabled
                      ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={<span className="block">{button}</span>}
                          />
                          <TooltipContent>{item.unavailableMessage}</TooltipContent>
                        </Tooltip>
                      )
                      : (
                        button
                      )}
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
