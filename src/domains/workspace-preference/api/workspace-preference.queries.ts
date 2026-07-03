import { queryOptions } from '@tanstack/react-query';
import { workspacePreferenceKeys } from './workspace-preference.keys';
import { getWorkspacePreference } from './workspace-preference.requests';

export function workspacePreferenceQueryOptions(workspaceId: string) {
  return queryOptions({
    queryKey: workspacePreferenceKeys.detail(workspaceId),
    queryFn: () => getWorkspacePreference(workspaceId),
  });
}
