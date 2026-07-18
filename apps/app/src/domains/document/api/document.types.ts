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
  documentContentFormatSchema,
  documentIdSchema,
  documentNavigationNodeSchema,
  documentNavigationPageSchema,
  documentSchema,
  moveDocumentSchema,
  teamspaceDocumentNavigationSchema,
  updateDocumentSchema,
  workspaceDocumentNavigationSchema,
} from './document.schemas';

export type DocumentId = z.infer<typeof documentIdSchema>;
export type WorkspaceId = string;
export type DocumentContentFormat = z.infer<typeof documentContentFormatSchema>;
export type DocumentBreadcrumbItem = z.infer<typeof documentBreadcrumbItemSchema>;
export type Document = z.infer<typeof documentSchema>;
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
