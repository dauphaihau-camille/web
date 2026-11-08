import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '@shared/lib/api-client';
import type { ApiRequestBody, ApiSuccess } from '@shared/api/contracts';

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
  const response = await apiGet<ApiSuccess<'/v1/me/workspaces', 'get'>>('me/workspaces');

  return workspaceListSchema.parse(response);
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  const response = await apiPost<
    ApiSuccess<'/v1/workspaces', 'post', 201>,
    ApiRequestBody<'/v1/workspaces', 'post'>
  >('workspaces', input);

  return workspaceSchema.parse(response);
}

export async function getWorkspace(workspaceId: WorkspaceId): Promise<Workspace> {
  const response = await apiGet<ApiSuccess<'/v1/workspaces/{workspaceId}', 'get'>>(
    `workspaces/${workspaceId}`,
  );

  return workspaceSchema.parse(response);
}

export async function updateWorkspace(
  workspaceId: WorkspaceId,
  input: UpdateWorkspaceInput,
): Promise<Workspace> {
  const response = await apiPatch<
    ApiSuccess<'/v1/workspaces/{workspaceId}', 'patch'>,
    ApiRequestBody<'/v1/workspaces/{workspaceId}', 'patch'>
  >(
    `workspaces/${workspaceId}`,
    input,
  );

  return workspaceSchema.parse(response);
}

export async function deleteWorkspace(workspaceId: WorkspaceId): Promise<void> {
  await apiDelete<ApiSuccess<'/v1/workspaces/{workspaceId}', 'delete', 204>>(
    `workspaces/${workspaceId}`,
  );
}

export async function listWorkspaceMembers(
  workspaceId: WorkspaceId,
): Promise<WorkspaceMember[]> {
  const response = await apiGet<
    ApiSuccess<'/v1/workspaces/{workspaceId}/members', 'get'>
  >(`workspaces/${workspaceId}/members`);

  return workspaceMemberListSchema.parse(response);
}

export async function searchWorkspaceMembers(
  workspaceId: WorkspaceId,
  input?: {
    query?: string;
    limit?: number;
  },
): Promise<WorkspaceMember[]> {
  const response = await apiGet<
    ApiSuccess<'/v1/workspaces/{workspaceId}/members/search', 'get'>
  >(`workspaces/${workspaceId}/members/search`, {
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
  const response = await apiPost<
    ApiSuccess<'/v1/workspaces/{workspaceId}/members', 'post', 201>,
    ApiRequestBody<'/v1/workspaces/{workspaceId}/members', 'post'>
  >(
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
  const response = await apiPatch<
    ApiSuccess<'/v1/workspaces/{workspaceId}/members/{memberId}', 'patch'>,
    ApiRequestBody<'/v1/workspaces/{workspaceId}/members/{memberId}', 'patch'>
  >(
    `workspaces/${workspaceId}/members/${memberId}`,
    input,
  );

  return workspaceMemberSchema.parse(response);
}

export async function removeWorkspaceMember(
  workspaceId: WorkspaceId,
  memberId: string,
): Promise<WorkspaceMember> {
  const response = await apiDelete<
    ApiSuccess<'/v1/workspaces/{workspaceId}/members/{memberId}', 'delete'>
  >(`workspaces/${workspaceId}/members/${memberId}`);

  return workspaceMemberSchema.parse(response);
}
