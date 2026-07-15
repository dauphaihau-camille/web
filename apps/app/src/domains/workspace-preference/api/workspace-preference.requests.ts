import { apiGet, apiPatch, apiRequest } from '@shared/lib/api-client';
import { workspaceSchema } from '@/domains/workspace/api/workspace.schemas';
import {
  updateWorkspacePreferenceSchema,
  workspacePreferenceSchema,
} from './workspace-preference.schemas';
import type { WorkspacePreference } from './workspace-preference.types';
import type { Workspace } from '@/domains/workspace/api/workspace.types';

export async function getWorkspacePreference(
  workspaceId: string,
): Promise<WorkspacePreference> {
  const response = await apiGet<unknown>(`workspaces/${workspaceId}/preferences`);

  return workspacePreferenceSchema.parse(response);
}

export async function updateWorkspacePreference(
  workspaceId: string,
  input: {
    navigation: {
      expanded_document_ids: string[];
    };
  },
): Promise<WorkspacePreference> {
  const payload = updateWorkspacePreferenceSchema.parse(input);
  const response = await apiPatch<unknown, typeof payload>(
    `workspaces/${workspaceId}/preferences`,
    payload,
  );

  return workspacePreferenceSchema.parse(response);
}

export async function markWorkspaceAsLastActive(
  workspaceId: string,
): Promise<void> {
  await apiRequest(`workspaces/${workspaceId}/preferences/last-active`, {
    method: 'patch',
  });
}

export async function getLastActiveWorkspace(): Promise<Workspace | null> {
  const response = await apiRequest('me/workspaces/last-active');
  const responseText = await response.text();

  if (response.status === 204 || responseText.trim().length === 0) {
    return null;
  }

  const payload = JSON.parse(responseText) as unknown;

  return payload === null ? null : workspaceSchema.parse(payload);
}
