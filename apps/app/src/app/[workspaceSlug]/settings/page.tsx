import { requireCurrentUserServer } from '@shared/domains/auth/api/auth.server.requests';
import { getWorkspaceServer } from '@shared/domains/workspace/api/workspace.server.requests';
import { workspaceRoutes } from '@shared/domains/workspace';

import { WorkspaceSettingsPanel } from './_components/workspace-settings-panel';

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };
  await requireCurrentUserServer(workspaceRoutes.settings(workspaceSlug));

  const workspace = await getWorkspaceServer(workspaceSlug);

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
