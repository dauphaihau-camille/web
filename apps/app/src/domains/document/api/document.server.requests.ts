import 'server-only';

import { apiServerPost, apiServerRequest } from '@shared/lib/api-server';
import { logger } from '@shared/lib/server-logger';

import {
  createRootDocumentSchema,
  documentSchema,
} from './document.schemas';
import type {
  CreateRootDocumentInput,
  Document,
  DocumentId,
  WorkspaceId,
} from './document.types';

export class ServerRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ServerRequestError';
  }
}

export function isServerRequestError(
  error: unknown,
  status?: number,
): error is ServerRequestError {
  if (!(error instanceof ServerRequestError)) {
    return false;
  }

  return status === undefined || error.status === status;
}

async function buildServerRequestError(
  label: string,
  response: Response,
) {
  const responseBody = await response.text().catch(() => '');
  const trimmedBody = responseBody.trim();
  const details = trimmedBody ? ` Body: ${trimmedBody}` : '';

  return new ServerRequestError(
    `Failed to load ${label}. Status: ${response.status}.${details}`,
    response.status,
  );
}

async function buildWorkspaceDefaultDocumentRequestError(response: Response) {
  return buildServerRequestError('the workspace default document', response);
}

export async function getDocumentServer(documentId: DocumentId): Promise<Document> {
  const startedAt = Date.now();
  logger.debug({ documentId }, 'Fetching document on the server');

  let response: Response;

  try {
    response = await apiServerRequest(`documents/${documentId}`);
  }
  catch (error) {
    logger.error({ documentId, error }, 'Document request failed before receiving a response');
    throw error;
  }

  if (!response.ok) {
    logger.error({ documentId, status: response.status }, 'Document request returned a non-ok response');
    throw await buildServerRequestError('the document', response);
  }

  const payload = await response.json();
  const document = documentSchema.parse(payload);

  logger.debug({
    documentId,
    durationMs: Date.now() - startedAt,
    response: {
      id: document.id,
      publicId: document.public_id,
      workspaceId: document.workspace_id,
      teamspaceId: document.teamspace_id,
      version: document.version,
      contentBlockCount: document.content.length,
      updatedAt: document.updated_at,
      archivedAt: document.archived_at,
      archivedByName: document.archived_by_name,
    },
  }, 'Fetched document response summary on the server');

  logger.info({ documentId, durationMs: Date.now() - startedAt }, 'Fetched document on the server');

  return document;
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

export async function createRootDocumentServer(input: CreateRootDocumentInput): Promise<Document> {
  const payload = createRootDocumentSchema.parse({
    content_format: 'blocknote_v1',
    ...input,
  });
  const response = await apiServerPost<unknown, typeof payload>('documents', payload);

  return documentSchema.parse(response);
}
