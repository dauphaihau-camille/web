'use client';

import { useQuery } from '@tanstack/react-query';
import { workspaceFavoritesQueryOptions } from '../api/favorite.queries';

export function useWorkspaceFavoritesQuery(workspaceId: string) {
  return useQuery(workspaceFavoritesQueryOptions(workspaceId));
}
