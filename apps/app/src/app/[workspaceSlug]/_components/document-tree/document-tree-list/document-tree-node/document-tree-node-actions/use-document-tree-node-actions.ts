'use client';

import type {
  DocumentNavigationNode,
} from '@/domains/document';
import { workspaceRoutes } from '@/domains/workspace';
import {
  type DocumentTreeScope,
  useDocumentTreeExpansionStore,
} from '@/stores/document-tree-expansion-store';
import type { FavoriteDocument } from '@/domains/favorite';
import { useDocumentActions } from '@/domains/document/hooks/use-document-actions';

import { resolveArchiveDestination } from './document-tree-node-action-helpers';
import { useCreateSubdocumentAction } from './use-create-subdocument-action';

type UseDocumentTreeNodeActionArgs = {
  document: DocumentNavigationNode;
  shouldNavigateOnArchive: boolean;
  workspaceSlug: string;
  treeScope: DocumentTreeScope;
};

function createOptimisticFavoriteDocument(
  document: DocumentNavigationNode,
  workspaceSlug: string,
): FavoriteDocument {
  return {
    document_id: document.id,
    public_id: document.public_id,
    workspace_id: workspaceSlug,
    teamspace_id: document.teamspace_id,
    parent_document_id: document.parent_document_id,
    title: document.title,
    sort_key: document.sort_key,
    has_children: document.has_children,
    has_content: document.has_content,
    favorited_at: new Date().toISOString(),
    access: {
      permission: 'manage',
      can_view: true,
      can_edit: true,
      can_manage: true,
    },
  };
}

export function useDocumentTreeNodeActions({
  document,
  shouldNavigateOnArchive,
  workspaceSlug,
  treeScope,
}: UseDocumentTreeNodeActionArgs) {
  const expandedByWorkspace = useDocumentTreeExpansionStore(
    (state) => state.expandedByWorkspace,
  );

  const setExpandedDocumentIds = useDocumentTreeExpansionStore(
    (state) => state.setExpandedDocumentIds,
  );

  const {
    createSubdocumentMutation,
    handleCreateSubdocument,
  } = useCreateSubdocumentAction({
    document,
    workspaceSlug,
    treeScope,
  });

  const {
    archiveDocumentMutation,
    duplicateDocumentMutation,
    favoriteMutation,
    handleArchive,
    handleCopyLink,
    handleDuplicate,
    handleToggleFavorite,
    isFavorite,
  } = useDocumentActions({
    document,
    workspaceSlug,
    shouldNavigateOnArchive,
    buildDocumentHref: (targetDocument) =>
      workspaceRoutes.document(
        workspaceSlug,
        targetDocument.public_id,
        targetDocument.title,
      ),
    createOptimisticFavoriteDocument: () => createOptimisticFavoriteDocument(document, workspaceSlug),
    getCopyLinkUrl: () =>
      typeof window === 'undefined'
        ? undefined
        : `${window.location.origin}${workspaceRoutes.document(
          workspaceSlug,
          document.public_id,
          document.title,
        )}`,
    onArchiveOptimistic: () => {
      const previousExpandedDocumentIds =
        expandedByWorkspace[workspaceSlug]?.[treeScope] ?? [];

      setExpandedDocumentIds(
        workspaceSlug,
        treeScope,
        previousExpandedDocumentIds.filter((documentId) => documentId !== document.id),
      );

      return previousExpandedDocumentIds;
    },
    onArchiveRollback: (previousExpandedDocumentIds) => {
      if (!previousExpandedDocumentIds) {
        return;
      }

      setExpandedDocumentIds(workspaceSlug, treeScope, previousExpandedDocumentIds);
    },
    resolveArchiveDestination,
  });

  return {
    archiveDocumentMutation,
    createSubdocumentMutation,
    duplicateDocumentMutation,
    favoriteMutation,
    handleArchive,
    handleCopyLink,
    handleCreateSubdocument,
    handleDuplicate: () => {
      handleDuplicate();
    },
    handleToggleFavorite,
    isFavorite,
  };
}
