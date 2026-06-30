'use client';

import { DocumentScreen } from '@/components/editor/document-screen/document-screen';
import { useDocumentQuery } from '@/domains/document';
import { useWorkspaceQuery } from '@/domains/workspace';

import { DocumentScreenSkeleton } from './document-screen-skeleton';

export function DocumentRouteScreen({
  documentId,
  workspaceId,
}: {
  documentId: string;
  workspaceId: string;
}) {
  const documentQuery = useDocumentQuery(documentId);
  const workspaceQuery = useWorkspaceQuery(workspaceId);

  if ((!documentQuery.data && documentQuery.isPending) || (!workspaceQuery.data && workspaceQuery.isPending)) {
    return <DocumentScreenSkeleton />;
  }

  if (!documentQuery.data || !workspaceQuery.data || documentQuery.isError || workspaceQuery.isError) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Document unavailable</h2>
        <p className="text-sm text-muted-foreground">
          The document could not be loaded from the API for this session.
        </p>
      </section>
    );
  }

  return (
    <DocumentScreen
      document={documentQuery.data}
      documentId={documentId}
      workspace={workspaceQuery.data}
      workspaceId={workspaceId}
    />
  );
}
