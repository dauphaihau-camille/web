'use client';

import type { QueryClient } from '@tanstack/react-query';

import { documentKeys } from '../api/document.keys';
import type {
  Document,
  DocumentNavigationPage,
  WorkspaceDocumentNavigation,
} from '../api/document.types';
import {
  removeCachedNavigationDocument,
  updateCachedNavigationFavoriteStatus,
} from '../cache/document-query-cache';
import {
  favoriteKeys,
  type FavoriteDocument,
  type FavoriteStatus,
} from '@/domains/favorite';

export type DocumentListSnapshot = Array<
  readonly [
    readonly unknown[],
    WorkspaceDocumentNavigation | DocumentNavigationPage | undefined,
  ]
>;

export function getDocumentListSnapshot(
  queryClient: QueryClient,
  workspaceSlug: string,
) {
  return queryClient.getQueriesData<
    WorkspaceDocumentNavigation | DocumentNavigationPage
  >({
    queryKey: documentKeys.lists(workspaceSlug),
  });
}

export function restoreDocumentListSnapshot(
  queryClient: QueryClient,
  snapshot: DocumentListSnapshot,
) {
  snapshot.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}

function updateWorkspaceFavoritesCache(
  queryClient: QueryClient,
  workspaceSlug: string,
  documentId: string,
  optimisticFavoriteDocument: FavoriteDocument,
  isFavorite: boolean,
) {
  queryClient.setQueryData<FavoriteDocument[] | undefined>(
    favoriteKeys.workspaceList(workspaceSlug),
    (currentFavorites) => {
      if (!currentFavorites) {
        return currentFavorites;
      }

      if (!isFavorite) {
        return currentFavorites.filter((favorite) => favorite.document_id !== documentId);
      }

      return [
        optimisticFavoriteDocument,
        ...currentFavorites.filter((favorite) => favorite.document_id !== documentId),
      ];
    },
  );
}

export function markCachedFavoriteDocumentHasChildren(
  queryClient: QueryClient,
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

export function applyFavoriteCacheState(
  queryClient: QueryClient,
  workspaceSlug: string,
  {
    documentId,
    isFavorite,
    optimisticFavoriteDocument,
  }: {
    documentId: string;
    isFavorite: boolean;
    optimisticFavoriteDocument: FavoriteDocument;
  },
) {
  queryClient.setQueryData<FavoriteStatus>(favoriteKeys.status(documentId), {
    document_id: documentId,
    is_favorite: isFavorite,
  });
  queryClient.setQueryData<Document>(
    documentKeys.detail(documentId),
    (currentDocument) => currentDocument
      ? {
        ...currentDocument,
        is_favorite: isFavorite,
      }
      : currentDocument,
  );
  updateCachedNavigationFavoriteStatus(
    queryClient,
    workspaceSlug,
    documentId,
    isFavorite,
  );
  updateWorkspaceFavoritesCache(
    queryClient,
    workspaceSlug,
    documentId,
    optimisticFavoriteDocument,
    isFavorite,
  );
}

export function applyArchiveCacheState(
  queryClient: QueryClient,
  workspaceSlug: string,
  documentId: string,
  version: number,
) {
  queryClient.setQueryData<Document>(
    documentKeys.detail(documentId),
    (currentDocument) => currentDocument
      ? {
        ...currentDocument,
        archived_at: currentDocument.archived_at ?? new Date().toISOString(),
        version,
      }
      : currentDocument,
  );
  removeCachedNavigationDocument(queryClient, workspaceSlug, documentId);
  queryClient.setQueryData<FavoriteDocument[] | undefined>(
    favoriteKeys.workspaceList(workspaceSlug),
    (currentFavorites) =>
      currentFavorites?.filter((item) => item.document_id !== documentId),
  );
}
