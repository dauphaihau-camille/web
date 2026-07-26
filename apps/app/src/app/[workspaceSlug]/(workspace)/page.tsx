import { redirect } from 'next/navigation';

import {
  createRootDocumentServer,
  getDocumentServer,
  getWorkspaceDefaultDocumentServer,
  isServerRequestError,
} from '@/domains/document/api/document.server.requests';
import { getRecentWorkspaceDocumentIdServer } from '@/domains/document/recent-document.server';
import { workspaceRoutes } from '@/domains/workspace';
import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { getDefaultWorkspaceServer } from '@/domains/workspace/api/workspace.server.requests';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };
  await requireCurrentUserServer(workspaceRoutes.detail(workspaceSlug));

  const recentDocumentId = await getRecentWorkspaceDocumentIdServer(workspaceSlug);

  const defaultDocument = await getWorkspaceDefaultDocumentServer(workspaceSlug, recentDocumentId)
    .catch(async (error: unknown) => {
      if (isServerRequestError(error, 404)) {
        const defaultWorkspace = await getDefaultWorkspaceServer();

        redirect(defaultWorkspace
          ? await getWorkspaceDocumentRoute(defaultWorkspace.slug)
          : workspaceRoutes.entry());
      }

      throw error;
    });

  redirect(await getDocumentRouteForWorkspaceDefault(workspaceSlug, defaultDocument));
}

async function getWorkspaceDocumentRoute(workspaceSlug: string) {
  const recentDocumentId = await getRecentWorkspaceDocumentIdServer(workspaceSlug);
  const defaultDocument = await getWorkspaceDefaultDocumentServer(workspaceSlug, recentDocumentId);

  return getDocumentRouteForWorkspaceDefault(workspaceSlug, defaultDocument);
}

async function getDocumentRouteForWorkspaceDefault(
  workspaceSlug: string,
  defaultDocument: { document_id?: string },
) {
  if (defaultDocument.document_id) {
    const defaultDocumentDetail = await getDocumentServer(defaultDocument.document_id);

    return workspaceRoutes.document(
      workspaceSlug,
      defaultDocumentDetail.public_id,
      defaultDocumentDetail.title,
    );
  }

  const document = await createRootDocumentServer({ workspace_id: workspaceSlug });

  return workspaceRoutes.document(workspaceSlug, document.public_id, document.title);
}
