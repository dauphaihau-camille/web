'use client';

import { useWorkspaceDocumentRootQuery } from '@shared/domains/document';

import {
  DocumentTreeLoading,
} from './document-tree-loading';
import { DocumentTreeList } from './document-tree-list';
import { useSyncDocumentTreeExpansion } from './use-sync-document-tree-expansion';

export function DocumentTree({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const rootQuery = useWorkspaceDocumentRootQuery(workspaceSlug);
  const treeExpansion = useSyncDocumentTreeExpansion(workspaceSlug);

  if (rootQuery.isLoading || treeExpansion.isLoading) {
    return <DocumentTreeLoading />;
  }

  if (rootQuery.isError || !rootQuery.data) {
    return <p className="px-2 py-1 text-xs text-muted-foreground">Documents unavailable.</p>;
  }

  return (
    <DocumentTreeList
      workspaceSlug={workspaceSlug}
      items={rootQuery.data.private_documents.items}
      emptyMessage="No private documents yet."
      nextCursor={rootQuery.data.private_documents.next_cursor}
    />
  );
}
