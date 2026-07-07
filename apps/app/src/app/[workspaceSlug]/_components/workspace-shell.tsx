import type { ReactNode } from "react";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ScrollFade } from "@shared/components/ui/scroll-fade";

import { WorkspaceSidebar } from "./workspace-sidebar/workspace-sidebar";

export function WorkspaceShell({
  children,
  workspaceSlug,
}: {
  children: ReactNode;
  workspaceSlug: string;
}) {
  return (
    <SidebarProvider className="h-svh min-h-svh items-stretch overflow-hidden">
      <WorkspaceSidebar workspaceSlug={workspaceSlug} />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden bg-background shadow-sm">
        <ScrollFade
          direction="y"
          topOffset="2.75rem"
          className="h-full overflow-y-auto px-5"
          fadeSize="3rem"
        >
          {children}
        </ScrollFade>
      </SidebarInset>
    </SidebarProvider>
  );
}
