import { redirect } from 'next/navigation';

import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import {
  createDocumentServer,
  getWorkspaceDefaultDocumentServer,
} from '@/domains/document/api/document.server.requests';
import { getRecentWorkspaceDocumentIdServer } from '@/domains/document/recent-document.server';
import { workspaceRoutes } from '@/domains/workspace';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceId } = (await params) as { workspaceId: string };
  await requireCurrentUserServer(workspaceRoutes.detail(workspaceId));

  const recentDocumentId = await getRecentWorkspaceDocumentIdServer(workspaceId);
  const defaultDocument = await getWorkspaceDefaultDocumentServer(workspaceId, recentDocumentId);

  if (defaultDocument.document_id) {
    redirect(workspaceRoutes.document(workspaceId, defaultDocument.document_id));
  }

  const document = await createDocumentServer({ workspace_id: workspaceId });

  redirect(workspaceRoutes.document(workspaceId, document.id));
}
