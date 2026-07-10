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
} from '@/domains/document';
import {
  favoriteDocument,
  favoriteKeys,
  type FavoriteDocument,
  type FavoriteStatus,
  unfavoriteDocument,
} from '@/domains/favorite';
import { useDocumentTreeExpansionStore } from '@/stores/document-tree-expansion-store';
import { workspaceRoutes } from '@/domains/workspace';
import {
  insertCreatedSubdocIntoCachedChildren,
  markCachedNavigationNodeHasChildren,
  removeCachedNavigationDocument,
  updateCachedNavigationFavoriteStatus,
} from '@/domains/document/cache/document-query-cache';

import { resolveArchiveDestination } from './document-tree-node-action-helpers';

const ARCHIVE_TOAST_ID = 'document-tree-archive';

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

function updateWorkspaceFavoritesCache(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceSlug: string,
  document: DocumentNavigationNode,
  isFavorite: boolean,
) {
  queryClient.setQueryData<FavoriteDocument[] | undefined>(
    favoriteKeys.workspaceList(workspaceSlug),
    (currentFavorites) => {
      if (!currentFavorites) {
        return currentFavorites;
      }

      if (!isFavorite) {
        return currentFavorites.filter((favorite) => favorite.document_id !== document.id);
      }

      return [
        createOptimisticFavoriteDocument(document, workspaceSlug),
        ...currentFavorites.filter((favorite) => favorite.document_id !== document.id),
      ];
    },
  );
}

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

type FavoriteMutationContext = {
  previousDocument?: Document;
  previousDocumentLists: Array<
    readonly [
      readonly unknown[],
      WorkspaceDocumentNavigation | DocumentNavigationPage | undefined,
    ]
  >;
  previousFavoriteStatus?: FavoriteStatus;
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

  const favoriteMutation = useMutation<
    FavoriteStatus,
    Error,
    { nextIsFavorite: boolean },
    FavoriteMutationContext
  >({
    mutationFn: async ({ nextIsFavorite }) => {
      if (!nextIsFavorite) {
        return unfavoriteDocument(document.id);
      }

      return favoriteDocument(document.id);
    },
    onMutate: async ({ nextIsFavorite }) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: favoriteKeys.status(document.id),
        }),
        queryClient.cancelQueries({
          queryKey: favoriteKeys.workspaceList(workspaceSlug),
        }),
        queryClient.cancelQueries({
          queryKey: documentKeys.detail(document.id),
        }),
        queryClient.cancelQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
      ]);

      const previousFavoriteStatus = queryClient.getQueryData<FavoriteStatus>(
        favoriteKeys.status(document.id),
      );
      const previousWorkspaceFavorites = queryClient.getQueryData<FavoriteDocument[]>(
        favoriteKeys.workspaceList(workspaceSlug),
      );
      const previousDocument = queryClient.getQueryData<Document>(
        documentKeys.detail(document.id),
      );
      const previousDocumentLists = queryClient.getQueriesData<
        WorkspaceDocumentNavigation | DocumentNavigationPage
      >({
        queryKey: documentKeys.lists(workspaceSlug),
      });

      queryClient.setQueryData<FavoriteStatus>(favoriteKeys.status(document.id), {
        document_id: document.id,
        is_favorite: nextIsFavorite,
      });
      queryClient.setQueryData<Document>(
        documentKeys.detail(document.id),
        (currentDocument) => currentDocument
          ? {
            ...currentDocument,
            is_favorite: nextIsFavorite,
          }
          : currentDocument,
      );
      updateCachedNavigationFavoriteStatus(
        queryClient,
        workspaceSlug,
        document.id,
        nextIsFavorite,
      );
      updateWorkspaceFavoritesCache(
        queryClient,
        workspaceSlug,
        document,
        nextIsFavorite,
      );

      return {
        previousDocument,
        previousDocumentLists,
        previousFavoriteStatus,
        previousWorkspaceFavorites,
      };
    },
    onError: (_error, _variables, context) => {
      context?.previousDocumentLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      if (context?.previousFavoriteStatus) {
        queryClient.setQueryData(
          favoriteKeys.status(document.id),
          context.previousFavoriteStatus,
        );
      }

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

      toast('Could not update favorites');
    },
    onSuccess: async (status) => {
      queryClient.setQueryData(favoriteKeys.status(document.id), status);
      queryClient.setQueryData<Document>(
        documentKeys.detail(document.id),
        (currentDocument) => currentDocument
          ? {
            ...currentDocument,
            is_favorite: status.is_favorite,
          }
          : currentDocument,
      );
      updateCachedNavigationFavoriteStatus(
        queryClient,
        workspaceSlug,
        document.id,
        status.is_favorite,
      );
      updateWorkspaceFavoritesCache(queryClient, workspaceSlug, document, status.is_favorite);
      toast(
        status.is_favorite ? 'Added to favorites' : 'Removed from favorites',
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: favoriteKeys.status(document.id),
        }),
        queryClient.invalidateQueries({
          queryKey: favoriteKeys.workspaceList(workspaceSlug),
        }),
        queryClient.invalidateQueries({
          queryKey: documentKeys.detail(document.id),
        }),
        queryClient.invalidateQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
      ]);
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
    void favoriteMutation.mutateAsync({
      nextIsFavorite: !document.is_favorite,
    });
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
