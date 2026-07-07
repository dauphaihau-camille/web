'use client';

import { useQuery } from '@tanstack/react-query';

import { myWorkspaceListQueryOptions } from '../api/workspace.queries';

export function useMyWorkspacesQuery() {
  return useQuery(myWorkspaceListQueryOptions());
}
