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
import type { ApiSchema } from '../../../api/contracts';

type WorkspaceWireInput = z.input<typeof workspaceSchema>;
type WorkspaceMemberInferred = z.infer<typeof workspaceMemberSchema>;

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
});
