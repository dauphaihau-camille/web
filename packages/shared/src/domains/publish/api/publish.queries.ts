import { queryOptions } from '@tanstack/react-query';
import { publishKeys } from './publish.keys';
import { getPublishStatus } from './publish.requests';

export function publishStatusQueryOptions(documentId: string) {
  return queryOptions({
    queryKey: publishKeys.status(documentId),
    queryFn: () => getPublishStatus(documentId),
  });
}
