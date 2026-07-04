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
  const documentQuery = useDocumentQuery(documentId, {
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
