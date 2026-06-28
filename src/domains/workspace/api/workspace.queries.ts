import { queryOptions } from '@tanstack/react-query';

import { getWorkspace } from './workspace.requests';
import { workspaceKeys } from './workspace.keys';
import type { WorkspaceId } from './workspace.types';

export function workspaceDetailQueryOptions(workspaceId: WorkspaceId) {
  return queryOptions({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => getWorkspace(workspaceId),
  });
}
