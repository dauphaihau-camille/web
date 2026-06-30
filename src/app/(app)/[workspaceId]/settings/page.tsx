import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { getWorkspaceServer } from '@/domains/workspace/api/workspace.server.requests';
import { workspaceRoutes } from '@/domains/workspace';

import { WorkspaceSettingsPanel } from '../_components/workspace-settings-panel';

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceId } = (await params) as { workspaceId: string };
  await requireCurrentUserServer(workspaceRoutes.settings(workspaceId));

  const workspace = await getWorkspaceServer(workspaceId);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Workspace settings</h2>
        <p className="text-sm text-muted-foreground">
          Update the workspace name, slug, and description for this space.
        </p>
      </div>
      <WorkspaceSettingsPanel workspace={workspace} />
    </section>
  );
}
