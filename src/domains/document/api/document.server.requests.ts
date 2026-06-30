import 'server-only';

import { apiServerGet, apiServerPost, apiServerRequest } from '@/lib/api-server';

import {
  createDocumentSchema,
  documentSchema,
} from './document.schemas';
import type {
  CreateDocumentInput,
  Document,
  DocumentId,
  WorkspaceId,
} from './document.types';

async function buildServerRequestError(
  label: string,
  response: Response,
) {
  const responseBody = await response.text().catch(() => '');
  const trimmedBody = responseBody.trim();
  const details = trimmedBody ? ` Body: ${trimmedBody}` : '';

  return new Error(`Failed to load ${label}. Status: ${response.status}.${details}`);
}

async function buildWorkspaceDefaultDocumentRequestError(response: Response) {
  return buildServerRequestError('the workspace default document', response);
}

export async function getDocumentServer(documentId: DocumentId): Promise<Document> {
  const response = await apiServerRequest(`documents/${documentId}`);

  if (!response.ok) {
    throw await buildServerRequestError('the document', response);
  }

  const payload = await response.json();

  return documentSchema.parse(payload);
}

export async function getWorkspaceDefaultDocumentServer(
  workspaceId: WorkspaceId,
  recentDocumentId?: DocumentId | null,
): Promise<{ document_id?: string }> {
  const searchParams = new URLSearchParams();

  if (recentDocumentId) {
    searchParams.set('recent_document_id', recentDocumentId);
  }

  const response = await apiServerRequest(
    `workspaces/${workspaceId}/documents/default${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`,
  );

  if (!response.ok) {
    throw await buildWorkspaceDefaultDocumentRequestError(response);
  }

  return response.json() as Promise<{ document_id?: string }>;
}

export async function createDocumentServer(input: CreateDocumentInput): Promise<Document> {
  const payload = createDocumentSchema.parse({
    content_format: 'blocknote_v1',
    ...input,
  });
  const response = await apiServerPost<unknown, typeof payload>('documents', payload);

  return documentSchema.parse(response);
}
