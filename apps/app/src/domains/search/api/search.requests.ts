import { apiGet } from '@shared/lib/api-client';
import type { ApiSuccess } from '@shared/api/contracts';
import { searchDocumentSchema } from './search.schemas';
import type { SearchDocument } from './search.types';

export async function searchWorkspaceDocuments(
  workspaceId: string,
  input?: {
    query?: string;
    limit?: number;
  },
): Promise<SearchDocument[]> {
  const response = await apiGet<
    ApiSuccess<'/v1/workspaces/{workspaceId}/search/documents', 'get'>
  >(`workspaces/${workspaceId}/search/documents`, {
    searchParams: {
      ...(input?.query ? { q: input.query } : {}),
      ...(input?.limit ? { limit: String(input.limit) } : {}),
    },
  });

  return searchDocumentSchema.array().parse(response);
}
