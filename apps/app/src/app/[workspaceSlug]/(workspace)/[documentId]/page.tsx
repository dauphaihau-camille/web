import { notFound } from 'next/navigation';

import {
  isDocumentRouteId,
  parseDocumentRouteSegment,
  workspaceRoutes,
} from '@/domains/workspace';
import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';

import { DocumentRouteScreen } from './_components/document-route-screen';

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceSlug, documentId: documentSegment } = (await params) as { workspaceSlug: string; documentId: string };
  const documentId = parseDocumentRouteSegment(documentSegment);

  if (!isDocumentRouteId(documentId)) {
    notFound();
  }

  await requireCurrentUserServer(workspaceRoutes.document(workspaceSlug, documentSegment));

  return (
    <DocumentRouteScreen
      documentId={documentId}
      workspaceSlug={workspaceSlug}
    />
  );
}
