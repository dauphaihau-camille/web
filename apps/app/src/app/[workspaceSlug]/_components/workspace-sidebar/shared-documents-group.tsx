'use client';

import type { useWorkspaceDocumentRootQuery } from '@/domains/document';

import { DocumentTreeList } from '../document-tree/document-tree-list/document-tree-list';
import { DocumentTreeSkeleton } from '../workspace-skeleton/document-tree-skeleton';
import { CollapsibleSidebarGroup } from './collapsible-sidebar-group';

export function SharedDocumentsGroup({
  workspaceSlug,
  rootQuery,
}: {
  workspaceSlug: string;
  rootQuery?: ReturnType<typeof useWorkspaceDocumentRootQuery>;
}) {
  if (!rootQuery || rootQuery.isLoading) {
    return (
      <CollapsibleSidebarGroup label="Shared">
        <DocumentTreeSkeleton animate />
      </CollapsibleSidebarGroup>
    );
  }

  if (rootQuery.isError || !rootQuery.data) {
    return (
      <CollapsibleSidebarGroup label="Shared">
        <p className="px-2 py-1 text-xs text-muted-foreground">Shared documents unavailable.</p>
      </CollapsibleSidebarGroup>
    );
  }

  if (rootQuery.data.shared_documents.items.length === 0) {
    return null;
  }

  return (
    <CollapsibleSidebarGroup label="Shared">
      <DocumentTreeList
        workspaceSlug={workspaceSlug}
        treeScope="shared"
        items={rootQuery.data.shared_documents.items}
        emptyMessage="No shared documents yet."
        getActionMode={(document) =>
          document.is_owned_by_current_user ? 'full' : 'readOnly'}
      />
    </CollapsibleSidebarGroup>
  );
}
