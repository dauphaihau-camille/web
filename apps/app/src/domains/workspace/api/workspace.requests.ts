import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '@shared/lib/api-client';

import {
  workspaceListSchema,
  workspaceMemberListSchema,
  workspaceMemberSchema,
  workspaceSchema,
} from './workspace.schemas';
import type {
  AddWorkspaceMemberInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  UpdateWorkspaceMemberInput,
  Workspace,
  WorkspaceId,
  WorkspaceMember,
} from './workspace.types';

export async function listMyWorkspaces(): Promise<Workspace[]> {
  const response = await apiGet<unknown>('me/workspaces');

  return workspaceListSchema.parse(response);
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  const response = await apiPost<unknown, CreateWorkspaceInput>('workspaces', input);

  return workspaceSchema.parse(response);
}

export async function getWorkspace(workspaceId: WorkspaceId): Promise<Workspace> {
  const response = await apiGet<unknown>(`workspaces/${workspaceId}`);

  return workspaceSchema.parse(response);
}

export async function updateWorkspace(
  workspaceId: WorkspaceId,
  input: UpdateWorkspaceInput,
): Promise<Workspace> {
  const response = await apiPatch<unknown, UpdateWorkspaceInput>(
    `workspaces/${workspaceId}`,
    input,
  );

  return workspaceSchema.parse(response);
}

export async function listWorkspaceMembers(
  workspaceId: WorkspaceId,
): Promise<WorkspaceMember[]> {
  const response = await apiGet<unknown>(`workspaces/${workspaceId}/members`);

  return workspaceMemberListSchema.parse(response);
}

export async function searchWorkspaceMembers(
  workspaceId: WorkspaceId,
  input?: {
    query?: string;
    limit?: number;
  },
): Promise<WorkspaceMember[]> {
  const response = await apiGet<unknown>(`workspaces/${workspaceId}/members/search`, {
    searchParams: {
      ...(input?.query ? { q: input.query } : {}),
      ...(input?.limit ? { limit: String(input.limit) } : {}),
    },
  });

  return workspaceMemberListSchema.parse(response);
}

export async function addWorkspaceMember(
  workspaceId: WorkspaceId,
  input: AddWorkspaceMemberInput,
): Promise<WorkspaceMember> {
  const response = await apiPost<unknown, AddWorkspaceMemberInput>(
    `workspaces/${workspaceId}/members`,
    input,
  );

  return workspaceMemberSchema.parse(response);
}

export async function updateWorkspaceMember(
  workspaceId: WorkspaceId,
  memberId: string,
  input: UpdateWorkspaceMemberInput,
): Promise<WorkspaceMember> {
  const response = await apiPatch<unknown, UpdateWorkspaceMemberInput>(
    `workspaces/${workspaceId}/members/${memberId}`,
    input,
  );

  return workspaceMemberSchema.parse(response);
}

export async function removeWorkspaceMember(
  workspaceId: WorkspaceId,
  memberId: string,
): Promise<WorkspaceMember> {
  const response = await apiDelete<unknown>(`workspaces/${workspaceId}/members/${memberId}`);

  return workspaceMemberSchema.parse(response);
}
