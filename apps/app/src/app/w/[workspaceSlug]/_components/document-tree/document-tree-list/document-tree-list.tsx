'use client';

import { usePathname } from 'next/navigation';

import {
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { DocumentNavigationNode } from '@/domains/document';
import type { DocumentTreeScope } from '@/stores/document-tree-expansion-store';

import { DocumentTreeSkeleton } from '../../workspace-skeleton/document-tree-skeleton';
import { DocumentTreeMoreButton } from './document-tree-more-button/document-tree-more-button';
import {
  DocumentTreeNode,
  type DocumentTreeNodeActionMode,
} from './document-tree-node/document-tree-node';
import { useSyncDocumentTreeExpansion } from '../use-sync-document-tree-expansion';

export function DocumentTreeList({
  workspaceSlug,
  treeScope,
  items,
  emptyMessage,
  nextCursor,
  actionMode = 'full',
  getActionMode,
}: {
  workspaceSlug: string;
  treeScope: DocumentTreeScope;
  items: DocumentNavigationNode[];
  emptyMessage: string;
  nextCursor?: string;
  actionMode?: DocumentTreeNodeActionMode;
  getActionMode?: (document: DocumentNavigationNode) => DocumentTreeNodeActionMode;
}) {
  const pathname = usePathname();
  const treeExpansion = useSyncDocumentTreeExpansion(workspaceSlug, treeScope);

  if (treeExpansion.isLoading) {
    return <DocumentTreeSkeleton animate />;
  }

  return (
    <div>
      <SidebarMenu className="space-y-0.5">
        {items.length === 0
          ? (
            <SidebarMenuItem>
              <p className="px-2 py-1 text-xs text-muted-foreground">
                {emptyMessage}
              </p>
            </SidebarMenuItem>
          )
          : (
            items.map((document) => (
              <DocumentTreeNode
                key={document.id}
                document={document}
                workspaceSlug={workspaceSlug}
                treeScope={treeScope}
                pathname={pathname}
                actionMode={getActionMode?.(document) ?? actionMode}
              />
            ))
          )}

        {nextCursor
          ? (
            <DocumentTreeMoreButton
              workspaceSlug={workspaceSlug}
              initialCursor={nextCursor}
            />
          )
          : null}
      </SidebarMenu>
    </div>
  );
}
