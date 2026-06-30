import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { workspaceRoutes } from '@/domains/workspace';

import { DocumentRouteScreen } from './_components/document-route-screen';

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceId, documentId } = (await params) as { workspaceId: string; documentId: string };
  await requireCurrentUserServer(workspaceRoutes.document(workspaceId, documentId));

  return (
    <DocumentRouteScreen documentId={documentId} workspaceId={workspaceId} />
  );
}
