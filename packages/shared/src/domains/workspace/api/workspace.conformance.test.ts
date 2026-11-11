import {
  describe,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import type {
  workspaceMemberSchema,
  workspaceSchema,
} from '../../../../../../apps/app/src/domains/workspace/api/workspace.schemas';
import type { ApiSchema, ApiSuccess, paths } from '../../../api/contracts';

type WorkspaceWireInput = z.input<typeof workspaceSchema>;
type WorkspaceMemberInferred = z.infer<typeof workspaceMemberSchema>;

type WorkspaceMembersResponse =
  paths['/v1/workspaces/{workspaceId}/members']['get']['responses'][200]['content']['application/json'];
type SearchWorkspaceMembersResponse =
  paths['/v1/workspaces/{workspaceId}/members/search']['get']['responses'][200]['content']['application/json'];
type AddWorkspaceMemberResponse =
  paths['/v1/workspaces/{workspaceId}/members']['post']['responses'][201]['content']['application/json'];
type UpdateWorkspaceMemberResponse =
  paths['/v1/workspaces/{workspaceId}/members/{memberId}']['patch']['responses'][200]['content']['application/json'];
type RemoveWorkspaceMemberResponse =
  paths['/v1/workspaces/{workspaceId}/members/{memberId}']['delete']['responses'][200]['content']['application/json'];
type LastActiveWorkspaceResponse =
  paths['/v1/me/workspaces/last-active']['get']['responses'][200]['content']['application/json'];
type ListWorkspacesResponse =
  paths['/v1/me/workspaces']['get']['responses'][200]['content']['application/json'];
type CreateWorkspaceResponse =
  paths['/v1/workspaces']['post']['responses'][201]['content']['application/json'];
type WorkspaceDetailResponse =
  paths['/v1/workspaces/{workspaceId}']['get']['responses'][200]['content']['application/json'];
type UpdateWorkspaceResponse =
  paths['/v1/workspaces/{workspaceId}']['patch']['responses'][200]['content']['application/json'];

describe('workspace contract', () => {
  it('workspaceSchema accepts WorkspaceResponseDto payloads', () => {
    // Asserted against the schema input because the nullable -> undefined
    // transforms materialise `description` as a required output key; the wire
    // payload the contract describes is the input side, and it must parse.
    expectTypeOf<ApiSchema<'WorkspaceResponseDto'>>().toExtend<WorkspaceWireInput>();
  });

  it('workspaceMemberSchema matches WorkspaceMemberResponseDto', () => {
    expectTypeOf<WorkspaceMemberInferred>()
      .toEqualTypeOf<ApiSchema<'WorkspaceMemberResponseDto'>>();
    expectTypeOf<ApiSchema<'WorkspaceMemberResponseDto'>>()
      .toEqualTypeOf<WorkspaceMemberInferred>();
  });

  it('member list and search resolve to WorkspaceMemberResponseDto arrays', () => {
    expectTypeOf<WorkspaceMembersResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspaceMemberResponseDto'>[]>();
    expectTypeOf<SearchWorkspaceMembersResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspaceMemberResponseDto'>[]>();
  });

  it('member mutations resolve to WorkspaceMemberResponseDto', () => {
    expectTypeOf<AddWorkspaceMemberResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspaceMemberResponseDto'>>();
    expectTypeOf<UpdateWorkspaceMemberResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspaceMemberResponseDto'>>();
    expectTypeOf<RemoveWorkspaceMemberResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspaceMemberResponseDto'>>();
  });

  it('last-active workspace resolves to WorkspaceResponseDto', () => {
    expectTypeOf<LastActiveWorkspaceResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspaceResponseDto'>>();
  });

  it('workspace list, create, get, and update resolve to WorkspaceResponseDto', () => {
    expectTypeOf<ListWorkspacesResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspaceResponseDto'>[]>();
    expectTypeOf<CreateWorkspaceResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspaceResponseDto'>>();
    expectTypeOf<WorkspaceDetailResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspaceResponseDto'>>();
    expectTypeOf<UpdateWorkspaceResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspaceResponseDto'>>();
  });

  it('workspace delete resolves to a 204 without a JSON body', () => {
    type DeleteWorkspaceResponse =
      paths['/v1/workspaces/{workspaceId}']['delete']['responses'][204];

    expectTypeOf<DeleteWorkspaceResponse['content']>().toEqualTypeOf<undefined>();
    expectTypeOf<
      ApiSuccess<'/v1/workspaces/{workspaceId}', 'delete', 204>
    >().toEqualTypeOf<never>();
  });
});
