import { redirect } from 'next/navigation';

import { requireCurrentUserServer } from '@shared/domains/auth/api/auth.server.requests';
import {
  createDocumentServer,
  getDocumentServer,
  getWorkspaceDefaultDocumentServer,
} from '@shared/domains/document/api/document.server.requests';
import { getRecentWorkspaceDocumentIdServer } from '@shared/domains/document/recent-document.server';
import { workspaceRoutes } from '@shared/domains/workspace';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };
  await requireCurrentUserServer(workspaceRoutes.detail(workspaceSlug));

  const recentDocumentId = await getRecentWorkspaceDocumentIdServer(workspaceSlug);
  const defaultDocument = await getWorkspaceDefaultDocumentServer(workspaceSlug, recentDocumentId);

  if (defaultDocument.document_id) {
    const defaultDocumentDetail = await getDocumentServer(defaultDocument.document_id);

    redirect(workspaceRoutes.document(
      workspaceSlug,
      defaultDocumentDetail.public_id,
      defaultDocumentDetail.title,
    ));
  }

  const document = await createDocumentServer({ workspace_id: workspaceSlug });

  redirect(workspaceRoutes.document(workspaceSlug, document.public_id, document.title));
}
