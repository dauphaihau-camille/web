import type { ReactNode } from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { SettingsSidebar } from './settings-sidebar';

export function SettingsShell({
  children,
  workspaceId,
}: {
  children: ReactNode;
  workspaceId: string;
}) {
  return (
    <SidebarProvider className="h-svh min-h-svh items-stretch overflow-hidden">
      <SettingsSidebar workspaceId={workspaceId} />
      <SidebarInset className="min-h-0 min-w-0 overflow-y-auto bg-background p-5 max-w-xl mx-auto">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
