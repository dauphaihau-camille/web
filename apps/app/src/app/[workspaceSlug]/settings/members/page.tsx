import { requireCurrentUserServer } from '@shared/domains/auth/api/auth.server.requests';
import { getWorkspaceServer } from '@shared/domains/workspace/api/workspace.server.requests';
import { workspaceRoutes } from '@shared/domains/workspace';
import { MembersPanel } from './_components/members-panel';

export default async function WorkspaceSettingsMembersPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };
  await requireCurrentUserServer(workspaceRoutes.settingsMembers(workspaceSlug));

  const workspace = await getWorkspaceServer(workspaceSlug);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Members</h2>
        <p className="text-sm text-muted-foreground">
          Manage access and roles for the people who can work inside this space.
        </p>
      </div>
      <MembersPanel workspace={workspace} />
    </section>
  );
}
