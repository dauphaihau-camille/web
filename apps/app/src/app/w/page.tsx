import { redirect } from 'next/navigation';

import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { workspaceRoutes } from '@/domains/workspace';
import { getDefaultWorkspaceServer } from '@/domains/workspace/api/workspace.server.requests';
import { getWorkspaceDocumentRoute } from './[workspaceSlug]/(workspace)/workspace-default-route';

export default async function WorkspaceNamespaceEntryPage() {
  await requireCurrentUserServer('/w');

  const defaultWorkspace = await getDefaultWorkspaceServer();

  if (defaultWorkspace) {
    redirect(await getWorkspaceDocumentRoute(defaultWorkspace.slug));
  }

  redirect(workspaceRoutes.entry());
}
