'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  archiveDocument,
  documentDetailQueryOptions,
  documentKeys,
  permanentlyDeleteDocument,
  type DocumentNavigationNode,
  type WorkspaceDocumentNavigation,
  duplicateDocument as duplicateDocumentRequest,
  restoreDocument,
  workspaceDocumentChildrenQueryOptions,
  workspaceDocumentRootQueryOptions,
  type Document,
} from '@shared/domains/document';
import {
  favoriteDocument as addFavoriteDocument,
  favoriteKeys,
  type FavoriteDocument,
  type FavoriteStatus,
  unfavoriteDocument,
} from '@/domains/favorite';
import {
  publishDocument,
  unpublishDocument,
} from '@shared/domains/publish';
import { workspaceRoutes } from '@shared/domains/workspace';

import { removeCachedNavigationDocument } from '../document-screen-cache';

type UseHeaderActionsOptions = {
  workspaceSlug: string;
  document: Document;
};

type FavoriteMutationContext = {
  previousFavoriteStatus?: FavoriteStatus;
  previousWorkspaceFavorites?: FavoriteDocument[];
};

type RestoreMutationContext = {
  previousDocument?: Document;
};

export function useHeaderActions({
  workspaceSlug,
  document,
}: UseHeaderActionsOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const duplicateDocumentMutation = useMutation({
    mutationFn: async (targetDocumentId: string) => duplicateDocumentRequest(targetDocumentId),
    onSuccess: async (duplicatedDocument, targetDocumentId) => {
      queryClient.setQueryData(
        documentKeys.detail(duplicatedDocument.id),
        duplicatedDocument,
      );
      if (duplicatedDocument.parent_document_id) {
        await queryClient.invalidateQueries({
          queryKey: documentKeys.detail(duplicatedDocument.parent_document_id),
        });
      }
      if (targetDocumentId !== document.id) {
        await queryClient.invalidateQueries({
          queryKey: documentKeys.detail(targetDocumentId),
        });
      }
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
    },
  });

  const archiveDocumentMutation = useMutation({
    mutationFn: () => archiveDocument(document.id, document.version),
    onSuccess: (archivedDocument) => {
      queryClient.setQueryData(documentKeys.detail(document.id), archivedDocument);
      removeCachedNavigationDocument(queryClient, workspaceSlug, document.id);
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
        queryClient.invalidateQueries({
          queryKey: favoriteKeys.workspaceList(workspaceSlug),
        }),
      ]);
      toast('Moved to trash');
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async ({ nextIsFavorite }: { nextIsFavorite: boolean }) => {
      if (!nextIsFavorite) {
        return unfavoriteDocument(document.id);
      }

      return addFavoriteDocument(document.id);
    },
    onMutate: async ({ nextIsFavorite }) => {
      await queryClient.cancelQueries({
        queryKey: favoriteKeys.status(document.id),
      });
      await queryClient.cancelQueries({
        queryKey: favoriteKeys.workspaceList(workspaceSlug),
      });

      const previousFavoriteStatus = queryClient.getQueryData<FavoriteStatus>(
        favoriteKeys.status(document.id),
      );
      const previousWorkspaceFavorites = queryClient.getQueryData<FavoriteDocument[]>(
        favoriteKeys.workspaceList(workspaceSlug),
      );

      queryClient.setQueryData<FavoriteStatus>(
        favoriteKeys.status(document.id),
        {
          document_id: document.id,
          is_favorite: nextIsFavorite,
        },
      );
      queryClient.setQueryData<Document>(
        documentKeys.detail(document.id),
        (currentDocument) => currentDocument
          ? {
            ...currentDocument,
            is_favorite: nextIsFavorite,
          }
          : currentDocument,
      );
      updateWorkspaceFavoritesCache({
        document,
        isFavorite: nextIsFavorite,
        queryClient,
        workspaceSlug,
      });

      return {
        previousFavoriteStatus,
        previousWorkspaceFavorites,
      } satisfies FavoriteMutationContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousFavoriteStatus) {
        queryClient.setQueryData(
          favoriteKeys.status(document.id),
          context.previousFavoriteStatus,
        );
      }
      queryClient.setQueryData<Document>(
        documentKeys.detail(document.id),
        (currentDocument) => currentDocument
          ? {
            ...currentDocument,
            is_favorite: context?.previousFavoriteStatus?.is_favorite ?? currentDocument.is_favorite,
          }
          : currentDocument,
      );

      if (context?.previousWorkspaceFavorites) {
        queryClient.setQueryData(
          favoriteKeys.workspaceList(workspaceSlug),
          context.previousWorkspaceFavorites,
        );
      }

      toast('Could not update favorites');
    },
    onSuccess: (status) => {
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
      updateWorkspaceFavoritesCache({
        document,
        isFavorite: status.is_favorite,
        queryClient,
        workspaceSlug,
      });
      toast(status.is_favorite ? 'Added to favorites' : 'Removed from favorites');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: favoriteKeys.workspaceList(workspaceSlug),
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishDocument(document.id),
    onSuccess: (status) => {
      queryClient.setQueryData<Document>(
        documentKeys.detail(document.id),
        (currentDocument) => currentDocument
          ? {
            ...currentDocument,
            published_document_id: status.published_document_id,
            public_path: status.public_path,
          }
          : currentDocument,
      );
      toast('Published document');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishDocument(document.id),
    onSuccess: (status) => {
      queryClient.setQueryData<Document>(
        documentKeys.detail(document.id),
        (currentDocument) => currentDocument
          ? {
            ...currentDocument,
            published_document_id: status.published_document_id,
            public_path: status.public_path,
          }
          : currentDocument,
      );
      toast('Unpublished document');
    },
  });

  const restoreDocumentMutation = useMutation({
    mutationFn: async () => {
      const latestDocument = await queryClient.ensureQueryData(
        documentDetailQueryOptions(document.id),
      );

      return restoreDocument(document.id, latestDocument.version);
    },
    onMutate: async (): Promise<RestoreMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: documentKeys.detail(document.id),
      });

      const previousDocument = queryClient.getQueryData<Document>(
        documentKeys.detail(document.id),
      );

      if (previousDocument) {
        queryClient.setQueryData<Document>(documentKeys.detail(document.id), {
          ...previousDocument,
          archived_at: undefined,
          archived_by_name: undefined,
        });
      }

      return {
        previousDocument,
      };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousDocument) {
        queryClient.setQueryData(
          documentKeys.detail(document.id),
          context.previousDocument,
        );
      }
    },
    onSuccess: async (restoredDocument) => {
      queryClient.setQueryData(documentKeys.detail(document.id), restoredDocument);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: documentKeys.archivedList(workspaceSlug, 50),
        }),
        queryClient.invalidateQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
      ]);
      toast('Document restored');
    },
  });

  const permanentlyDeleteDocumentMutation = useMutation({
    mutationFn: async () => {
      const latestDocument = await queryClient.ensureQueryData(
        documentDetailQueryOptions(document.id),
      );

      await permanentlyDeleteDocument(document.id, latestDocument.version);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: documentKeys.archivedList(workspaceSlug, 50),
        }),
        queryClient.invalidateQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
      ]);
      toast('Document permanently deleted');
      router.replace(workspaceRoutes.detail(workspaceSlug));
    },
  });

  const copyLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    toast('Copied page link to clipboard');
  };

  const duplicateDocument = (targetDocumentId?: string) => {
    void duplicateDocumentMutation.mutateAsync(targetDocumentId ?? document.id);
  };

  const archiveCurrentDocument = () => {
    void (async () => {
      const nextDocument = await resolveArchiveDestination({
        document,
        queryClient,
        workspaceSlug,
      });

      await archiveDocumentMutation.mutateAsync();

      router.replace(
        nextDocument
          ? workspaceRoutes.document(
            workspaceSlug,
            nextDocument.public_id,
            nextDocument.title,
          )
          : workspaceRoutes.detail(workspaceSlug),
      );
    })();
  };

  const toggleFavorite = () => {
    const currentStatus =
      queryClient.getQueryData<FavoriteStatus>(favoriteKeys.status(document.id)) ??
      {
        document_id: document.id,
        is_favorite: Boolean(document.is_favorite),
      };

    void favoriteMutation.mutateAsync({
      nextIsFavorite: !currentStatus?.is_favorite,
    });
  };

  const favoriteStatus = favoriteMutation.isPending
    ? {
      document_id: document.id,
      is_favorite: favoriteMutation.variables.nextIsFavorite,
    }
    : {
      document_id: document.id,
      is_favorite: Boolean(document.is_favorite),
    };

  const copyPublishedLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const status =
      document.published_document_id && document.public_path
        ? {
          document_id: document.id,
          published_document_id: document.published_document_id,
          public_path: document.public_path,
        }
        : await publishMutation.mutateAsync();

    if (!status.public_path) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}${status.public_path}`);
    toast('Copied published link to clipboard');
  };

  const publishCurrentDocument = () => {
    void publishMutation.mutateAsync();
  };

  const unpublishCurrentDocument = () => {
    void unpublishMutation.mutateAsync();
  };

  const restoreCurrentDocument = () => {
    void restoreDocumentMutation.mutateAsync();
  };

  const permanentlyDeleteCurrentDocument = () => {
    void permanentlyDeleteDocumentMutation.mutateAsync();
  };

  return {
    archiveCurrentDocument,
    copyLink,
    copyPublishedLink,
    duplicateDocument,
    favoriteStatus,
    isArchived: Boolean(document.archived_at),
    isFavoriting: favoriteMutation.isPending,
    isArchiving: archiveDocumentMutation.isPending,
    isPermanentlyDeleting: permanentlyDeleteDocumentMutation.isPending,
    isRestoring: restoreDocumentMutation.isPending,
    isDuplicating: duplicateDocumentMutation.isPending,
    isPublishing: publishMutation.isPending,
    isUnpublishing: unpublishMutation.isPending,
    permanentlyDeleteCurrentDocument,
    publishStatus: {
      document_id: document.id,
      published_document_id: document.published_document_id,
      public_path: document.public_path,
    },
    publishCurrentDocument,
    restoreCurrentDocument,
    toggleFavorite,
    unpublishCurrentDocument,
  };
}

function orderDocuments(items: DocumentNavigationNode[]) {
  return [...items].sort((left, right) => right.sort_key - left.sort_key);
}

function getNearestDocument(
  items: DocumentNavigationNode[],
  currentDocumentId: string,
) {
  const orderedItems = orderDocuments(items);
  const currentIndex = orderedItems.findIndex((item) => item.id === currentDocumentId);

  if (currentIndex === -1) {
    return orderedItems[0] ?? null;
  }

  return orderedItems[currentIndex - 1] ??
    orderedItems[currentIndex + 1] ??
    null;
}

async function resolveArchiveDestination({
  document,
  queryClient,
  workspaceSlug,
}: {
  document: Document;
  queryClient: QueryClient;
  workspaceSlug: string;
}) {
  if (document.parent_document_id) {
    const siblingPage = await queryClient.ensureQueryData(
      workspaceDocumentChildrenQueryOptions(workspaceSlug, document.parent_document_id),
    );
    const siblingDocument = getNearestDocument(siblingPage.items, document.id);

    if (siblingDocument) {
      return siblingDocument;
    }

    return queryClient.ensureQueryData(documentDetailQueryOptions(document.parent_document_id));
  }

  const rootNavigation = await queryClient.ensureQueryData(
    workspaceDocumentRootQueryOptions(workspaceSlug),
  );
  const rootItems = getRootNavigationItems(rootNavigation, document.teamspace_id);

  return getNearestDocument(rootItems, document.id);
}

function getRootNavigationItems(
  navigation: WorkspaceDocumentNavigation,
  teamspaceId?: string,
) {
  if (!teamspaceId) {
    return navigation.private_documents.items;
  }

  return navigation.teamspaces.find((teamspace) => teamspace.id === teamspaceId)?.documents.items ?? [];
}

function updateWorkspaceFavoritesCache({
  document,
  isFavorite,
  queryClient,
  workspaceSlug,
}: {
  document: Document;
  isFavorite: boolean;
  queryClient: QueryClient;
  workspaceSlug: string;
}) {
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
        createOptimisticFavoriteDocument(document),
        ...currentFavorites.filter((favorite) => favorite.document_id !== document.id),
      ];
    },
  );
}

function createOptimisticFavoriteDocument(document: Document): FavoriteDocument {
  return {
    document_id: document.id,
    favorited_at: new Date().toISOString(),
    parent_document_id: document.parent_document_id,
    public_id: document.public_id,
    sort_key: document.sort_key,
    teamspace_id: document.teamspace_id,
    title: document.title,
    workspace_id: document.workspace_id,
  };
}
