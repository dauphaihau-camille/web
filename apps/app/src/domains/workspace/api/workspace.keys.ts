import type { WorkspaceId } from './workspace.types';

export const workspaceKeys = {
  all: ['workspace'] as const,
  lists: () => [...workspaceKeys.all, 'list'] as const,
  list: (filters?: Record<string, string | number | boolean | undefined>) =>
    [...workspaceKeys.lists(), filters ?? {}] as const,
  details: () => [...workspaceKeys.all, 'detail'] as const,
  detail: (workspaceId: WorkspaceId) =>
    [...workspaceKeys.details(), workspaceId] as const,
  members: () => [...workspaceKeys.all, 'members'] as const,
  memberList: (workspaceId: WorkspaceId) =>
    [...workspaceKeys.members(), workspaceId] as const,
  memberSearch: (
    workspaceId: WorkspaceId,
    query?: string,
    limit?: number,
  ) => [...workspaceKeys.members(), workspaceId, 'search', { query, limit }] as const,
};
