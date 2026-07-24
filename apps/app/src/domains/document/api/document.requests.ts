import {
  apiDelete, apiGet, apiPatch, apiPost,
} from '@shared/lib/api-client';

import {
  archivedDocumentListPageSchema,
  archiveSubdocCommandResultSchema,
  archiveSubdocCommandSchema,
  createRootDocumentSchema,
  createSubdocumentCommandSchema,
  createSubdocumentCommandResultSchema,
  documentCollaboratorListSchema,
  documentCollaboratorSchema,
  documentAccessSettingsSchema,
  documentInvitationListSchema,
  documentInvitationSchema,
  documentSchema,
  documentNavigationPageSchema,
  shareDocumentSchema,
  shareDocumentsResponseSchema,
  shareDocumentsSchema,
  updateDocumentAccessSettingsSchema,
  updateDocumentInvitationSchema,
  workspaceDocumentNavigationSchema,
} from './document.schemas';
import type {
  ArchivedDocumentListPage,
  ArchiveSubdocCommandInput,
  ArchiveSubdocCommandResult,
  CreateRootDocumentInput,
  CreateSubdocumentCommandInput,
  CreateSubdocumentCommandResult,
  Document,
  DocumentAccessSettings,
  DocumentCollaborator,
  DocumentCollaboratorList,
  DocumentId,
  DocumentInvitation,
  DocumentInvitationList,
  DocumentNavigationPage,
  MoveDocumentInput,
  ShareDocumentInput,
  ShareDocumentsInput,
  ShareDocumentsResponse,
  UpdateDocumentAccessSettingsInput,
  UpdateDocumentInvitationInput,
  UpdateDocumentInput,
  WorkspaceDocumentNavigation,
  WorkspaceId,
} from './document.types';

export async function getDocument(documentId: DocumentId): Promise<Document> {
  const response = await apiGet<unknown>(`documents/${documentId}`);

  return documentSchema.parse(response);
}

export async function listDocumentCollaborators(
  documentId: DocumentId,
): Promise<DocumentCollaboratorList> {
  const response = await apiGet<unknown>(`documents/${documentId}/collaborators`);

  return documentCollaboratorListSchema.parse(response);
}

export async function listDocumentInvitations(
  documentId: DocumentId,
): Promise<DocumentInvitationList> {
  const response = await apiGet<unknown>(`documents/${documentId}/invitations`);

  return documentInvitationListSchema.parse(response);
}

export async function shareDocument(
  documentId: DocumentId,
  input: ShareDocumentInput,
): Promise<DocumentCollaborator> {
  const payload = shareDocumentSchema.parse(input);
  const response = await apiPost<unknown, ShareDocumentInput>(
    `documents/${documentId}/share`,
    payload,
  );

  return documentCollaboratorSchema.parse(response);
}

export async function shareDocuments(
  documentId: DocumentId,
  input: ShareDocumentsInput,
): Promise<ShareDocumentsResponse> {
  const payload = shareDocumentsSchema.parse(input);
  const response = await apiPost<unknown, ShareDocumentsInput>(
    `documents/${documentId}/shares`,
    payload,
  );

  return shareDocumentsResponseSchema.parse(response);
}

export async function revokeDocumentAccess(
  documentId: DocumentId,
  userId: string,
): Promise<void> {
  await apiDelete<void>(`documents/${documentId}/collaborators/${userId}`);
}

export async function updateDocumentInvitation(
  documentId: DocumentId,
  invitationId: string,
  input: UpdateDocumentInvitationInput,
): Promise<DocumentInvitation> {
  const payload = updateDocumentInvitationSchema.parse(input);
  const response = await apiPatch<unknown, UpdateDocumentInvitationInput>(
    `documents/${documentId}/invitations/${invitationId}`,
    payload,
  );

  return documentInvitationSchema.parse(response);
}

export async function revokeDocumentInvitation(
  documentId: DocumentId,
  invitationId: string,
): Promise<void> {
  await apiDelete<void>(`documents/${documentId}/invitations/${invitationId}`);
}

export async function getDocumentAccessSettings(
  documentId: DocumentId,
): Promise<DocumentAccessSettings> {
  const response = await apiGet<unknown>(`documents/${documentId}/access-settings`);

  return documentAccessSettingsSchema.parse(response);
}

export async function updateDocumentAccessSettings(
  documentId: DocumentId,
  input: UpdateDocumentAccessSettingsInput,
): Promise<DocumentAccessSettings> {
  const payload = updateDocumentAccessSettingsSchema.parse(input);
  const response = await apiPatch<unknown, UpdateDocumentAccessSettingsInput>(
    `documents/${documentId}/access-settings`,
    payload,
  );

  return documentAccessSettingsSchema.parse(response);
}

