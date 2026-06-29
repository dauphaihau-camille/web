import type { ReactNode } from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { WorkspaceSidebar } from './workspace-sidebar';

export function WorkspaceShell({
  children,
  workspaceId,
}: {
  children: ReactNode;
  workspaceId: string;
}) {
  return (
    <SidebarProvider className="h-svh min-h-svh items-stretch">
      <WorkspaceSidebar workspaceId={workspaceId} />
      <SidebarInset className="min-h-svh min-w-0 bg-background p-5 shadow-sm">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
