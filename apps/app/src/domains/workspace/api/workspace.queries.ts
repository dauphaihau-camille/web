import { queryOptions } from '@tanstack/react-query';

import {
  getWorkspace,
  listMyWorkspaces,
  listWorkspaceMembers,
} from './workspace.requests';
import { workspaceKeys } from './workspace.keys';
import type { WorkspaceId } from './workspace.types';

export function myWorkspaceListQueryOptions() {
  return queryOptions({
    queryKey: workspaceKeys.list({
      scope: 'me',
    }),
    queryFn: listMyWorkspaces,
  });
}

export function workspaceDetailQueryOptions(workspaceId: WorkspaceId) {
  return queryOptions({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => getWorkspace(workspaceId),
  });
}

export function workspaceMemberListQueryOptions(workspaceId: WorkspaceId) {
  return queryOptions({
    queryKey: workspaceKeys.memberList(workspaceId),
    queryFn: () => listWorkspaceMembers(workspaceId),
  });
}
