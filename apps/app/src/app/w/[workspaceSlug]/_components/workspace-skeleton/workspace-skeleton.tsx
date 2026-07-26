import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { ScrollFade } from '@/components/ui/scroll-fade';

import { DocumentScreenSkeleton } from './document-screen-skeleton';
import { WorkspaceSidebarSkeleton } from './workspace-sidebar-skeleton';

export function WorkspaceSkeleton() {
  return (
    <SidebarProvider className="h-svh min-h-svh items-stretch overflow-hidden">
      <WorkspaceSidebarSkeleton />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden bg-background shadow-sm">
        <ScrollFade
          direction="y"
          topOffset="2.75rem"
          className="h-full overflow-y-auto px-5"
          fadeSize="3rem"
        >
          <DocumentScreenSkeleton animate />
        </ScrollFade>
      </SidebarInset>
    </SidebarProvider>
  );
}
