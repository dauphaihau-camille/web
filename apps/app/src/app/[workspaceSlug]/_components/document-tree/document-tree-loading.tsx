"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";

export function DocumentTreeLoading() {
  return (
    <div>
      <SidebarMenu className="space-y-0.5">
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon textWidth="72%" />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon textWidth="55%" />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon textWidth="83%" />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon textWidth="64%" />
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
