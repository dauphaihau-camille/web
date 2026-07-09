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
  type Document,
  type DocumentNavigationPage,
  type DocumentNavigationNode,
  type WorkspaceDocumentNavigation,
} from '@shared/domains/document';
import {
  favoriteDocument,
  favoriteKeys,
  type FavoriteDocument,
  unfavoriteDocument,
} from '@/domains/favorite';
import { useDocumentTreeExpansionStore } from '@/stores/document-tree-expansion-store';
import { workspaceRoutes } from '@shared/domains/workspace';
import {
  insertCreatedSubdocIntoCachedChildren,
  markCachedNavigationNodeHasChildren,
  removeCachedNavigationDocument,
  updateCachedNavigationFavoriteStatus,
} from '@/domains/document/cache/document-query-cache';

import { resolveArchiveDestination } from './document-tree-node-action-helpers';

const ARCHIVE_TOAST_ID = 'document-tree-archive';

function markCachedFavoriteDocumentHasChildren(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceSlug: string,
  documentId: string,
) {
  queryClient.setQueryData<FavoriteDocument[] | undefined>(
    favoriteKeys.workspaceList(workspaceSlug),
    (currentFavorites) =>
      currentFavorites?.map((favorite) =>
        favorite.document_id === documentId
          ? {
            ...favorite,
            has_children: true,
          }
          : favorite),
  );
}

type ArchiveMutationVariables = {
  previousRoute?: string;
  version: number;
};

type ArchiveMutationContext = {
  previousDocument?: Document;
  previousDocumentLists: Array<
    readonly [
      readonly unknown[],
      WorkspaceDocumentNavigation | DocumentNavigationPage | undefined,
    ]
  >;
  previousExpandedDocumentIds: string[];
  previousWorkspaceFavorites?: FavoriteDocument[];
};

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

  const archiveDocumentMutation = useMutation<
    Document,
    Error,
    ArchiveMutationVariables,
    ArchiveMutationContext
  >({
    mutationFn: ({ version }) => archiveDocument(document.id, version),
    onMutate: async ({ version }) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: documentKeys.detail(document.id),
        }),
        queryClient.cancelQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
        queryClient.cancelQueries({
          queryKey: favoriteKeys.workspaceList(workspaceSlug),
        }),
      ]);

      const previousDocumentLists = queryClient.getQueriesData<
        WorkspaceDocumentNavigation | DocumentNavigationPage
      >({
        queryKey: documentKeys.lists(workspaceSlug),
      });

      const previousDocument = queryClient.getQueryData<Document>(
        documentKeys.detail(document.id),
      );

      const previousWorkspaceFavorites = queryClient.getQueryData<
        FavoriteDocument[]
      >(favoriteKeys.workspaceList(workspaceSlug));

      const previousExpandedDocumentIds =
        expandedByWorkspace[workspaceSlug] ?? [];

      queryClient.setQueryData<Document>(
        documentKeys.detail(document.id),
        (currentDocument) => currentDocument
          ? {
            ...currentDocument,
            archived_at: currentDocument.archived_at ?? new Date().toISOString(),
            version,
          }
          : currentDocument,
      );

      removeCachedNavigationDocument(queryClient, workspaceSlug, document.id);

      queryClient.setQueryData<FavoriteDocument[]>(
        favoriteKeys.workspaceList(workspaceSlug),
        (currentFavorites) =>
          currentFavorites?.filter((item) => item.document_id !== document.id),
      );

      setExpandedDocumentIds(
        workspaceSlug,
        previousExpandedDocumentIds.filter((documentId) => documentId !== document.id),
      );

      toast('Moved to trash', {
        id: `${ARCHIVE_TOAST_ID}-${document.id}`,
      });

      return {
        previousDocument,
        previousDocumentLists,
        previousExpandedDocumentIds,
        previousWorkspaceFavorites,
      };
    },
    onError: (_error, variables, context) => {
      context?.previousDocumentLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      if (context?.previousDocument) {
        queryClient.setQueryData(
          documentKeys.detail(document.id),
          context.previousDocument,
        );
      }

      if (context?.previousWorkspaceFavorites) {
        queryClient.setQueryData(
          favoriteKeys.workspaceList(workspaceSlug),
          context.previousWorkspaceFavorites,
        );
      }

      if (context) {
        setExpandedDocumentIds(
          workspaceSlug,
          context.previousExpandedDocumentIds,
        );
      }

      if (variables.previousRoute) {
        router.replace(variables.previousRoute);
      }

      toast('Could not move to trash', {
        id: `${ARCHIVE_TOAST_ID}-${document.id}`,
      });
    },
    onSuccess: (archivedDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(document.id),
        archivedDocument,
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: documentKeys.detail(document.id),
        }),
        queryClient.invalidateQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
        queryClient.invalidateQueries({
          queryKey: favoriteKeys.workspaceList(workspaceSlug),
        }),
      ]);
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
      const nextRoute = isActive
        ? nextDocument
          ? workspaceRoutes.document(
            workspaceSlug,
            nextDocument.public_id,
            nextDocument.title,
          )
          : workspaceRoutes.detail(workspaceSlug)
        : undefined;
      const previousRoute =
        isActive && typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : undefined;

      if (nextRoute) {
        router.replace(nextRoute);
      }

      try {
        await archiveDocumentMutation.mutateAsync({
          previousRoute,
          version: documentDetail.version,
        });
      }
      catch {
        return;
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
