import { notFound, redirect } from 'next/navigation';

import { authRoutes } from '@shared/domains/auth/auth-routes';
import { requireCurrentUserServer } from '@shared/domains/auth/api/auth.server.requests';
import {
  getDocumentServer,
  isServerRequestError,
} from '@shared/domains/document/api/document.server.requests';
import {
  isDocumentRouteId,
  parseDocumentRouteSegment,
  workspaceRoutes,
} from '@shared/domains/workspace';

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
    if (isServerRequestError(error, 401)) {
      redirect(authRoutes.login(workspaceRoutes.document(workspaceSlug, documentSegment)));
    }

    if (isServerRequestError(error, 403) || isServerRequestError(error, 404)) {
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
