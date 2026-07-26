import 'server-only';

import { apiServerGet, apiServerRequest } from '@shared/lib/api-server';

import { workspaceListSchema, workspaceSchema } from './workspace.schemas';
import type { Workspace, WorkspaceId } from './workspace.types';

class WorkspaceServerRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'WorkspaceServerRequestError';
  }
}

async function buildWorkspaceRequestError(label: string, response: Response) {
  const responseBody = await response.text().catch(() => '');
  const trimmedBody = responseBody.trim();
  const details = trimmedBody ? ` Body: ${trimmedBody}` : '';

  return new WorkspaceServerRequestError(
    `Failed to load ${label}. Status: ${response.status}.${details}`,
    response.status,
  );
}

export async function listMyWorkspacesServer(): Promise<Workspace[]> {
  const response = await apiServerGet<unknown>('me/workspaces');

  return workspaceListSchema.parse(response);
}

export async function getLastActiveWorkspaceServer(): Promise<Workspace | null> {
  const response = await apiServerRequest('me/workspaces/last-active');

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw await buildWorkspaceRequestError('the last active workspace', response);
  }

  const responseText = await response.text();

  if (response.status === 204 || responseText.trim().length === 0) {
    return null;
  }

  const payload = JSON.parse(responseText) as unknown;

  return payload === null ? null : workspaceSchema.parse(payload);
}

export async function getDefaultWorkspaceServer(): Promise<Workspace | null> {
  const lastActiveWorkspace = await getLastActiveWorkspaceServer();

  if (lastActiveWorkspace) {
    return lastActiveWorkspace;
  }

  const workspaces = await listMyWorkspacesServer();

  return workspaces[0] ?? null;
}

export async function getWorkspaceServer(workspaceId: WorkspaceId): Promise<Workspace> {
  const response = await apiServerRequest(`workspaces/${workspaceId}`);

  if (!response.ok) {
    throw await buildWorkspaceRequestError('the workspace', response);
  }

  const payload = await response.json();

  return workspaceSchema.parse(payload);
}
