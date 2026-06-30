import type { ReactNode } from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { WorkspaceSidebar } from './workspace-sidebar/workspace-sidebar';

export function WorkspaceShell({
  children,
  workspaceId,
}: {
  children: ReactNode;
  workspaceId: string;
}) {
  return (
    <SidebarProvider className="h-svh min-h-svh items-stretch overflow-hidden">
      <WorkspaceSidebar workspaceId={workspaceId} />
      <SidebarInset className="min-h-0 min-w-0 overflow-y-auto bg-background px-5 shadow-sm">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
