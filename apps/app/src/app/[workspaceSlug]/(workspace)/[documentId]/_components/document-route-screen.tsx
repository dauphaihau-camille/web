'use client';

import { type Document, useDocumentQuery } from '@shared/domains/document';

import { DocumentScreen } from './document-screen/document-screen';

export function DocumentRouteScreen({
  initialDocument,
  workspaceSlug,
}: {
  documentId: string;
  initialDocument: Document;
  workspaceSlug: string;
}) {
  const canonicalDocumentId = initialDocument.id;
  const documentQuery = useDocumentQuery(canonicalDocumentId, {
    initialData: initialDocument,
    initialDataUpdatedAt: 0,
    refetchOnMount: 'always',
  });
  const document = documentQuery.data ?? initialDocument;

  return (
    <DocumentScreen
      document={document}
      workspaceSlug={workspaceSlug}
    />
  );
}
