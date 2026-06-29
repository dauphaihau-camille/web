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

  const workspace = workspaceQuery.data;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{workspace.name}</h2>
        <p className="text-sm text-muted-foreground">
          This workspace route is now backed by the v2 API for detail, updates, and membership
          management.
        </p>
      </div>
    </section>
  );
}
