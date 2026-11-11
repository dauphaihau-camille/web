import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import {
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import type { components } from './contracts';

/**
 * Component reachability conformance.
 *
 * The generated `openapi.d.ts` only proves that the components the app imports
 * still exist; it says nothing about the components the app never touches. This
 * test walks the *published* spec from the API repo and makes every component
 * reachable from a `/v1` operation explicit:
 *
 * - `REACHABILITY_COVERAGE` lists components whose shape a conformance test
 *   asserts (response DTOs in the per-domain suites, request DTOs here).
 * - `COMPONENT_EXCEPTIONS` lists reachable components that are accepted without
 *   an assertion, each with a one-line reason.
 *
 * A component in neither list fails with its name, so upstream additions cannot
 * silently widen the long tail.
 */

const SCHEMA_REF_PREFIX = '#/components/schemas/';

/**
 * Boundary parse of the published spec: only the two sections the reachability
 * walk reads, with everything below kept as unparsed JSON to be traversed.
 */
const openApiSpecSchema = z.object({
  paths: z.record(z.string(), z.unknown()),
  components: z.object({
    schemas: z.record(z.string(), z.unknown()),
  }),
});

const require = createRequire(import.meta.url);
const specPath = require.resolve('@dauphaihau-camille/api-spec/openapi.json');
const spec = openApiSpecSchema.parse(
  JSON.parse(readFileSync(specPath, 'utf8')) as unknown,
);

/**
 * Response and request components asserted by name somewhere in the
 * conformance suites (`contracts.test.ts`, `contracts.request.test.ts`, and the
 * per-domain `*.conformance.test.ts` files).
 */
const REACHABILITY_COVERAGE = [
  // ai
  'AiChatTurnResponseDto',
  'AiConversationSessionResponseDto',
  'AiCursorPaginationMetaResponseDto',
  'AiDocumentAttachmentResponseDto',
  'AiPaginationMetaResponseDto',
  'AiResponseBlockDto',
  'AiResponseEntitlementResponseDto',
  'AiResponseInlineContentDto',
  'CreateAiChatTurnDto',
  'CursorPaginatedAiChatTurnResponseDto',
  'PaginatedAiConversationSessionResponseDto',
  // auth
  'AuthResponseDto',
  'ForgotPasswordDto',
  'LoginDto',
  'RefreshTokenDto',
  'RegisterDto',
  'ResetPasswordDto',
  'StartEmailAuthDto',
  'StartEmailAuthResponseDto',
  'UserProfileResponseDto',
  'VerifyEmailAuthDto',
  // documents
  'ArchiveSubdocCommandDto',
  'ArchiveSubdocCommandResponseDto',
  'ArchivedDocumentListItemResponseDto',
  'ArchivedDocumentListPageResponseDto',
  'CreateDocumentDto',
  'CreateSubdocCommandDto',
  'CreateSubdocCommandResponseDto',
  'DocumentAccessResponseDto',
  'DocumentBreadcrumbItemDto',
  'DocumentCollaborationResponseDto',
  'DocumentCollaboratorResponseDto',
  'DocumentCollaboratorUserResponseDto',
  'DocumentInvitationResponseDto',
  'DocumentOwnerUserResponseDto',
  'DocumentResponseDto',
  'DocumentTreeChildResponseDto',
  'DocumentVersionDto',
  'MoveDocumentDto',
  'ShareDocumentDto',
  'ShareDocumentFailureResponseDto',
  'ShareDocumentsDto',
  'ShareDocumentsResponseDto',
  'UpdateDocumentAccessSettingsDto',
  'UpdateDocumentDto',
  'UpdateDocumentInvitationDto',
  // favorites
  'FavoriteDocumentAccessResponseDto',
  'FavoriteDocumentResponseDto',
  'FavoriteStatusResponseDto',
  // search
  'SearchDocumentResponseDto',
  // publish
  'PublicDocumentResponseDto',
  'PublishedDocumentResponseDto',
  // subscriptions
  'CheckoutSessionResponseDto',
  'CreateCheckoutSessionRequestDto',
  'SubscriptionEntitlementsResponseDto',
  'SubscriptionSummaryResponseDto',
  // teamspaces
  'CreateTeamspaceDto',
  'TeamspaceResponseDto',
  'UpdateTeamspaceDto',
  // workspaces
  'AddWorkspaceMemberDto',
  'CreateWorkspaceDto',
  'UpdateWorkspaceDto',
  'UpdateWorkspaceMemberDto',
  'UpdateWorkspacePreferenceDto',
  'WorkspaceActivityPreferenceResponseDto',
  'WorkspaceMemberResponseDto',
  'WorkspaceNavigationPreferenceDto',
  'WorkspaceNavigationPreferenceResponseDto',
  'WorkspacePreferenceResponseDto',
  'WorkspaceResponseDto',
  // pagination shared by ai and admin lists
  'PaginationMetaResponseDto',
] as const satisfies readonly (keyof components['schemas'])[];

/**
 * Reachable components that are accepted without a conformance assertion. Each
 * reason states why the gap is intentional; `satisfies` keeps the names real.
 */
const COMPONENT_EXCEPTIONS = {
  ApiErrorResponseDto:
    'Generic error envelope; the client branches on HTTP status, not on this shape.',
  BillingWebhookResponseDto:
    'Webhook endpoint is called by the billing provider, never by this web app.',
  CreateUserDto:
    'Admin `/v1/users` create endpoint is not called from this web app.',
  DocumentAccessSettingsResponseDto:
    'Parsed by `documentAccessSettingsSchema` but not asserted by a conformance test yet.',
  DocumentNavigationNodeResponseDto:
    'Parsed by `documentNavigationNodeSchema` but not asserted by a conformance test yet.',
  DocumentNavigationPageResponseDto:
    'Parsed by `documentNavigationPageSchema` but not asserted by a conformance test yet.',
  PaginatedUserSummaryResponseDto:
    'Admin `/v1/users` list response; that endpoint is not called from this web app.',
  TeamspaceDocumentNavigationGroupResponseDto:
    'Parsed by `teamspaceDocumentNavigationSchema` but not asserted by a conformance test yet.',
  UpdateUserDto:
    'Admin `/v1/users/{id}` update endpoint is not called from this web app.',
  UserSummaryResponseDto:
    'Nested item of the admin user list; that endpoint is not called from this web app.',
  WorkspaceDefaultDocumentResponseDto:
    'Server-only default-document lookup typed inline in `document.server.requests.ts`.',
  WorkspaceDocumentNavigationResponseDto:
    'Parsed by `workspaceDocumentNavigationSchema` but not asserted by a conformance test yet.',
} as const satisfies Partial<Record<keyof components['schemas'], string>>;

/** Collects every `$ref` string under `node`, including nested arrays/objects. */
function collectRefs(node: unknown, refs: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectRefs(item, refs);
    }

    return;
  }

  if (typeof node !== 'object' || node === null) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref' && typeof value === 'string') {
      refs.add(value);
    }
    else {
      collectRefs(value, refs);
    }
  }
}

