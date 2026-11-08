import {
  describe,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import type { workspacePreferenceSchema } from '../../../../../../apps/app/src/domains/workspace-preference/api/workspace-preference.schemas';
import type { ApiSchema, paths } from '../../../api/contracts';

type WorkspacePreferenceInferred = z.infer<typeof workspacePreferenceSchema>;

type GetWorkspacePreferencesResponse =
  paths['/v1/workspaces/{workspaceId}/preferences']['get']['responses'][200]['content']['application/json'];
type UpdateWorkspacePreferencesResponse =
  paths['/v1/workspaces/{workspaceId}/preferences']['patch']['responses'][200]['content']['application/json'];

describe('workspace preference contract', () => {
  it('workspacePreferenceSchema matches WorkspacePreferenceResponseDto', () => {
    expectTypeOf<WorkspacePreferenceInferred>()
      .toEqualTypeOf<ApiSchema<'WorkspacePreferenceResponseDto'>>();
    expectTypeOf<ApiSchema<'WorkspacePreferenceResponseDto'>>()
      .toEqualTypeOf<WorkspacePreferenceInferred>();
  });

  it('workspacePreferenceSchema navigation matches WorkspaceNavigationPreferenceResponseDto', () => {
    expectTypeOf<WorkspacePreferenceInferred['navigation']>()
      .toEqualTypeOf<ApiSchema<'WorkspaceNavigationPreferenceResponseDto'>>();
    expectTypeOf<ApiSchema<'WorkspaceNavigationPreferenceResponseDto'>>()
      .toEqualTypeOf<WorkspacePreferenceInferred['navigation']>();
  });

  it('workspacePreferenceSchema activity matches WorkspaceActivityPreferenceResponseDto', () => {
    // `last_active_at` is nullable in both declarations.
    expectTypeOf<WorkspacePreferenceInferred['activity']>()
      .toEqualTypeOf<ApiSchema<'WorkspaceActivityPreferenceResponseDto'>>();
    expectTypeOf<ApiSchema<'WorkspaceActivityPreferenceResponseDto'>>()
      .toEqualTypeOf<WorkspacePreferenceInferred['activity']>();
  });

  it('preference operations resolve to WorkspacePreferenceResponseDto', () => {
    expectTypeOf<GetWorkspacePreferencesResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspacePreferenceResponseDto'>>();
    expectTypeOf<UpdateWorkspacePreferencesResponse>()
      .toEqualTypeOf<ApiSchema<'WorkspacePreferenceResponseDto'>>();
  });
});
