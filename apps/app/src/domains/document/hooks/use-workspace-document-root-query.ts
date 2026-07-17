'use client';

import { useQuery } from '@tanstack/react-query';

import { workspaceDocumentRootQueryOptions } from '../api/document.queries';
import type { WorkspaceId } from '../api/document.types';

export function useWorkspaceDocumentRootQuery(
  workspaceId: WorkspaceId,
  options?: {
    enabled?: boolean;
    limit?: number;
    cursor?: string;
    query?: string;
  },
) {
  return useQuery({
    ...workspaceDocumentRootQueryOptions(
      workspaceId,
      options?.limit,
      options?.cursor,
      options?.query,
    ),
    enabled: options?.enabled,
  });
}
