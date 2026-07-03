import { queryOptions } from '@tanstack/react-query';
import { favoriteKeys } from './favorite.keys';
import {
  getFavoriteStatus,
  getWorkspaceFavorites,
} from './favorite.requests';

export function workspaceFavoritesQueryOptions(workspaceId: string) {
  return queryOptions({
    queryKey: favoriteKeys.workspaceList(workspaceId),
    queryFn: () => getWorkspaceFavorites(workspaceId),
  });
}

export function favoriteStatusQueryOptions(documentId: string) {
  return queryOptions({
    queryKey: favoriteKeys.status(documentId),
    queryFn: () => getFavoriteStatus(documentId),
  });
}
