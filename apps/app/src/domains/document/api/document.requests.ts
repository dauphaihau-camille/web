import {
  apiDelete, apiGet, apiPatch, apiPost,
} from '@shared/lib/api-client';

import {
  archivedDocumentListPageSchema,
  createDocumentSchema,
  createSubdocCommandSchema,
  createSubdocCommandResultSchema,
  documentSchema,
  documentNavigationPageSchema,
  workspaceDocumentNavigationSchema,
} from './document.schemas';
import type {
  ArchivedDocumentListPage,
  CreateDocumentInput,
  CreateSubdocCommandInput,
  CreateSubdocCommandResult,
  Document,
  DocumentId,
  DocumentNavigationPage,
  MoveDocumentInput,
  UpdateDocumentInput,
  WorkspaceDocumentNavigation,
  WorkspaceId,
} from './document.types';

export async function getDocument(documentId: DocumentId): Promise<Document> {
  const response = await apiGet<unknown>(`documents/${documentId}`);

  return documentSchema.parse(response);
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
  workspaceId: WorkspaceId,
  input: {
    parent_document_id: DocumentId;
    limit?: number;
    cursor?: string;
  },
): Promise<DocumentNavigationPage> {
  const response = await apiGet<unknown>(`workspaces/${workspaceId}/documents`, {
    searchParams: {
      parent_document_id: input.parent_document_id,
      limit: String(input.limit ?? 50),
      ...(input.cursor ? { cursor: input.cursor } : {}),
    },
  });

  return documentNavigationPageSchema.parse(response) as DocumentNavigationPage;
}

export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const payload = createDocumentSchema.parse({
    content_format: 'blocknote_v1',
    ...input,
  });
  const response = await apiPost<unknown, CreateDocumentInput>('documents', payload);

  return documentSchema.parse(response);
}

export async function createSubdocCommand(
  documentId: DocumentId,
  input?: CreateSubdocCommandInput,
): Promise<CreateSubdocCommandResult> {
  const payload = createSubdocCommandSchema.parse(input ?? {});
  const response = await apiPost<unknown, CreateSubdocCommandInput>(
    `documents/${documentId}/commands/create-subdoc`,
    payload,
  );

  return createSubdocCommandResultSchema.parse(response);
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
