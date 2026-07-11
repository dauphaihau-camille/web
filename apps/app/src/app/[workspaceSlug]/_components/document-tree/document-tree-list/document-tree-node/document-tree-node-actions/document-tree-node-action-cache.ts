import type { QueryClient } from '@tanstack/react-query';

import {
  documentKeys,
  type Document,
  type DocumentNavigationNode,
  type DocumentNavigationPage,
  type WorkspaceDocumentNavigation,
} from '@/domains/document';
import {
  favoriteKeys,
  type FavoriteDocument,
  type FavoriteStatus,
} from '@/domains/favorite';
import {
  removeCachedNavigationDocument,
  updateCachedNavigationFavoriteStatus,
} from '@/domains/document/cache/document-query-cache';

export type DocumentListSnapshot = Array<
  readonly [
    readonly unknown[],
    WorkspaceDocumentNavigation | DocumentNavigationPage | undefined,
  ]
>;

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
  document: DocumentNavigationNode,
  isFavorite: boolean,
) {
  queryClient.setQueryData<FavoriteStatus>(favoriteKeys.status(document.id), {
    document_id: document.id,
    is_favorite: isFavorite,
  });
  queryClient.setQueryData<Document>(
    documentKeys.detail(document.id),
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
    document.id,
    isFavorite,
  );
  updateWorkspaceFavoritesCache(
    queryClient,
    workspaceSlug,
    document,
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
  queryClient.setQueryData<FavoriteDocument[]>(
    favoriteKeys.workspaceList(workspaceSlug),
    (currentFavorites) =>
      currentFavorites?.filter((item) => item.document_id !== documentId),
  );
}
