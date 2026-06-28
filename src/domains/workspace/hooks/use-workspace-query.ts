'use client';

import { useQuery } from '@tanstack/react-query';

import { workspaceDetailQueryOptions } from '../api/workspace.queries';
import type { WorkspaceId } from '../api/workspace.types';

export function useWorkspaceQuery(workspaceId: WorkspaceId) {
  return useQuery(workspaceDetailQueryOptions(workspaceId));
}
