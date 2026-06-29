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
    <SidebarProvider className="h-svh min-h-svh items-stretch">
      <SettingsSidebar workspaceId={workspaceId} />
      <SidebarInset className="min-h-svh min-w-0 bg-background p-5 max-w-xl mx-auto">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
