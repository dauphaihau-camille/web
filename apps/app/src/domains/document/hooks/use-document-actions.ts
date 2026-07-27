'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  documentDetailQueryOptions,
} from '../api/document.queries';
import { documentKeys } from '../api/document.keys';
import {
  archiveDocument,
  duplicateDocument as duplicateDocumentRequest,
} from '../api/document.requests';
import type {
  Document,
} from '../api/document.types';
import {
  applyArchiveCacheState,
  applyFavoriteCacheState,
  getDocumentListSnapshot,
  restoreDocumentListSnapshot,
  type DocumentListSnapshot,
} from '../actions/document-action-cache';
import { resolveArchiveDestination as defaultResolveArchiveDestination } from '../actions/document-action-helpers';
import {
  favoriteDocument,
  favoriteKeys,
  type FavoriteDocument,
  type FavoriteStatus,
  unfavoriteDocument,
} from '@/domains/favorite';

const ARCHIVE_TOAST_ID = 'document-actions-archive';

type SharedDocumentActionDocument = Pick<
  Document,
  'id' | 'public_id' | 'title' | 'parent_document_id' | 'teamspace_id' | 'sort_key'
> & {
  is_favorite?: boolean;
};

type ArchiveMutationVariables = {
  previousRoute?: string;
  version: number;
};

type ArchiveMutationContext<TArchiveState> = {
  archiveState?: TArchiveState;
  previousDocument?: Document;
  previousDocumentLists: DocumentListSnapshot;
  previousWorkspaceFavorites?: FavoriteDocument[];
};

type FavoriteMutationContext = {
  previousDocument?: Document;
  previousDocumentLists: DocumentListSnapshot;
  previousFavoriteStatus?: FavoriteStatus;
  previousWorkspaceFavorites?: FavoriteDocument[];
};

type UseDocumentActionsArgs<TDocument extends SharedDocumentActionDocument, TArchiveState> = {
  document: TDocument;
  workspaceSlug: string;
  shouldNavigateOnArchive?: boolean;
  buildDocumentHref: (document: Pick<Document, 'public_id' | 'title'>) => string;
  createOptimisticFavoriteDocument: () => FavoriteDocument;
  getCopyLinkUrl: () => string | undefined;
  onArchiveOptimistic?: () => TArchiveState;
  onArchiveRollback?: (archiveState: TArchiveState | undefined) => void;
  resolveArchiveDestination?: typeof defaultResolveArchiveDestination;
};

export function useDocumentActions<
  TDocument extends SharedDocumentActionDocument,
  TArchiveState = never,
>({
  document,
  workspaceSlug,
  shouldNavigateOnArchive = false,
  buildDocumentHref,
  createOptimisticFavoriteDocument,
  getCopyLinkUrl,
  onArchiveOptimistic,
  onArchiveRollback,
  resolveArchiveDestination = defaultResolveArchiveDestination,
}: UseDocumentActionsArgs<TDocument, TArchiveState>) {
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
      const previousDocumentLists = getDocumentListSnapshot(
        queryClient,
        workspaceSlug,
      );

      applyFavoriteCacheState(queryClient, workspaceSlug, {
        documentId: document.id,
        isFavorite: nextIsFavorite,
        optimisticFavoriteDocument: createOptimisticFavoriteDocument(),
      });

      return {
        previousDocument,
        previousDocumentLists,
        previousFavoriteStatus,
        previousWorkspaceFavorites,
      };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        restoreDocumentListSnapshot(queryClient, context.previousDocumentLists);
      }

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
    onSuccess: (status) => {
      applyFavoriteCacheState(queryClient, workspaceSlug, {
        documentId: document.id,
        isFavorite: status.is_favorite,
        optimisticFavoriteDocument: createOptimisticFavoriteDocument(),
      });
      toast(status.is_favorite ? 'Added to favorites' : 'Removed from favorites');
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
    ArchiveMutationContext<TArchiveState>
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

      const previousDocumentLists = getDocumentListSnapshot(
        queryClient,
        workspaceSlug,
      );
      const previousDocument = queryClient.getQueryData<Document>(
        documentKeys.detail(document.id),
      );
      const previousWorkspaceFavorites = queryClient.getQueryData<FavoriteDocument[]>(
        favoriteKeys.workspaceList(workspaceSlug),
      );
      const archiveState = onArchiveOptimistic?.();

      applyArchiveCacheState(queryClient, workspaceSlug, document.id, version);

      toast('Moved to trash', {
        id: `${ARCHIVE_TOAST_ID}-${document.id}`,
      });

      return {
        archiveState,
        previousDocument,
        previousDocumentLists,
        previousWorkspaceFavorites,
      };
    },
    onError: (_error, variables, context) => {
      if (context) {
        restoreDocumentListSnapshot(queryClient, context.previousDocumentLists);
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

      onArchiveRollback?.(context?.archiveState);

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
          queryKey: [...documentKeys.all, 'detail'],
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

  const handleCopyLink = async () => {
    const linkUrl = getCopyLinkUrl();

    if (!linkUrl || typeof window === 'undefined') {
      return;
    }

    await navigator.clipboard.writeText(linkUrl);
    toast('Copied page link to clipboard');
  };

  const handleDuplicate = (targetDocumentId?: string) => {
    void duplicateDocumentMutation.mutateAsync(targetDocumentId ?? document.id);
  };

  const handleArchive = () => {
    void (async () => {
      const latestDocument = await queryClient.ensureQueryData(
        documentDetailQueryOptions(document.id),
      );

      const nextDocument = shouldNavigateOnArchive
        ? await resolveArchiveDestination({
          document: latestDocument,
          queryClient,
          workspaceSlug,
        })
        : null;

      const nextRoute = shouldNavigateOnArchive
        ? nextDocument
          ? buildDocumentHref(nextDocument)
          : undefined
        : undefined;

      const previousRoute =
        shouldNavigateOnArchive && typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : undefined;

      if (nextRoute) {
        router.replace(nextRoute);
      }

      try {
        await archiveDocumentMutation.mutateAsync({
          previousRoute,
          version: latestDocument.version,
        });
      }
      catch {
        return;
      }
    })();
  };

  const handleToggleFavorite = () => {
    const currentStatus =
      queryClient.getQueryData<FavoriteStatus>(favoriteKeys.status(document.id)) ??
      {
        document_id: document.id,
        is_favorite: Boolean(document.is_favorite),
      };

    void favoriteMutation.mutateAsync({
      nextIsFavorite: !currentStatus.is_favorite,
    }).catch(() => {
      // onError already restores caches and shows feedback
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

  return {
    archiveDocumentMutation,
    duplicateDocumentMutation,
    favoriteMutation,
    favoriteStatus,
    handleArchive,
    handleCopyLink,
    handleDuplicate,
    handleToggleFavorite,
    isFavorite: favoriteStatus.is_favorite,
  };
}
