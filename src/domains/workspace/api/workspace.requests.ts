import { apiGet } from '@/lib/api-client';

import { workspaceListSchema, workspaceSchema } from './workspace.schemas';
import type { Workspace, WorkspaceId } from './workspace.types';

export async function listMyWorkspaces(): Promise<Workspace[]> {
  const response = await apiGet<unknown>('me/workspaces');

  return workspaceListSchema.parse(response);
}

export async function getWorkspace(workspaceId: WorkspaceId): Promise<Workspace> {
  const response = await apiGet<unknown>(`workspaces/${workspaceId}`);

  return workspaceSchema.parse(response);
}
