import { apiDelete, apiGet, apiPost } from '../../../lib/api-client';
import type { ApiSuccess } from '../../../api/contracts';
import {
  publishStatusSchema,
} from './publish.schemas';
import type {
  PublishStatus,
} from './publish.types';

export async function getPublishStatus(documentId: string): Promise<PublishStatus> {
  const response = await apiGet<
    ApiSuccess<'/v1/documents/{documentId}/publish', 'get'>
  >(`documents/${documentId}/publish`);

  return publishStatusSchema.parse(response);
}

export async function publishDocument(documentId: string): Promise<PublishStatus> {
  const response = await apiPost<
    ApiSuccess<'/v1/documents/{documentId}/publish', 'post', 201>
  >(`documents/${documentId}/publish`);

  return publishStatusSchema.parse(response);
}

export async function unpublishDocument(documentId: string): Promise<PublishStatus> {
  const response = await apiDelete<
    ApiSuccess<'/v1/documents/{documentId}/publish', 'delete'>
  >(`documents/${documentId}/publish`);

  return publishStatusSchema.parse(response);
}
