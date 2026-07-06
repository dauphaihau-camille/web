import 'server-only';

import { apiServerRequest } from '@/lib/api-server';
import { publicDocumentSchema } from './publish.schemas';
import type { PublicDocument } from './publish.types';

export async function getPublicDocumentServer(
  publishedDocumentId: string,
): Promise<PublicDocument> {
  const response = await apiServerRequest(`published/${publishedDocumentId}`);

  if (!response.ok) {
    throw new Error(`Failed to load published document. Status: ${response.status}.`);
  }

  return publicDocumentSchema.parse(await response.json());
}
