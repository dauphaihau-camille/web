import type { ReactNode } from 'react';

import { WorkspaceSidebar } from './workspace-sidebar';

export function WorkspaceShell({
  children,
  workspaceId,
}: {
  children: ReactNode;
  workspaceId: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <WorkspaceSidebar workspaceId={workspaceId} />
      <section className="min-w-0 rounded-xl border bg-background p-5">
        {children}
      </section>
    </div>
  );
}
