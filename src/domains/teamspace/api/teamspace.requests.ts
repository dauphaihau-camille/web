import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

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
  const response = await apiGet<unknown>(`workspaces/${workspaceId}/teamspaces`);

  return teamspaceListSchema.parse(response);
}

export async function createTeamspace(
  workspaceId: string,
  input: CreateTeamspaceInput,
): Promise<Teamspace> {
  const response = await apiPost<unknown, CreateTeamspaceInput>(
    `workspaces/${workspaceId}/teamspaces`,
    input,
  );

  return teamspaceSchema.parse(response);
}

export async function updateTeamspace(
  teamspaceId: string,
  input: UpdateTeamspaceInput,
): Promise<Teamspace> {
  const response = await apiPatch<unknown, UpdateTeamspaceInput>(
    `teamspaces/${teamspaceId}`,
    input,
  );

  return teamspaceSchema.parse(response);
}
