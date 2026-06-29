'use client';

import { useWorkspaceQuery } from '@/domains/workspace';

import { WorkspaceMembersPanel } from '../../_components/workspace-members-panel';
import { useWorkspace } from '../../_components/workspace-provider';

export default function WorkspaceSettingsMembersPage() {
  const { workspaceId } = useWorkspace();
  const workspaceQuery = useWorkspaceQuery(workspaceId);

  if (workspaceQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading members...</p>;
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Workspace unavailable</h2>
        <p className="text-sm text-muted-foreground">
          The workspace members page could not load workspace details for this session.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Members</h2>
        <p className="text-sm text-muted-foreground">
          Manage access and roles for the people who can work inside this space.
        </p>
      </div>
      <WorkspaceMembersPanel workspace={workspaceQuery.data} />
    </section>
  );
}
