'use client';

import { useQuery } from '@tanstack/react-query';

import { workspaceDocumentChildrenQueryOptions } from '../api/document.queries';
import type { DocumentId, WorkspaceId } from '../api/document.types';

export function useWorkspaceDocumentChildrenQuery(
  workspaceId: WorkspaceId,
  parentDocumentId: DocumentId,
  options?: {
    enabled?: boolean;
    limit?: number;
    cursor?: string;
  },
) {
  return useQuery({
    ...workspaceDocumentChildrenQueryOptions(
      workspaceId,
      parentDocumentId,
      options?.limit,
      options?.cursor,
    ),
    enabled: options?.enabled,
  });
}
