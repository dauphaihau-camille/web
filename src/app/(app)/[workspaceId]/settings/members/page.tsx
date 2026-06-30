import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { getWorkspaceServer } from '@/domains/workspace/api/workspace.server.requests';
import { workspaceRoutes } from '@/domains/workspace';
import { WorkspaceMembersPanel } from '../../_components/workspace-members-panel';

export default async function WorkspaceSettingsMembersPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceId } = (await params) as { workspaceId: string };
  await requireCurrentUserServer(workspaceRoutes.settingsMembers(workspaceId));

  const workspace = await getWorkspaceServer(workspaceId);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Members</h2>
        <p className="text-sm text-muted-foreground">
          Manage access and roles for the people who can work inside this space.
        </p>
      </div>
      <WorkspaceMembersPanel workspace={workspace} />
    </section>
  );
}