export async function getWorkspaceRootDocuments(
  workspaceId: WorkspaceId,
  input?: {
    limit?: number;
    cursor?: string;
    query?: string;
  },
): Promise<WorkspaceDocumentNavigation> {
  const response = await apiGet<unknown>(`workspaces/${workspaceId}/documents`, {
    searchParams: {
      limit: String(input?.limit ?? 50),
      ...(input?.cursor ? { cursor: input.cursor } : {}),
      ...(input?.query ? { q: input.query } : {}),
    },
  });

  return workspaceDocumentNavigationSchema.parse(response) as WorkspaceDocumentNavigation;
}

export async function getArchivedWorkspaceDocuments(
  workspaceId: WorkspaceId,
  input?: {
    limit?: number;
    cursor?: string;
    query?: string;
  },
): Promise<ArchivedDocumentListPage> {
  const response = await apiGet<unknown>(`workspaces/${workspaceId}/documents/archived`, {
    searchParams: {
      limit: String(input?.limit ?? 50),
      ...(input?.cursor ? { cursor: input.cursor } : {}),
      ...(input?.query ? { q: input.query } : {}),
    },
  });

  return archivedDocumentListPageSchema.parse(response) as ArchivedDocumentListPage;
}

export async function getWorkspaceChildDocuments(
  _workspaceId: WorkspaceId,
  input: {
    parent_document_id: DocumentId;
    limit?: number;
    cursor?: string;
  },
): Promise<DocumentNavigationPage> {
  const response = await apiGet<unknown>(`documents/${input.parent_document_id}/children`);

  return {
    items: documentNavigationPageSchema.shape.items.parse(response),
  } as DocumentNavigationPage;
}

export async function createRootDocument(input: CreateRootDocumentInput): Promise<Document> {
  const payload = createRootDocumentSchema.parse({
    content_format: 'blocknote_v1',
    ...input,
  });
  const response = await apiPost<unknown, CreateRootDocumentInput>('documents', payload);

  return documentSchema.parse(response);
}

export async function createSubdocumentCommand(
  documentId: DocumentId,
  input?: CreateSubdocumentCommandInput,
): Promise<CreateSubdocumentCommandResult> {
  const payload = createSubdocumentCommandSchema.parse(input ?? {});
  const response = await apiPost<unknown, CreateSubdocumentCommandInput>(
    `documents/${documentId}/commands/create-subdoc`,
    payload,
  );

  return createSubdocumentCommandResultSchema.parse(response);
}

export async function archiveSubdocCommand(
  documentId: DocumentId,
  input: ArchiveSubdocCommandInput,
): Promise<ArchiveSubdocCommandResult> {
  const payload = archiveSubdocCommandSchema.parse(input);
  const response = await apiPost<unknown, ArchiveSubdocCommandInput>(
    `documents/${documentId}/commands/archive-subdoc`,
    payload,
  );

  return archiveSubdocCommandResultSchema.parse(response);
}

export async function duplicateDocument(documentId: DocumentId): Promise<Document> {
  const response = await apiPost<unknown>(`documents/${documentId}/duplicate`);

  return documentSchema.parse(response);
}

export async function updateDocument(
  documentId: DocumentId,
  input: UpdateDocumentInput,
): Promise<Document> {
  const response = await apiPatch<unknown, UpdateDocumentInput>(`documents/${documentId}`, input);

  return documentSchema.parse(response);
}

export async function archiveDocument(
  documentId: DocumentId,
  version: number,
): Promise<Document> {
  const response = await apiPost<unknown, { version: number }>(
    `documents/${documentId}/archive`,
    { version },
  );

  return documentSchema.parse(response);
}

export async function restoreDocument(
  documentId: DocumentId,
  version: number,
): Promise<Document> {
  const response = await apiPost<unknown, { version: number }>(
    `documents/${documentId}/restore`,
    { version },
  );

  return documentSchema.parse(response);
}

export async function permanentlyDeleteDocument(
  documentId: DocumentId,
  version: number,
): Promise<void> {
  await apiDelete<void>(`documents/${documentId}`, {
    searchParams: {
      version: String(version),
    },
  });
}

export async function moveDocument(
  documentId: DocumentId,
  input: MoveDocumentInput,
): Promise<Document> {
  const response = await apiPost<unknown, MoveDocumentInput>(`documents/${documentId}/move`, input);

  return documentSchema.parse(response);
}
