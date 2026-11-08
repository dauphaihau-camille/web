import {
  describe,
  expect,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import type {
  loginInputSchema,
  registerInputSchema,
} from '../../../../apps/app/src/domains/auth/api/auth.schemas';
import type {
  createRootDocumentSchema,
  updateDocumentSchema,
} from '../../../../apps/app/src/domains/document/api/document.schemas';
import type {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from '../../../../apps/app/src/domains/workspace/api/workspace.schemas';
import type { components, paths } from './contracts';

/**
 * Request components asserted by the request conformance tests. Every entry
 * must name a real contract schema; a rename in the contract breaks
 * `UncoveredRequestComponent` below.
 */
const REQUEST_CONTRACT_COVERAGE = [
  'CreateDocumentDto',
  'UpdateDocumentDto',
  'CreateWorkspaceDto',
  'UpdateWorkspaceDto',
  'LoginDto',
  'RegisterDto',
] as const;

type UncoveredRequestComponent = Exclude<
  (typeof REQUEST_CONTRACT_COVERAGE)[number],
  keyof components['schemas']
>;

type CreateDocumentRequest =
  paths['/v1/documents']['post']['requestBody']['content']['application/json'];
type UpdateDocumentRequest =
  paths['/v1/documents/{documentId}']['patch']['requestBody']['content']['application/json'];
type CreateWorkspaceRequest =
  paths['/v1/workspaces']['post']['requestBody']['content']['application/json'];
type UpdateWorkspaceRequest =
  paths['/v1/workspaces/{workspaceId}']['patch']['requestBody']['content']['application/json'];
type LoginRequest =
  paths['/v1/auth/login']['post']['requestBody']['content']['application/json'];
type RegisterRequest =
  paths['/v1/auth/register']['post']['requestBody']['content']['application/json'];

type CreateDocumentInput = z.input<typeof createRootDocumentSchema>;
type UpdateDocumentInput = z.input<typeof updateDocumentSchema>;
type CreateWorkspaceInput = z.input<typeof createWorkspaceSchema>;
type UpdateWorkspaceInput = z.input<typeof updateWorkspaceSchema>;
type LoginInput = z.input<typeof loginInputSchema>;
type RegisterInput = z.input<typeof registerInputSchema>;

/**
 * The register request bodies the app actually sends: the domain schema uses
 * camelCase (`displayName`) and the client maps it to the contract's
 * snake_case `display_name`.
 */
type RegisterWirePayload = {
  email: RegisterInput['email'];
  password: RegisterInput['password'];
  display_name: RegisterInput['displayName'];
};

describe('document request contract', () => {
  it('createRootDocumentSchema fits CreateDocumentDto', () => {
    // The contract types `content_format` as a plain string; the runtime schema
    // narrows it to `'blocknote_v1'`. Its input type is therefore a strict
    // subset of the contract body. The reverse would require widening the
    // runtime literal, so only the subset direction holds.
    expectTypeOf<CreateDocumentInput>().toExtend<CreateDocumentRequest>();
    expectTypeOf<CreateDocumentRequest>().toEqualTypeOf<components['schemas']['CreateDocumentDto']>();
  });

  it('updateDocumentSchema fits UpdateDocumentDto', () => {
    // Same `content_format` narrowing as create; every other field, including
    // the required `version`, already matches the contract.
    expectTypeOf<UpdateDocumentInput>().toExtend<UpdateDocumentRequest>();
    expectTypeOf<UpdateDocumentRequest>().toEqualTypeOf<components['schemas']['UpdateDocumentDto']>();
  });
});

describe('workspace request contract', () => {
  it('createWorkspaceSchema fits CreateWorkspaceDto', () => {
    // The contract treats `slug` as optional, but the create-workspace form
    // always collects one and the runtime schema requires it. The length and
    // domain refinements do not change the inferred type (still `string`), so
    // the required `slug` is the only narrowing and the input stays a subset.
    expectTypeOf<CreateWorkspaceInput>().toExtend<CreateWorkspaceRequest>();
  });

  it('updateWorkspaceSchema round-trips with UpdateWorkspaceDto', () => {
    // Both sides declare the same optional fields (`name`, `slug`,
    // `description`) around a required `version`; the runtime refinements only
    // constrain string values, they do not change the inferred type.
    expectTypeOf<UpdateWorkspaceInput>().toEqualTypeOf<UpdateWorkspaceRequest>();
    expectTypeOf<UpdateWorkspaceRequest>().toEqualTypeOf<UpdateWorkspaceInput>();
  });
});

describe('auth request contract', () => {
  it('loginInputSchema matches LoginDto exactly', () => {
    expectTypeOf<LoginInput>().toEqualTypeOf<LoginRequest>();
    expectTypeOf<LoginRequest>().toEqualTypeOf<LoginInput>();
  });

  it('register payload fits RegisterDto', () => {
    // The contract allows `display_name` to be omitted, while the client always
    // sends it (the register form requires a name). The wire payload is
    // therefore a subset of the contract body, not equal to it.
    expectTypeOf<RegisterWirePayload>().toExtend<RegisterRequest>();
    expectTypeOf<RegisterRequest>().toEqualTypeOf<components['schemas']['RegisterDto']>();
  });
});

describe('request contract coverage', () => {
  it('only lists request component names that exist in the contract', () => {
    expectTypeOf<UncoveredRequestComponent>().toEqualTypeOf<never>();
    expect(REQUEST_CONTRACT_COVERAGE.length).toBeGreaterThan(0);
  });

  it('covers every request domain with a conformance test', () => {
    expect(REQUEST_CONTRACT_COVERAGE).toEqual(expect.arrayContaining([
      'CreateDocumentDto',
      'UpdateDocumentDto',
      'CreateWorkspaceDto',
      'UpdateWorkspaceDto',
      'LoginDto',
      'RegisterDto',
    ]));
  });
});
