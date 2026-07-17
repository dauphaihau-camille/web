'use client';

import { useQuery } from '@tanstack/react-query';
import { workspaceFavoritesQueryOptions } from '../api/favorite.queries';

export function useWorkspaceFavoritesQuery(workspaceSlug: string) {
  return useQuery(workspaceFavoritesQueryOptions(workspaceSlug));
}
