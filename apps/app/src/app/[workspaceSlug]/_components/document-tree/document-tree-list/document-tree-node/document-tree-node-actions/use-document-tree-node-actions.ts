'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createDocument,
  documentKeys,
  type DocumentNavigationNode,
} from '@/domains/document';
import { workspaceRoutes } from '@/domains/workspace';
import { useDocumentTreeExpansionStore } from '@/stores/document-tree-expansion-store';
import {
  insertCreatedSubdocIntoCachedChildren,
  markCachedNavigationNodeHasChildren,
} from '@/domains/document/cache/document-query-cache';
import type { FavoriteDocument } from '@/domains/favorite';
import { markCachedFavoriteDocumentHasChildren } from '@/domains/document/actions/document-action-cache';
import { useDocumentActions } from '@/domains/document/hooks/use-document-actions';

import { resolveArchiveDestination } from './document-tree-node-action-helpers';

type UseDocumentTreeNodeActionArgs = {
  document: DocumentNavigationNode;
  isActive: boolean;
  workspaceSlug: string;
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
  };
}

function useCreateSubdocumentAction({
  document,
  workspaceSlug,
}: Omit<UseDocumentTreeNodeActionArgs, 'isActive'>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const expandedByWorkspace = useDocumentTreeExpansionStore(
    (state) => state.expandedByWorkspace,
  );
  const setExpandedDocumentIds = useDocumentTreeExpansionStore(
    (state) => state.setExpandedDocumentIds,
  );

  const mutation = useMutation({
    mutationFn: () =>
      createDocument({
        workspace_id: workspaceSlug,
        teamspace_id: document.teamspace_id,
        parent_document_id: document.id,
      }),
    onSuccess: async (childDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(childDocument.id),
        childDocument,
      );
      markCachedNavigationNodeHasChildren(
        queryClient,
        workspaceSlug,
        document.id,
      );
      markCachedFavoriteDocumentHasChildren(
        queryClient,
        workspaceSlug,
        document.id,
      );
      insertCreatedSubdocIntoCachedChildren(
        queryClient,
        workspaceSlug,
        document.id,
        childDocument,
      );
      setExpandedDocumentIds(workspaceSlug, [
        ...(expandedByWorkspace[workspaceSlug] ?? []),
        document.id,
      ]);
      await queryClient.invalidateQueries({
        queryKey: documentKeys.detail(document.id),
      });
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
      router.push(
        workspaceRoutes.document(
          workspaceSlug,
          childDocument.public_id,
          childDocument.title,
        ),
      );
    },
  });

  return {
    createSubdocumentMutation: mutation,
    handleCreateSubdocument: () => {
      void mutation.mutateAsync();
    },
  };
}

export function useDocumentTreeNodeActions({
  document,
  isActive,
  workspaceSlug,
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
    isActive,
    buildDocumentHref: (targetDocument) =>
      workspaceRoutes.document(
        workspaceSlug,
        targetDocument.public_id,
        targetDocument.title,
      ),
    createOptimisticFavoriteDocument: () =>
      createOptimisticFavoriteDocument(document, workspaceSlug),
    getCopyLinkUrl: () =>
      typeof window === 'undefined'
        ? undefined
        : `${window.location.origin}${workspaceRoutes.document(
          workspaceSlug,
          document.public_id,
          document.title,
        )}`,
    onArchiveOptimistic: () => {
      const previousExpandedDocumentIds = expandedByWorkspace[workspaceSlug] ?? [];

      setExpandedDocumentIds(
        workspaceSlug,
        previousExpandedDocumentIds.filter((documentId) => documentId !== document.id),
      );

      return previousExpandedDocumentIds;
    },
    onArchiveRollback: (previousExpandedDocumentIds) => {
      if (!previousExpandedDocumentIds) {
        return;
      }

      setExpandedDocumentIds(workspaceSlug, previousExpandedDocumentIds);
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
