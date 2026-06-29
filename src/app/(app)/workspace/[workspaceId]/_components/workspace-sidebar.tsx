'use client';

import { useWorkspaceQuery } from '@/domains/workspace';

import { PageTree } from './page-tree';

export function WorkspaceSidebar({ workspaceId }: { workspaceId: string }) {
  const workspaceQuery = useWorkspaceQuery(workspaceId);

  return (
    <aside className="rounded-xl border bg-background p-4 shadow-sm">
      <h3 className="font-semibold">Workspace</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {workspaceQuery.data?.name ?? 'Loading workspace...'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground/80">{workspaceId}</p>
      <PageTree workspaceId={workspaceId} />
    </aside>
  );
}
