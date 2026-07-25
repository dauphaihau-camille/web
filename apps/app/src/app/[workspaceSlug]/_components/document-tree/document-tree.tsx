'use client';

import { useWorkspaceDocumentRootQuery } from '@/domains/document';

import { DocumentTreeSkeleton } from '../workspace-skeleton/document-tree-skeleton';
import { DocumentTreeList } from './document-tree-list/document-tree-list';

export function DocumentTree({
  workspaceSlug,
  rootQuery: rootQueryProp,
}: {
  workspaceSlug: string;
  rootQuery?: ReturnType<typeof useWorkspaceDocumentRootQuery>;
}) {
  const fallbackRootQuery = useWorkspaceDocumentRootQuery(workspaceSlug, {
    enabled: !rootQueryProp,
  });
  const rootQuery = rootQueryProp ?? fallbackRootQuery;

  if (rootQuery.isLoading) {
    return <DocumentTreeSkeleton animate />;
  }

  if (rootQuery.isError || !rootQuery.data) {
    return <p className="px-2 py-1 text-xs text-muted-foreground">Documents unavailable.</p>;
  }

  return (
    <DocumentTreeList
      workspaceSlug={workspaceSlug}
      treeScope="private"
      items={rootQuery.data.private_documents.items.filter((document) =>
        (document.access_scope ?? 'private') === 'private'
        || document.is_owned_by_current_user === true)}
      emptyMessage="No private documents yet."
      nextCursor={rootQuery.data.private_documents.next_cursor}
    />
  );
}
