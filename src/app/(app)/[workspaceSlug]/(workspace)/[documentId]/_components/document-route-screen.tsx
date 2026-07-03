'use client';

import { type Document, useDocumentQuery } from '@/domains/document';

import { DocumentScreen } from './document-screen/document-screen';

export function DocumentRouteScreen({
  documentId,
  initialDocument,
  workspaceSlug,
}: {
  documentId: string;
  initialDocument: Document;
  workspaceSlug: string;
}) {
  const documentQuery = useDocumentQuery(documentId, initialDocument);
  const document = documentQuery.data ?? initialDocument;

  return (
    <DocumentScreen
      document={document}
      workspaceSlug={workspaceSlug}
    />
  );
}
