import { notFound } from 'next/navigation';

import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { getDocumentServer } from '@/domains/document/api/document.server.requests';
import {
  isDocumentRouteId,
  parseDocumentRouteSegment,
  workspaceRoutes,
} from '@/domains/workspace';

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

  let document;

  try {
    document = await getDocumentServer(documentId);
  }
  catch (error) {
    if (error instanceof Error && error.message.includes('Status: 404.')) {
      notFound();
    }

    throw error;
  }

  return (
    <DocumentRouteScreen
      documentId={documentId}
      initialDocument={document}
      workspaceSlug={workspaceSlug}
    />
  );
}
