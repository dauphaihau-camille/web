'use client';

import { useQuery } from '@tanstack/react-query';
import { workspacePreferenceQueryOptions } from '../api/workspace-preference.queries';

export function useWorkspacePreferenceQuery(workspaceId: string) {
  return useQuery(workspacePreferenceQueryOptions(workspaceId));
}
