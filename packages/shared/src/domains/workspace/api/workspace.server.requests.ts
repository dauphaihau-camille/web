import 'server-only';

import { apiServerGet, apiServerRequest } from '../../../lib/api-server';

import { workspaceListSchema, workspaceSchema } from './workspace.schemas';
import type { Workspace, WorkspaceId } from './workspace.types';

async function buildWorkspaceRequestError(response: Response) {
  const responseBody = await response.text().catch(() => '');
  const trimmedBody = responseBody.trim();
  const details = trimmedBody ? ` Body: ${trimmedBody}` : '';

  return new Error(`Failed to load the workspace. Status: ${response.status}.${details}`);
}

export async function listMyWorkspacesServer(): Promise<Workspace[]> {
  const response = await apiServerGet<unknown>('me/workspaces');

  return workspaceListSchema.parse(response);
}

export async function getWorkspaceServer(workspaceId: WorkspaceId): Promise<Workspace> {
  const response = await apiServerRequest(`workspaces/${workspaceId}`);

  if (!response.ok) {
    throw await buildWorkspaceRequestError(response);
  }

  const payload = await response.json();

  return workspaceSchema.parse(payload);
}
