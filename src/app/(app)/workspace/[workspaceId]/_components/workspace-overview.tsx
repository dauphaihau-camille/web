'use client';

import { useWorkspaceQuery } from '@/domains/workspace';
import { useWorkspace } from './workspace-provider';

export function WorkspaceOverview() {
  const { workspaceId } = useWorkspace();
  const workspaceQuery = useWorkspaceQuery(workspaceId);

  if (workspaceQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading workspace...</p>;
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Workspace unavailable</h2>
        <p className="text-sm text-muted-foreground">
          The route exists, but the API did not return workspace data for this session.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{workspaceQuery.data.name}</h2>
        <p className="text-sm text-muted-foreground">
          This route is now backed by <span className="font-mono">GET /workspaces/:workspaceId</span>.
        </p>
      </div>
      <div className="rounded-2xl border bg-muted/20 p-5">
        <p className="text-sm font-medium">Phase 0 status</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The folder structure and shell stay in place. Later phases replace these placeholder
          panels with Camille v1-inspired sidebar, document tree, and editor flows.
        </p>
      </div>
    </section>
  );
}
