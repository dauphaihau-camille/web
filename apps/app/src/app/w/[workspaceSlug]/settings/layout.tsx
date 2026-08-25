import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

import { SettingsSidebar } from './_components/settings-sidebar';

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };

  return (
    <SidebarProvider className="h-svh min-h-svh items-stretch overflow-hidden bg-surface text-surface-foreground">
      <SettingsSidebar workspaceSlug={workspaceSlug} />
      <SidebarInset className="min-h-0 min-w-0 overflow-y-auto bg-transparent p-5 max-w-2xl mx-auto mt-16">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
