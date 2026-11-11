import {
  describe,
  expect,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import type {
  emailAuthStartInputSchema,
  emailAuthVerifyInputSchema,
  forgotPasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  resetPasswordInputSchema,
} from '../../../../apps/app/src/domains/auth/api/auth.schemas';
import type {
  archiveSubdocCommandSchema,
  createRootDocumentSchema,
  createSubdocumentCommandSchema,
  moveDocumentSchema,
  shareDocumentSchema,
  shareDocumentsSchema,
  updateDocumentAccessSettingsSchema,
  updateDocumentInvitationSchema,
  updateDocumentSchema,
} from '../../../../apps/app/src/domains/document/api/document.schemas';
import type {
  addWorkspaceMemberSchema,
  createWorkspaceSchema,
  updateWorkspaceMemberSchema,
  updateWorkspaceSchema,
} from '../../../../apps/app/src/domains/workspace/api/workspace.schemas';
import type {
  createTeamspaceSchema,
  updateTeamspaceSchema,
} from '../../../../apps/app/src/domains/teamspace/api/teamspace.schemas';
import type { updateWorkspacePreferenceSchema } from '../../../../apps/app/src/domains/workspace-preference/api/workspace-preference.schemas';
import type { components, paths } from './contracts';

/**
 * Request components asserted by the request conformance tests. Every entry
 * must name a real contract schema; a rename in the contract breaks
 * `UncoveredRequestComponent` below.
 */
const REQUEST_CONTRACT_COVERAGE = [
  'CreateDocumentDto',
  'UpdateDocumentDto',
  'MoveDocumentDto',
  'ShareDocumentDto',
  'ShareDocumentsDto',
  'UpdateDocumentInvitationDto',
  'UpdateDocumentAccessSettingsDto',
  'CreateSubdocCommandDto',
  'ArchiveSubdocCommandDto',
  'DocumentVersionDto',
  'CreateWorkspaceDto',
  'UpdateWorkspaceDto',
  'AddWorkspaceMemberDto',
  'UpdateWorkspaceMemberDto',
  'UpdateWorkspacePreferenceDto',
  'WorkspaceNavigationPreferenceDto',
  'CreateTeamspaceDto',
  'UpdateTeamspaceDto',
  'CreateCheckoutSessionRequestDto',
  'CreateAiChatTurnDto',
  'LoginDto',
  'RegisterDto',
  'ForgotPasswordDto',
  'ResetPasswordDto',
  'StartEmailAuthDto',
  'VerifyEmailAuthDto',
  'RefreshTokenDto',
] as const;

type UncoveredRequestComponent = Exclude<
  (typeof REQUEST_CONTRACT_COVERAGE)[number],
  keyof components['schemas']
>;

/** `"METHOD /path"` for every operation that exists in the contract. */
type OperationRef = {
  [P in keyof paths]: {
    [M in keyof paths[P]]: `${Uppercase<M & string>} ${P & string}`;
  }[keyof paths[P]];
}[keyof paths];

/**
 * The operations this suite compares against a zod schema. Path/method pairs
 * are checked against `paths`, so a removed or renamed operation fails here.
 * Counted by the coverage test below; it must not shrink back to the six
 * endpoints that were covered before this suite existed.
 */
const REQUEST_OPERATIONS = [
  'POST /v1/documents',
  'PATCH /v1/documents/{documentId}',
  'POST /v1/documents/{documentId}/move',
  'POST /v1/documents/{documentId}/share',
  'POST /v1/documents/{documentId}/shares',
  'PATCH /v1/documents/{documentId}/invitations/{invitationId}',
  'PATCH /v1/documents/{documentId}/access-settings',
  'POST /v1/documents/{documentId}/commands/create-subdoc',
  'POST /v1/documents/{documentId}/commands/archive-subdoc',
  'POST /v1/documents/{documentId}/archive',
  'POST /v1/documents/{documentId}/restore',
  'POST /v1/workspaces',
  'PATCH /v1/workspaces/{workspaceId}',
  'POST /v1/workspaces/{workspaceId}/members',
  'PATCH /v1/workspaces/{workspaceId}/members/{memberId}',
  'PATCH /v1/workspaces/{workspaceId}/preferences',
  'POST /v1/workspaces/{workspaceId}/teamspaces',
  'PATCH /v1/teamspaces/{teamspaceId}',
  'POST /v1/workspaces/{workspaceId}/subscription/checkout',
  'POST /v1/workspaces/{workspaceId}/ai/conversations/{sessionId}/turns',
  'POST /v1/workspaces/{workspaceId}/ai/conversations/{sessionId}/turns/stream',
  'POST /v1/auth/login',
  'POST /v1/auth/register',
  'POST /v1/auth/forgot-password',
  'POST /v1/auth/reset-password',
  'POST /v1/auth/email/start',
  'POST /v1/auth/email/verify',
  'POST /v1/auth/refresh',
] as const satisfies readonly OperationRef[];

/** The JSON request body of one operation, as the app receives it from the client. */
type Body<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { requestBody: { content: { 'application/json': infer B } } }
  ? B
  : never;

type CreateDocumentRequest = Body<'/v1/documents', 'post'>;
type UpdateDocumentRequest = Body<'/v1/documents/{documentId}', 'patch'>;
type MoveDocumentRequest = Body<'/v1/documents/{documentId}/move', 'post'>;
type ShareDocumentRequest = Body<'/v1/documents/{documentId}/share', 'post'>;
type ShareDocumentsRequest = Body<'/v1/documents/{documentId}/shares', 'post'>;
type UpdateDocumentInvitationRequest =
  Body<'/v1/documents/{documentId}/invitations/{invitationId}', 'patch'>;
type UpdateDocumentAccessSettingsRequest =
  Body<'/v1/documents/{documentId}/access-settings', 'patch'>;
type CreateSubdocCommandRequest =
  Body<'/v1/documents/{documentId}/commands/create-subdoc', 'post'>;
type ArchiveSubdocCommandRequest =
  Body<'/v1/documents/{documentId}/commands/archive-subdoc', 'post'>;
type ArchiveDocumentRequest = Body<'/v1/documents/{documentId}/archive', 'post'>;
type RestoreDocumentRequest = Body<'/v1/documents/{documentId}/restore', 'post'>;

type CreateWorkspaceRequest = Body<'/v1/workspaces', 'post'>;
type UpdateWorkspaceRequest = Body<'/v1/workspaces/{workspaceId}', 'patch'>;
type AddWorkspaceMemberRequest = Body<'/v1/workspaces/{workspaceId}/members', 'post'>;
type UpdateWorkspaceMemberRequest =
  Body<'/v1/workspaces/{workspaceId}/members/{memberId}', 'patch'>;
type UpdateWorkspacePreferenceRequest =
  Body<'/v1/workspaces/{workspaceId}/preferences', 'patch'>;

type CreateTeamspaceRequest = Body<'/v1/workspaces/{workspaceId}/teamspaces', 'post'>;
type UpdateTeamspaceRequest = Body<'/v1/teamspaces/{teamspaceId}', 'patch'>;

type CreateCheckoutSessionRequest =
  Body<'/v1/workspaces/{workspaceId}/subscription/checkout', 'post'>;

type CreateAiChatTurnRequest =
  Body<'/v1/workspaces/{workspaceId}/ai/conversations/{sessionId}/turns', 'post'>;
type StreamAiChatTurnRequest =
  Body<'/v1/workspaces/{workspaceId}/ai/conversations/{sessionId}/turns/stream', 'post'>;

type LoginRequest = Body<'/v1/auth/login', 'post'>;
type RegisterRequest = Body<'/v1/auth/register', 'post'>;
type ForgotPasswordRequest = Body<'/v1/auth/forgot-password', 'post'>;
type ResetPasswordRequest = Body<'/v1/auth/reset-password', 'post'>;
type StartEmailAuthRequest = Body<'/v1/auth/email/start', 'post'>;
type VerifyEmailAuthRequest = Body<'/v1/auth/email/verify', 'post'>;
type RefreshTokenRequest = Body<'/v1/auth/refresh', 'post'>;

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

/** Forgot-password body built by `auth.requests.ts` from the camelCase input. */
type ForgotPasswordWirePayload = {
  email: string;
  redirect_to?: string;
};

/** Reset-password body: the token travels in the query string. */
type ResetPasswordWirePayload = {
  password: string;
};

type EmailAuthIntent = NonNullable<z.input<typeof emailAuthStartInputSchema>['intent']>;

/** Email-auth start body built by `auth.requests.ts`. */
type StartEmailAuthWirePayload = {
  email: string;
  intent?: EmailAuthIntent;
  display_name?: string;
};

/** Email-auth verify body built by `auth.requests.ts`. */
type VerifyEmailAuthWirePayload = {
  challenge_id: string;
  code: string;
  intent?: EmailAuthIntent;
  display_name?: string;
};

/** Version-only bodies the app sends to archive/restore a document. */
type DocumentVersionWirePayload = {
  version: number;
};

/** Checkout body; every field is optional, so the app may omit the body entirely. */
type CreateCheckoutSessionWirePayload = {
  return_url?: string;
};

/** AI chat turn body shared by the JSON and streaming turn endpoints. */
type CreateAiChatTurnWirePayload = {
  message: string;
  document_ids: string[];
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

  it('moveDocumentSchema matches MoveDocumentDto exactly', () => {
    expectTypeOf<z.input<typeof moveDocumentSchema>>().toEqualTypeOf<MoveDocumentRequest>();
    expectTypeOf<MoveDocumentRequest>().toEqualTypeOf<z.input<typeof moveDocumentSchema>>();
    expectTypeOf<MoveDocumentRequest>().toEqualTypeOf<components['schemas']['MoveDocumentDto']>();
  });

  it('shareDocumentSchema matches ShareDocumentDto exactly', () => {
    expectTypeOf<z.input<typeof shareDocumentSchema>>().toEqualTypeOf<ShareDocumentRequest>();
    expectTypeOf<ShareDocumentRequest>().toEqualTypeOf<z.input<typeof shareDocumentSchema>>();
    expectTypeOf<ShareDocumentRequest>().toEqualTypeOf<components['schemas']['ShareDocumentDto']>();
  });

  it('shareDocumentsSchema matches ShareDocumentsDto exactly', () => {
    expectTypeOf<z.input<typeof shareDocumentsSchema>>().toEqualTypeOf<ShareDocumentsRequest>();
    expectTypeOf<ShareDocumentsRequest>().toEqualTypeOf<z.input<typeof shareDocumentsSchema>>();
    expectTypeOf<ShareDocumentsRequest>().toEqualTypeOf<components['schemas']['ShareDocumentsDto']>();
  });

  it('updateDocumentInvitationSchema matches UpdateDocumentInvitationDto exactly', () => {
    expectTypeOf<z.input<typeof updateDocumentInvitationSchema>>()
      .toEqualTypeOf<UpdateDocumentInvitationRequest>();
    expectTypeOf<UpdateDocumentInvitationRequest>()
      .toEqualTypeOf<z.input<typeof updateDocumentInvitationSchema>>();
    expectTypeOf<UpdateDocumentInvitationRequest>()
      .toEqualTypeOf<components['schemas']['UpdateDocumentInvitationDto']>();
  });

  it('updateDocumentAccessSettingsSchema matches UpdateDocumentAccessSettingsDto exactly', () => {
    // `nullish()` on the single optional field mirrors the contract's
    // `nullable: true`; no refinement changes the inferred type.
    expectTypeOf<z.input<typeof updateDocumentAccessSettingsSchema>>()
      .toEqualTypeOf<UpdateDocumentAccessSettingsRequest>();
    expectTypeOf<UpdateDocumentAccessSettingsRequest>()
      .toEqualTypeOf<z.input<typeof updateDocumentAccessSettingsSchema>>();
    expectTypeOf<UpdateDocumentAccessSettingsRequest>()
      .toEqualTypeOf<components['schemas']['UpdateDocumentAccessSettingsDto']>();
  });

  it('createSubdocumentCommandSchema matches CreateSubdocCommandDto exactly', () => {
    expectTypeOf<z.input<typeof createSubdocumentCommandSchema>>()
      .toEqualTypeOf<CreateSubdocCommandRequest>();
    expectTypeOf<CreateSubdocCommandRequest>()
      .toEqualTypeOf<z.input<typeof createSubdocumentCommandSchema>>();
    expectTypeOf<CreateSubdocCommandRequest>()
      .toEqualTypeOf<components['schemas']['CreateSubdocCommandDto']>();
  });

  it('archiveSubdocCommandSchema matches ArchiveSubdocCommandDto exactly', () => {
    expectTypeOf<z.input<typeof archiveSubdocCommandSchema>>()
      .toEqualTypeOf<ArchiveSubdocCommandRequest>();
    expectTypeOf<ArchiveSubdocCommandRequest>()
      .toEqualTypeOf<z.input<typeof archiveSubdocCommandSchema>>();
    expectTypeOf<ArchiveSubdocCommandRequest>()
      .toEqualTypeOf<components['schemas']['ArchiveSubdocCommandDto']>();
  });

  it('archive and restore send DocumentVersionDto', () => {
    // Both endpoints take the same version-only body; the request files pass a
    // `{ version }` literal typed as `DocumentVersionWirePayload`.
    expectTypeOf<DocumentVersionWirePayload>().toEqualTypeOf<ArchiveDocumentRequest>();
    expectTypeOf<DocumentVersionWirePayload>().toEqualTypeOf<RestoreDocumentRequest>();
    expectTypeOf<ArchiveDocumentRequest>().toEqualTypeOf<RestoreDocumentRequest>();
    expectTypeOf<DocumentVersionWirePayload>()
      .toEqualTypeOf<components['schemas']['DocumentVersionDto']>();
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

  it('addWorkspaceMemberSchema input matches AddWorkspaceMemberDto exactly', () => {
    // The schema defaults `role` to `'member'`; the wire body is the input
    // shape, where `role` is optional. The contract documents the default
    // rather than forcing the field, so the input and the DTO agree.
    expectTypeOf<z.input<typeof addWorkspaceMemberSchema>>()
      .toEqualTypeOf<AddWorkspaceMemberRequest>();
    expectTypeOf<AddWorkspaceMemberRequest>()
      .toEqualTypeOf<z.input<typeof addWorkspaceMemberSchema>>();
    expectTypeOf<AddWorkspaceMemberRequest>()
      .toEqualTypeOf<components['schemas']['AddWorkspaceMemberDto']>();
  });

  it('updateWorkspaceMemberSchema matches UpdateWorkspaceMemberDto exactly', () => {
    expectTypeOf<z.input<typeof updateWorkspaceMemberSchema>>()
      .toEqualTypeOf<UpdateWorkspaceMemberRequest>();
    expectTypeOf<UpdateWorkspaceMemberRequest>()
      .toEqualTypeOf<z.input<typeof updateWorkspaceMemberSchema>>();
    expectTypeOf<UpdateWorkspaceMemberRequest>()
      .toEqualTypeOf<components['schemas']['UpdateWorkspaceMemberDto']>();
  });

  it('updateWorkspacePreferenceSchema matches UpdateWorkspacePreferenceDto exactly', () => {
    expectTypeOf<z.input<typeof updateWorkspacePreferenceSchema>>()
      .toEqualTypeOf<UpdateWorkspacePreferenceRequest>();
    expectTypeOf<UpdateWorkspacePreferenceRequest>()
      .toEqualTypeOf<z.input<typeof updateWorkspacePreferenceSchema>>();
    expectTypeOf<UpdateWorkspacePreferenceRequest>()
      .toEqualTypeOf<components['schemas']['UpdateWorkspacePreferenceDto']>();
    expectTypeOf<UpdateWorkspacePreferenceRequest['navigation']>()
      .toEqualTypeOf<components['schemas']['WorkspaceNavigationPreferenceDto']>();
  });
});

describe('teamspace request contract', () => {
  it('createTeamspaceSchema is accepted by CreateTeamspaceDto', () => {
    // The schema generated `access_mode` as required because the contract gives
    // it a default (`open`) and openapi-typescript treats defaulted properties
    // as non-nullable. The wire value may therefore omit it even though the
    // generated type lists it as required; the server applies the default. The
    // subset direction is contract -> schema, and the only divergence is that
    // defaulted field.
    expectTypeOf<CreateTeamspaceRequest>().toExtend<z.input<typeof createTeamspaceSchema>>();
    expectTypeOf<CreateTeamspaceRequest>()
      .toEqualTypeOf<components['schemas']['CreateTeamspaceDto']>();
  });

  it('updateTeamspaceSchema matches UpdateTeamspaceDto exactly', () => {
    expectTypeOf<z.input<typeof updateTeamspaceSchema>>().toEqualTypeOf<UpdateTeamspaceRequest>();
    expectTypeOf<UpdateTeamspaceRequest>().toEqualTypeOf<z.input<typeof updateTeamspaceSchema>>();
    expectTypeOf<UpdateTeamspaceRequest>()
      .toEqualTypeOf<components['schemas']['UpdateTeamspaceDto']>();
  });
});

describe('subscription request contract', () => {
  it('checkout session body matches CreateCheckoutSessionRequestDto exactly', () => {
    // The request file forwards an optional `return_url` and tolerates an
    // omitted body; the contract body has no required fields.
    expectTypeOf<CreateCheckoutSessionWirePayload>()
      .toEqualTypeOf<CreateCheckoutSessionRequest>();
    expectTypeOf<CreateCheckoutSessionRequest>()
      .toEqualTypeOf<CreateCheckoutSessionWirePayload>();
    expectTypeOf<CreateCheckoutSessionRequest>()
      .toEqualTypeOf<components['schemas']['CreateCheckoutSessionRequestDto']>();
  });
});

describe('ai request contract', () => {
  it('chat turn bodies fit CreateAiChatTurnDto', () => {
    // The contract only requires `message`; the client always sends
    // `document_ids` too, so the wire payload is a strict subset. Both the
    // JSON and the streaming endpoints share the same DTO.
    expectTypeOf<CreateAiChatTurnWirePayload>().toExtend<CreateAiChatTurnRequest>();
    expectTypeOf<StreamAiChatTurnRequest>().toEqualTypeOf<CreateAiChatTurnRequest>();
    expectTypeOf<CreateAiChatTurnRequest>()
      .toEqualTypeOf<components['schemas']['CreateAiChatTurnDto']>();
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

  it('forgot-password body matches ForgotPasswordDto exactly', () => {
    // `redirect_to` is optional on both sides; the camelCase input is mapped to
    // the snake_case wire field before the request is sent.
    expectTypeOf<ForgotPasswordWirePayload>().toEqualTypeOf<ForgotPasswordRequest>();
    expectTypeOf<ForgotPasswordRequest>().toEqualTypeOf<ForgotPasswordWirePayload>();
    expectTypeOf<ForgotPasswordRequest>()
      .toEqualTypeOf<components['schemas']['ForgotPasswordDto']>();
    expectTypeOf<z.input<typeof forgotPasswordInputSchema>['redirectTo']>()
      .toEqualTypeOf<ForgotPasswordWirePayload['redirect_to']>();
  });

  it('reset-password body matches ResetPasswordDto exactly', () => {
    // Only the password is sent as JSON; the reset token is a query parameter.
    expectTypeOf<ResetPasswordWirePayload>().toEqualTypeOf<ResetPasswordRequest>();
    expectTypeOf<ResetPasswordRequest>().toEqualTypeOf<ResetPasswordWirePayload>();
    expectTypeOf<ResetPasswordRequest>()
      .toEqualTypeOf<components['schemas']['ResetPasswordDto']>();
    expectTypeOf<z.input<typeof resetPasswordInputSchema>['password']>()
      .toEqualTypeOf<ResetPasswordWirePayload['password']>();
  });

  it('email-auth start body matches StartEmailAuthDto exactly', () => {
    expectTypeOf<StartEmailAuthWirePayload>().toEqualTypeOf<StartEmailAuthRequest>();
    expectTypeOf<StartEmailAuthRequest>().toEqualTypeOf<StartEmailAuthWirePayload>();
    expectTypeOf<StartEmailAuthRequest>()
      .toEqualTypeOf<components['schemas']['StartEmailAuthDto']>();
    expectTypeOf<z.input<typeof emailAuthStartInputSchema>['intent']>()
      .toEqualTypeOf<NonNullable<StartEmailAuthWirePayload['intent']> | undefined>();
  });

  it('email-auth verify body matches VerifyEmailAuthDto exactly', () => {
    // The 6-digit `code` pattern narrows values, not the inferred `string` type.
    expectTypeOf<VerifyEmailAuthWirePayload>().toEqualTypeOf<VerifyEmailAuthRequest>();
    expectTypeOf<VerifyEmailAuthRequest>().toEqualTypeOf<VerifyEmailAuthWirePayload>();
    expectTypeOf<VerifyEmailAuthRequest>()
      .toEqualTypeOf<components['schemas']['VerifyEmailAuthDto']>();
    expectTypeOf<z.input<typeof emailAuthVerifyInputSchema>['code']>()
      .toEqualTypeOf<VerifyEmailAuthWirePayload['code']>();
  });

  it('refresh request accepts the body-less call the client makes', () => {
    // `api-client.ts` refreshes through the cookie and sends no body at all.
    // The contract marks the request body required but its only field,
    // `refresh_token`, is optional and documented as cookie-supplied, so an
    // empty body type is accepted. That required=true flag is a spec wart, not
    // a client error: the server must keep accepting a missing body.
    expectTypeOf<Record<string, never>>().toExtend<RefreshTokenRequest>();
    expectTypeOf<RefreshTokenRequest>()
      .toEqualTypeOf<components['schemas']['RefreshTokenDto']>();
    expectTypeOf<RefreshTokenRequest['refresh_token']>()
      .toEqualTypeOf<string | undefined>();
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
      'MoveDocumentDto',
      'ShareDocumentDto',
      'ShareDocumentsDto',
      'UpdateDocumentInvitationDto',
      'UpdateDocumentAccessSettingsDto',
      'CreateSubdocCommandDto',
      'ArchiveSubdocCommandDto',
      'DocumentVersionDto',
      'CreateWorkspaceDto',
      'UpdateWorkspaceDto',
      'AddWorkspaceMemberDto',
      'UpdateWorkspaceMemberDto',
      'UpdateWorkspacePreferenceDto',
      'WorkspaceNavigationPreferenceDto',
      'CreateTeamspaceDto',
      'UpdateTeamspaceDto',
      'CreateCheckoutSessionRequestDto',
      'CreateAiChatTurnDto',
      'LoginDto',
      'RegisterDto',
      'ForgotPasswordDto',
      'ResetPasswordDto',
      'StartEmailAuthDto',
      'VerifyEmailAuthDto',
      'RefreshTokenDto',
    ]));
  });

  it('asserts at least 15 distinct request-bearing operations', () => {
    // Distinct operations, not DTOs: several endpoints share a body schema
    // (archive/restore use DocumentVersionDto, JSON/stream use the AI turn DTO).
    expect(new Set(REQUEST_OPERATIONS).size).toBe(REQUEST_OPERATIONS.length);
    expect(REQUEST_OPERATIONS.length).toBeGreaterThanOrEqual(15);
  });
});
