import {
  describe,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import type {
  archivedDocumentListItemSchema,
  archivedDocumentListPageSchema,
  documentAccessSchema,
  documentBreadcrumbItemSchema,
  documentCollaborationSchema,
  documentInvitationSchema,
  documentOwnerUserSchema,
  documentSchema,
} from '../../../../../../apps/app/src/domains/document/api/document.schemas';
import type { ApiSchema } from '../../../api/contracts';

type DocumentAccessInferred = z.infer<typeof documentAccessSchema>;
type DocumentCollaborationInferred = z.infer<typeof documentCollaborationSchema>;
type DocumentOwnerUserInferred = z.infer<typeof documentOwnerUserSchema>;
type DocumentBreadcrumbItemInferred = z.infer<typeof documentBreadcrumbItemSchema>;
type DocumentInvitationInferred = z.infer<typeof documentInvitationSchema>;
type ArchivedDocumentListItemInferred = z.infer<typeof archivedDocumentListItemSchema>;
type ArchivedDocumentListPageInferred = z.infer<typeof archivedDocumentListPageSchema>;

describe('document contract', () => {
  it('documentBreadcrumbItemSchema matches DocumentBreadcrumbItemDto', () => {
    expectTypeOf<DocumentBreadcrumbItemInferred>()
      .toEqualTypeOf<ApiSchema<'DocumentBreadcrumbItemDto'>>();
    expectTypeOf<ApiSchema<'DocumentBreadcrumbItemDto'>>()
      .toEqualTypeOf<DocumentBreadcrumbItemInferred>();
  });

  it('documentInvitationSchema matches DocumentInvitationResponseDto', () => {
    expectTypeOf<DocumentInvitationInferred>()
      .toEqualTypeOf<ApiSchema<'DocumentInvitationResponseDto'>>();
    expectTypeOf<ApiSchema<'DocumentInvitationResponseDto'>>()
      .toEqualTypeOf<DocumentInvitationInferred>();
  });

  it('archivedDocumentListItemSchema matches ArchivedDocumentListItemResponseDto', () => {
    expectTypeOf<ArchivedDocumentListItemInferred>()
      .toEqualTypeOf<ApiSchema<'ArchivedDocumentListItemResponseDto'>>();
    expectTypeOf<ApiSchema<'ArchivedDocumentListItemResponseDto'>>()
      .toEqualTypeOf<ArchivedDocumentListItemInferred>();
  });

  it('archivedDocumentListPageSchema matches ArchivedDocumentListPageResponseDto', () => {
    expectTypeOf<ArchivedDocumentListPageInferred>()
      .toEqualTypeOf<ApiSchema<'ArchivedDocumentListPageResponseDto'>>();
    expectTypeOf<ApiSchema<'ArchivedDocumentListPageResponseDto'>>()
      .toEqualTypeOf<ArchivedDocumentListPageInferred>();
  });

  it('documentAccessSchema is narrower than DocumentAccessResponseDto', () => {
    // The contract only types scope/permission as strings; the runtime schema
    // narrows them to the enums the API actually emits. One direction is the
    // strongest true statement until the contract declares those enums.
    expectTypeOf<DocumentAccessInferred>()
      .toExtend<ApiSchema<'DocumentAccessResponseDto'>>();
  });

  it('documentCollaborationSchema is narrower than DocumentCollaborationResponseDto', () => {
    // Same reason as access: the contract declares `mode` as a plain string,
    // while the runtime schema knows the only two valid modes.
    expectTypeOf<DocumentCollaborationInferred>()
      .toExtend<ApiSchema<'DocumentCollaborationResponseDto'>>();
  });

  it('documentOwnerUserSchema tolerates the optional avatar the contract omits', () => {
    // DocumentOwnerUserResponseDto does not declare `avatar`, but the runtime
    // schema accepts it so owner payloads carrying one still parse. The
    // contract shape therefore extends the (wider) zod shape one way only.
    expectTypeOf<ApiSchema<'DocumentOwnerUserResponseDto'>>()
      .toExtend<DocumentOwnerUserInferred>();
  });

  it('documentSchema narrows content_format to the contract literal', () => {
    expectTypeOf<ApiSchema<'DocumentResponseDto'>['content_format']>()
      .toEqualTypeOf<'blocknote_v1'>();
    expectTypeOf<z.infer<typeof documentSchema>['content_format']>()
      .toEqualTypeOf<'blocknote_v1'>();
  });

  // `documentSchema` is intentionally more permissive than the contract in
  // three places: `owner_user` stays optional, and `access`/`collaboration`
  // widen enums to `string` so older payloads still parse. A bidirectional
  // assignability assertion would encode the opposite, so only the narrowed
  // fields are asserted here.
});
