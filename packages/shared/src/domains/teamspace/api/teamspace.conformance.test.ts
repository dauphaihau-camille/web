import {
  describe,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import type {
  teamspaceAccessModeSchema,
  teamspaceSchema,
} from '../../../../../../apps/app/src/domains/teamspace/api/teamspace.schemas';
import type { ApiSchema, paths } from '../../../api/contracts';

type TeamspaceInferred = z.infer<typeof teamspaceSchema>;
type TeamspaceAccessModeInferred = z.infer<typeof teamspaceAccessModeSchema>;

type TeamspaceListResponse =
  paths['/v1/workspaces/{workspaceId}/teamspaces']['get']['responses'][200]['content']['application/json'];
type CreateTeamspaceResponse =
  paths['/v1/workspaces/{workspaceId}/teamspaces']['post']['responses'][201]['content']['application/json'];
type UpdateTeamspaceResponse =
  paths['/v1/teamspaces/{teamspaceId}']['patch']['responses'][200]['content']['application/json'];

describe('teamspace contract', () => {
  it('teamspaceSchema is assignable to TeamspaceResponseDto', () => {
    // The runtime schema requires the `description` key (nullable on the wire,
    // normalised to `string | undefined`) while the contract declares it
    // optional. That makes the schema output a superset of the contract shape,
    // so only the schema -> contract direction is true; widening the contract
    // or loosening the transform would be required for mutual equality.
    expectTypeOf<TeamspaceInferred>()
      .toExtend<ApiSchema<'TeamspaceResponseDto'>>();
  });

  it('teamspaceAccessModeSchema matches the contract access_mode enum', () => {
    // `access_mode` is inlined into TeamspaceResponseDto rather than being a
    // standalone component; asserting the property still fails typecheck if
    // the contract widens the enum.
    expectTypeOf<TeamspaceAccessModeInferred>()
      .toEqualTypeOf<ApiSchema<'TeamspaceResponseDto'>['access_mode']>();
    expectTypeOf<ApiSchema<'TeamspaceResponseDto'>['access_mode']>()
      .toEqualTypeOf<TeamspaceAccessModeInferred>();
  });

  it('teamspace operations resolve to TeamspaceResponseDto', () => {
    expectTypeOf<TeamspaceListResponse>()
      .toEqualTypeOf<ApiSchema<'TeamspaceResponseDto'>[]>();
    expectTypeOf<CreateTeamspaceResponse>()
      .toEqualTypeOf<ApiSchema<'TeamspaceResponseDto'>>();
    expectTypeOf<UpdateTeamspaceResponse>()
      .toEqualTypeOf<ApiSchema<'TeamspaceResponseDto'>>();
  });
});
