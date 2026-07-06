'use client';

import { useQuery } from '@tanstack/react-query';
import { favoriteStatusQueryOptions } from '../api/favorite.queries';

export function useFavoriteStatusQuery(documentId: string) {
  return useQuery(favoriteStatusQueryOptions(documentId));
}
