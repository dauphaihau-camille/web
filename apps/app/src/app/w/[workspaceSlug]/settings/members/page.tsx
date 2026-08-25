import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { workspaceRoutes } from '@/domains/workspace';
import { getWorkspaceServer } from '@/domains/workspace/api/workspace.server.requests';
import { SettingsPage } from '../_components/settings-page';
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
    <SettingsPage
      title="Members"
      description="Manage access and roles for the people who can work inside this space."
    >
      <MembersPanel workspace={workspace} />
    </SettingsPage>
  );
}
