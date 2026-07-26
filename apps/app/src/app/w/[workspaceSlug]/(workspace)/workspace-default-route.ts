import {
  createRootDocumentServer,
  getDocumentServer,
  getWorkspaceDefaultDocumentServer,
} from '@/domains/document/api/document.server.requests';
import { getRecentWorkspaceDocumentIdServer } from '@/domains/document/recent-document.server';
import { workspaceRoutes } from '@/domains/workspace';

export async function getWorkspaceDocumentRoute(workspaceSlug: string) {
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
