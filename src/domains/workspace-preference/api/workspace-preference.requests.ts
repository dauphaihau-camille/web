import { apiGet, apiPatch } from '@/lib/api-client';
import {
  updateWorkspacePreferenceSchema,
  workspacePreferenceSchema,
} from './workspace-preference.schemas';
import type { WorkspacePreference } from './workspace-preference.types';

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
