import type { z } from 'zod';

import type {
  archivedDocumentListItemSchema,
  archivedDocumentListPageSchema,
  archiveSubdocCommandResultSchema,
  archiveSubdocCommandSchema,
  createRootDocumentSchema,
  createSubdocumentCommandResultSchema,
  createSubdocumentCommandSchema,
  documentBreadcrumbItemSchema,
  documentAccessGrantPermissionSchema,
  documentAccessPermissionSchema,
  documentAccessSettingsSchema,
  documentAccessScopeSchema,
  documentAccessSchema,
  documentCollaboratorListSchema,
  documentCollaboratorSchema,
  documentCollaboratorUserSchema,
  documentInvitationListSchema,
  documentInvitationSchema,
  documentCollaborationSchema,
  documentContentFormatSchema,
  documentIdSchema,
  documentNavigationNodeSchema,
  documentNavigationPageSchema,
  documentOwnerUserSchema,
  documentSchema,
  moveDocumentSchema,
  shareDocumentFailureSchema,
  shareDocumentSchema,
  shareDocumentsResponseSchema,
  shareDocumentsSchema,
  updateDocumentInvitationSchema,
  updateDocumentAccessSettingsSchema,
  teamspaceDocumentNavigationSchema,
  updateDocumentSchema,
  workspaceDocumentNavigationSchema,
} from './document.schemas';

export type DocumentId = z.infer<typeof documentIdSchema>;
export type WorkspaceId = string;
export type DocumentContentFormat = z.infer<typeof documentContentFormatSchema>;
export type DocumentBreadcrumbItem = z.infer<typeof documentBreadcrumbItemSchema>;
export type DocumentAccessScope = z.infer<typeof documentAccessScopeSchema>;
export type DocumentAccessPermission = z.infer<typeof documentAccessPermissionSchema>;
export type DocumentAccessGrantPermission = z.infer<typeof documentAccessGrantPermissionSchema>;
export type DocumentAccess = z.infer<typeof documentAccessSchema>;
export type DocumentCollaboration = z.infer<typeof documentCollaborationSchema>;
export type DocumentAccessSettings = z.infer<typeof documentAccessSettingsSchema>;
export type Document = z.infer<typeof documentSchema>;
export type DocumentOwnerUser = z.infer<typeof documentOwnerUserSchema>;
export type DocumentCollaboratorUser = z.infer<typeof documentCollaboratorUserSchema>;
export type DocumentCollaborator = z.infer<typeof documentCollaboratorSchema>;
export type DocumentCollaboratorList = z.infer<typeof documentCollaboratorListSchema>;
export type DocumentInvitation = z.infer<typeof documentInvitationSchema>;
export type DocumentInvitationList = z.infer<typeof documentInvitationListSchema>;
export type DocumentNavigationNode = z.infer<typeof documentNavigationNodeSchema>;
export type DocumentNavigationPage = z.infer<typeof documentNavigationPageSchema>;
export type ArchivedDocumentListItem = z.infer<typeof archivedDocumentListItemSchema>;
export type ArchivedDocumentListPage = z.infer<typeof archivedDocumentListPageSchema>;
export type TeamspaceDocumentNavigationGroup = z.infer<typeof teamspaceDocumentNavigationSchema>;
export type WorkspaceDocumentNavigation = z.infer<typeof workspaceDocumentNavigationSchema>;
export type CreateRootDocumentInput = z.infer<typeof createRootDocumentSchema>;
export type CreateSubdocumentCommandInput = z.infer<typeof createSubdocumentCommandSchema>;
export type CreateSubdocumentCommandResult = z.infer<typeof createSubdocumentCommandResultSchema>;
export type ArchiveSubdocCommandInput = z.infer<typeof archiveSubdocCommandSchema>;
export type ArchiveSubdocCommandResult = z.infer<typeof archiveSubdocCommandResultSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type MoveDocumentInput = z.infer<typeof moveDocumentSchema>;
export type ShareDocumentInput = z.infer<typeof shareDocumentSchema>;
export type ShareDocumentsInput = z.infer<typeof shareDocumentsSchema>;
export type ShareDocumentFailure = z.infer<typeof shareDocumentFailureSchema>;
export type ShareDocumentsResponse = z.infer<typeof shareDocumentsResponseSchema>;
export type UpdateDocumentInvitationInput = z.infer<typeof updateDocumentInvitationSchema>;
export type UpdateDocumentAccessSettingsInput = z.infer<typeof updateDocumentAccessSettingsSchema>;
