'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  archiveDocument,
  createDocument,
  documentDetailQueryOptions,
  documentKeys,
  duplicateDocument,
  type DocumentNavigationNode,
} from '@shared/domains/document';
import {
  favoriteDocument,
  favoriteKeys,
  unfavoriteDocument,
} from '@/domains/favorite';
import { useDocumentTreeExpansionStore } from '@/stores/document-tree-expansion-store';
import { workspaceRoutes } from '@shared/domains/workspace';

import {
  insertCreatedSubdocIntoCachedChildren,
  markCachedNavigationNodeHasChildren,
  removeCachedNavigationDocument,
  updateCachedNavigationFavoriteStatus,
} from '../../../../../(workspace)/[documentId]/_components/document-screen/document-screen-cache';
import { resolveArchiveDestination } from './document-tree-node-action-helpers';

export function useDocumentTreeNodeActions({
  document,
  isActive,
  workspaceSlug,
}: {
  document: DocumentNavigationNode;
  isActive: boolean;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const expandedByWorkspace = useDocumentTreeExpansionStore(
    (state) => state.expandedByWorkspace,
  );
  const setExpandedDocumentIds = useDocumentTreeExpansionStore(
    (state) => state.setExpandedDocumentIds,
  );

  const createSubdocumentMutation = useMutation({
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

  const duplicateDocumentMutation = useMutation({
    mutationFn: () => duplicateDocument(document.id),
    onSuccess: async (duplicatedDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(duplicatedDocument.id),
        duplicatedDocument,
      );
      if (duplicatedDocument.parent_document_id) {
        await queryClient.invalidateQueries({
          queryKey: documentKeys.detail(duplicatedDocument.parent_document_id),
        });
      }
      await queryClient.invalidateQueries({
        queryKey: documentKeys.detail(document.id),
      });
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (document.is_favorite) {
        return unfavoriteDocument(document.id);
      }

      return favoriteDocument(document.id);
    },
    onSuccess: async (status) => {
      queryClient.setQueryData(favoriteKeys.status(document.id), status);
      updateCachedNavigationFavoriteStatus(
        queryClient,
        workspaceSlug,
        document.id,
        status.is_favorite,
      );
      await queryClient.invalidateQueries({
        queryKey: favoriteKeys.workspaceList(workspaceSlug),
      });
      toast(
        status.is_favorite ? 'Added to favorites' : 'Removed from favorites',
      );
    },
  });

  const archiveDocumentMutation = useMutation({
    mutationFn: async () => {
      const documentDetail = await queryClient.ensureQueryData(
        documentDetailQueryOptions(document.id),
      );

      return archiveDocument(document.id, documentDetail.version);
    },
    onSuccess: async (archivedDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(document.id),
        archivedDocument,
      );
      removeCachedNavigationDocument(queryClient, workspaceSlug, document.id);
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
      await queryClient.invalidateQueries({
        queryKey: favoriteKeys.workspaceList(workspaceSlug),
      });
      toast('Moved to trash');
    },
  });

  const handleCreateSubdocument = () => {
    void createSubdocumentMutation.mutateAsync();
  };

  const handleDuplicate = () => {
    void duplicateDocumentMutation.mutateAsync();
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    await navigator.clipboard.writeText(
      `${window.location.origin}${workspaceRoutes.document(
        workspaceSlug,
        document.public_id,
        document.title,
      )}`,
    );
    toast('Copied page link to clipboard');
  };

  const handleToggleFavorite = () => {
    void favoriteMutation.mutateAsync();
  };

  const handleArchive = () => {
    void (async () => {
      const documentDetail = await queryClient.ensureQueryData(
        documentDetailQueryOptions(document.id),
      );
      const nextDocument = isActive
        ? await resolveArchiveDestination({
          document: documentDetail,
          queryClient,
          workspaceSlug,
        })
        : null;

      await archiveDocumentMutation.mutateAsync();

      if (isActive) {
        router.replace(
          nextDocument
            ? workspaceRoutes.document(
              workspaceSlug,
              nextDocument.public_id,
              nextDocument.title,
            )
            : workspaceRoutes.detail(workspaceSlug),
        );
      }
    })();
  };

  return {
    archiveDocumentMutation,
    createSubdocumentMutation,
    duplicateDocumentMutation,
    favoriteMutation,
    handleArchive,
    handleCopyLink,
    handleCreateSubdocument,
    handleDuplicate,
    handleToggleFavorite,
    isFavorite: document.is_favorite,
    isMenuOpen,
    setIsMenuOpen,
  };
}
