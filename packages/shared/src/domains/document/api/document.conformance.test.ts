import {
  describe,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import type {
  archiveSubdocCommandResultSchema,
  archivedDocumentListItemSchema,
  archivedDocumentListPageSchema,
  createSubdocumentCommandResultSchema,
  documentAccessSchema,
  documentBreadcrumbItemSchema,
  documentCollaborationSchema,
  documentCollaboratorSchema,
  documentInvitationSchema,
  documentNavigationPageSchema,
  documentOwnerUserSchema,
  documentSchema,
  shareDocumentFailureSchema,
  shareDocumentsResponseSchema,
} from '../../../../../../apps/app/src/domains/document/api/document.schemas';
import type { ApiSchema, paths } from '../../../api/contracts';

type DocumentAccessInferred = z.infer<typeof documentAccessSchema>;
type DocumentCollaborationInferred = z.infer<typeof documentCollaborationSchema>;
type DocumentOwnerUserInferred = z.infer<typeof documentOwnerUserSchema>;
type DocumentBreadcrumbItemInferred = z.infer<typeof documentBreadcrumbItemSchema>;
type DocumentInvitationInferred = z.infer<typeof documentInvitationSchema>;
type ArchivedDocumentListItemInferred = z.infer<typeof archivedDocumentListItemSchema>;
type ArchivedDocumentListPageInferred = z.infer<typeof archivedDocumentListPageSchema>;
type DocumentCollaboratorInferred = z.infer<typeof documentCollaboratorSchema>;
type CreateSubdocumentCommandResultInferred =
  z.infer<typeof createSubdocumentCommandResultSchema>;
type ArchiveSubdocCommandResultInferred = z.infer<typeof archiveSubdocCommandResultSchema>;
type ShareDocumentFailureInferred = z.infer<typeof shareDocumentFailureSchema>;
type ShareDocumentsResponseInferred = z.infer<typeof shareDocumentsResponseSchema>;

type DuplicateDocumentResponse =
  paths['/v1/documents/{documentId}/duplicate']['post']['responses'][201]['content']['application/json'];
type MoveDocumentResponse =
  paths['/v1/documents/{documentId}/move']['post']['responses'][200]['content']['application/json'];
type CreateSubdocCommandResponse =
  paths['/v1/documents/{documentId}/commands/create-subdoc']['post']['responses'][201]['content']['application/json'];
type ArchiveSubdocCommandResponse =
  paths['/v1/documents/{documentId}/commands/archive-subdoc']['post']['responses'][200]['content']['application/json'];
type ShareDocumentResponse =
  paths['/v1/documents/{documentId}/share']['post']['responses'][200]['content']['application/json'];
type ShareDocumentsResponse =
  paths['/v1/documents/{documentId}/shares']['post']['responses'][200]['content']['application/json'];
type DocumentChildrenResponse =
  paths['/v1/documents/{documentId}/children']['get']['responses'][200]['content']['application/json'];
type DocumentInvitationsResponse =
  paths['/v1/documents/{documentId}/invitations']['get']['responses'][200]['content']['application/json'];
type ArchivedWorkspaceDocumentsResponse =
  paths['/v1/workspaces/{workspaceId}/documents/archived']['get']['responses'][200]['content']['application/json'];

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

  it('documentSchema requires every contract field, including owner_user', () => {
    // The API always serialises `owner_user` through `DocumentResponseDto`,
    // including POST /v1/documents, so the runtime schema requires it too.
    // The runtime schema is still narrower than the contract for `access` and
    // `collaboration` (enums instead of plain strings), and it tolerates the
    // optional avatar the contract omits, so one direction remains the
    // strongest true statement.
    expectTypeOf<z.infer<typeof documentSchema>>()
      .toExtend<ApiSchema<'DocumentResponseDto'>>();
  });

  it('duplicate and move resolve to DocumentResponseDto', () => {
    expectTypeOf<DuplicateDocumentResponse>()
      .toEqualTypeOf<ApiSchema<'DocumentResponseDto'>>();
    expectTypeOf<MoveDocumentResponse>()
      .toEqualTypeOf<ApiSchema<'DocumentResponseDto'>>();
  });

  it('create-subdoc command resolves to CreateSubdocCommandResponseDto', () => {
    expectTypeOf<CreateSubdocCommandResponse>()
      .toEqualTypeOf<ApiSchema<'CreateSubdocCommandResponseDto'>>();
    // The runtime schema embeds the narrower `documentSchema`, so only the
    // schema -> contract direction holds, same as DocumentResponseDto itself.
    expectTypeOf<CreateSubdocumentCommandResultInferred>()
      .toExtend<ApiSchema<'CreateSubdocCommandResponseDto'>>();
  });

  it('archive-subdoc command resolves to ArchiveSubdocCommandResponseDto', () => {
    expectTypeOf<ArchiveSubdocCommandResponse>()
      .toEqualTypeOf<ApiSchema<'ArchiveSubdocCommandResponseDto'>>();
    expectTypeOf<ArchiveSubdocCommandResultInferred>()
      .toExtend<ApiSchema<'ArchiveSubdocCommandResponseDto'>>();
  });

  it('share resolves to DocumentCollaboratorResponseDto', () => {
    expectTypeOf<ShareDocumentResponse>()
      .toEqualTypeOf<ApiSchema<'DocumentCollaboratorResponseDto'>>();
    // The contract requires `access_source` and omits the optional `avatar`,
    // so the contract shape extends the runtime schema output one way only.
    expectTypeOf<ApiSchema<'DocumentCollaboratorResponseDto'>>()
      .toExtend<DocumentCollaboratorInferred>();
  });

  it('shares resolves to ShareDocumentsResponseDto', () => {
    expectTypeOf<ShareDocumentsResponse>()
      .toEqualTypeOf<ApiSchema<'ShareDocumentsResponseDto'>>();
    // `failed` entries agree in both directions; the collaborator and
    // invitation lists keep the narrower runtime shapes documented above.
    expectTypeOf<ShareDocumentFailureInferred>()
      .toEqualTypeOf<ApiSchema<'ShareDocumentsResponseDto'>['failed'][number]>();
    expectTypeOf<ApiSchema<'ShareDocumentsResponseDto'>['failed'][number]>()
      .toEqualTypeOf<ShareDocumentFailureInferred>();
    expectTypeOf<ShareDocumentsResponseInferred['failed']>()
      .toEqualTypeOf<ApiSchema<'ShareDocumentsResponseDto'>['failed']>();
  });

  it('document children resolve to DocumentTreeChildResponseDto', () => {
    expectTypeOf<DocumentChildrenResponse>()
      .toEqualTypeOf<ApiSchema<'DocumentTreeChildResponseDto'>[]>();
    // The runtime navigation node narrows ids/access fields and accepts the
    // optional access_scope/is_owned fields the contract omits, so it extends
    // the contract item one way only.
    expectTypeOf<z.infer<typeof documentNavigationPageSchema>['items'][number]>()
      .toExtend<ApiSchema<'DocumentTreeChildResponseDto'>>();
  });

  it('document invitations resolve to DocumentInvitationResponseDto', () => {
    expectTypeOf<DocumentInvitationsResponse>()
      .toEqualTypeOf<ApiSchema<'DocumentInvitationResponseDto'>[]>();
  });

  it('archived workspace documents resolve to ArchivedDocumentListPageResponseDto', () => {
    expectTypeOf<ArchivedWorkspaceDocumentsResponse>()
      .toEqualTypeOf<ApiSchema<'ArchivedDocumentListPageResponseDto'>>();
  });
});
