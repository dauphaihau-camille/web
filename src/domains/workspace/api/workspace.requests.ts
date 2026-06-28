import { apiGet } from '@/lib/api-client';

import type { Workspace, WorkspaceId } from './workspace.types';

export function getWorkspace(workspaceId: WorkspaceId) {
  return apiGet<Workspace>(`workspaces/${workspaceId}`);
}