/** All `$ref` targets reachable from the path items of `/v1` operations. */
function collectRootRefs(): Set<string> {
  const refs = new Set<string>();

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (path.startsWith('/v1')) {
      collectRefs(pathItem, refs);
    }
  }

  return refs;
}

/** Component names reachable from a `/v1` path item, following nested refs. */
function collectReachableComponents(): string[] {
  const reachable = new Set<string>();
  const queue = [...collectRootRefs()];

  while (queue.length > 0) {
    const ref = queue.pop();

    if (ref === undefined || !ref.startsWith(SCHEMA_REF_PREFIX)) {
      continue;
    }

    const name = ref.slice(SCHEMA_REF_PREFIX.length);

    if (reachable.has(name)) {
      continue;
    }

    reachable.add(name);

    const nested = new Set<string>();
    collectRefs(spec.components.schemas[name], nested);
    queue.push(...nested);
  }

  return [...reachable].sort();
}

const coveredComponents = new Set<string>(REACHABILITY_COVERAGE);
const exceptedComponents = new Set<string>(Object.keys(COMPONENT_EXCEPTIONS));
const reachableComponents = collectReachableComponents();

describe('component reachability', () => {
  it('finds /v1 operations to walk', () => {
    const v1Paths = Object.keys(spec.paths).filter((path) => path.startsWith('/v1'));

    expect(v1Paths.length).toBeGreaterThan(0);
    expect(reachableComponents.length).toBeGreaterThan(0);
  });

  it('resolves every $ref to a schema component', () => {
    const danglingRefs = [...collectRootRefs()].filter(
      (ref) => !ref.startsWith(SCHEMA_REF_PREFIX),
    );

    expect(danglingRefs).toEqual([]);

    const missing = reachableComponents.filter(
      (name) => !(name in spec.components.schemas),
    );
    expect(missing).toEqual([]);
  });

  it('classifies every component reachable from a /v1 operation', () => {
    const unclassified = reachableComponents.filter(
      (name) => !coveredComponents.has(name) && !exceptedComponents.has(name),
    );

    // The names are the assertion: an upstream component that is reachable but
    // neither asserted nor explicitly accepted shows up here.
    expect(unclassified).toEqual([]);
  });

  it('only lists components that exist in the published spec', () => {
    const unknown = [...REACHABILITY_COVERAGE, ...exceptedComponents].filter(
      (name) => !(name in spec.components.schemas),
    );

    expect(unknown).toEqual([]);
  });

  it('never lists a component as both covered and excepted', () => {
    const both = REACHABILITY_COVERAGE.filter((name) => exceptedComponents.has(name));

    expect(both).toEqual([]);
  });

  it('only excepts components that are actually reachable', () => {
    const unreachable = [...exceptedComponents].filter(
      (name) => !reachableComponents.includes(name),
    );

    // An exception for a component nothing references would hide nothing and
    // would go stale silently; drop it instead.
    expect(unreachable).toEqual([]);
  });

  it('gives every exception a reason', () => {
    const blank = Object.entries(COMPONENT_EXCEPTIONS)
      .filter(([, reason]) => reason.trim().length === 0)
      .map(([name]) => name);

    expect(blank).toEqual([]);
  });
});
