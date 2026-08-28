import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { ScrollFade } from '@/components/ui/scroll-fade';

import { WorkspaceSidebar } from '../_components/workspace-sidebar/workspace-sidebar';
import { WorkspaceAiChatShell } from '../_components/workspace-ai-chat-shell';

export default async function WorkspaceRoutesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };

  return (
    <SidebarProvider className="h-svh min-h-svh items-stretch overflow-hidden bg-surface text-surface-foreground">
      <WorkspaceSidebar workspaceSlug={workspaceSlug} />

      <WorkspaceAiChatShell workspaceSlug={workspaceSlug}>
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden bg-transparent shadow-sm">
          <ScrollFade
            direction="y"
            fadeColor="var(--surface)"
            topOffset="2.75rem"
            className="app-scrollbar h-full overflow-y-auto px-5"
            fadeSize="3rem"
          >
            {children}
          </ScrollFade>
        </SidebarInset>
      </WorkspaceAiChatShell>
    </SidebarProvider>
  );
}
