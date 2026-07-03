'use client';

import { useQuery } from '@tanstack/react-query';
import { workspaceSearchDocumentsQueryOptions } from '../api/search.queries';

export function useWorkspaceSearchDocumentsQuery(
  workspaceId: string,
  query = '',
  limit = 12,
  enabled = true,
) {
  return useQuery({
    ...workspaceSearchDocumentsQueryOptions(workspaceId, query, limit),
    enabled,
  });
}
