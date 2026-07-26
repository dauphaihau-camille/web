import { redirect } from 'next/navigation';

import {
  isServerRequestError,
} from '@/domains/document/api/document.server.requests';
import { workspaceRoutes } from '@/domains/workspace';
import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { getDefaultWorkspaceServer } from '@/domains/workspace/api/workspace.server.requests';
import { getWorkspaceDocumentRoute } from './workspace-default-route';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };
  await requireCurrentUserServer(workspaceRoutes.detail(workspaceSlug));

  const documentRoute = await getWorkspaceDocumentRoute(workspaceSlug)
    .catch(async (error: unknown) => {
      if (isServerRequestError(error, 404)) {
        const defaultWorkspace = await getDefaultWorkspaceServer();

        redirect(defaultWorkspace
          ? await getWorkspaceDocumentRoute(defaultWorkspace.slug)
          : workspaceRoutes.entry());
      }

      throw error;
    });

  redirect(documentRoute);
}
