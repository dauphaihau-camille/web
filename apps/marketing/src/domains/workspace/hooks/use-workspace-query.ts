'use client';

import { useQuery } from '@tanstack/react-query';

import { workspaceDetailQueryOptions } from '../api/workspace.queries';
import type { Workspace, WorkspaceId } from '../api/workspace.types';

export function useWorkspaceQuery(workspaceId: WorkspaceId, initialData?: Workspace) {
  return useQuery({
    ...workspaceDetailQueryOptions(workspaceId),
    ...(initialData ? { initialData } : {}),
  });
}
