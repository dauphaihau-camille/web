import { queryOptions } from '@tanstack/react-query';
import { favoriteKeys } from './favorite.keys';
import {
  getFavoriteStatus,
  getWorkspaceFavorites,
} from './favorite.requests';

export function workspaceFavoritesQueryOptions(workspaceSlug: string) {
  return queryOptions({
    queryKey: favoriteKeys.workspaceList(workspaceSlug),
    queryFn: () => getWorkspaceFavorites(workspaceSlug),
  });
}

export function favoriteStatusQueryOptions(documentId: string) {
  return queryOptions({
    queryKey: favoriteKeys.status(documentId),
    queryFn: () => getFavoriteStatus(documentId),
  });
}
