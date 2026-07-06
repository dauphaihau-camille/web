import { queryOptions } from '@tanstack/react-query';
import { searchKeys } from './search.keys';
import { searchWorkspaceDocuments } from './search.requests';

export function workspaceSearchDocumentsQueryOptions(
  workspaceId: string,
  query = '',
  limit = 12,
) {
  return queryOptions({
    queryKey: searchKeys.documents(workspaceId, query, limit),
    queryFn: () => searchWorkspaceDocuments(workspaceId, {
      query: query || undefined,
      limit,
    }),
  });
}
