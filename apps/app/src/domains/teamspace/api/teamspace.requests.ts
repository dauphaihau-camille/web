import { apiGet, apiPatch, apiPost } from '@shared/lib/api-client';
import type { ApiRequestBody, ApiSuccess } from '@shared/api/contracts';

import {
  teamspaceListSchema,
  teamspaceSchema,
} from './teamspace.schemas';
import type {
  CreateTeamspaceInput,
  Teamspace,
  UpdateTeamspaceInput,
} from './teamspace.types';

export async function listWorkspaceTeamspaces(workspaceId: string): Promise<Teamspace[]> {
  const response = await apiGet<
    ApiSuccess<'/v1/workspaces/{workspaceId}/teamspaces', 'get'>
  >(`workspaces/${workspaceId}/teamspaces`);

  return teamspaceListSchema.parse(response);
}

export async function createTeamspace(
  workspaceId: string,
  input: CreateTeamspaceInput,
): Promise<Teamspace> {
  const response = await apiPost<
    ApiSuccess<'/v1/workspaces/{workspaceId}/teamspaces', 'post', 201>,
    CreateTeamspaceInput
  >(
    `workspaces/${workspaceId}/teamspaces`,
    input,
  );

  return teamspaceSchema.parse(response);
}

export async function updateTeamspace(
  teamspaceId: string,
  input: UpdateTeamspaceInput,
): Promise<Teamspace> {
  const response = await apiPatch<
    ApiSuccess<'/v1/teamspaces/{teamspaceId}', 'patch'>,
    ApiRequestBody<'/v1/teamspaces/{teamspaceId}', 'patch'>
  >(
    `teamspaces/${teamspaceId}`,
    input,
  );

  return teamspaceSchema.parse(response);
}
