import { apiDelete, apiGet, apiPost } from '../../../lib/api-client';
import {
  publishStatusSchema,
} from './publish.schemas';
import type {
  PublishStatus,
} from './publish.types';

export async function getPublishStatus(documentId: string): Promise<PublishStatus> {
  const response = await apiGet<unknown>(`documents/${documentId}/publish`);

  return publishStatusSchema.parse(response);
}

export async function publishDocument(documentId: string): Promise<PublishStatus> {
  const response = await apiPost<unknown>(`documents/${documentId}/publish`);

  return publishStatusSchema.parse(response);
}

export async function unpublishDocument(documentId: string): Promise<PublishStatus> {
  const response = await apiDelete<unknown>(`documents/${documentId}/publish`);

  return publishStatusSchema.parse(response);
}
