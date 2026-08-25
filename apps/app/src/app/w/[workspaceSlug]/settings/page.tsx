import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { workspaceRoutes } from '@/domains/workspace';
import { getWorkspaceServer } from '@/domains/workspace/api/workspace.server.requests';

import { SettingsPage } from './_components/settings-page';
import { DangerZone } from './_components/danger-zone/danger-zone';
import { WorkspaceSettings } from './_components/workspace-settings/workspace-settings';

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };
  await requireCurrentUserServer(workspaceRoutes.settings(workspaceSlug));

  const workspace = await getWorkspaceServer(workspaceSlug);

  return (
    <SettingsPage
      title="General"
      description="Manage your workspace name, domains, and more"
    >
      <WorkspaceSettings workspace={workspace} />
      <DangerZone workspace={workspace} />
    </SettingsPage>
  );
}
