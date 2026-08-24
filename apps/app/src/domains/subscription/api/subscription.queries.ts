import { queryOptions } from '@tanstack/react-query';
import { subscriptionKeys } from './subscription.keys';
import { getSubscriptionSummary } from './subscription.requests';

export function subscriptionSummaryQueryOptions(workspaceId: string) {
  return queryOptions({
    queryKey: subscriptionKeys.summary(workspaceId),
    queryFn: () => getSubscriptionSummary(workspaceId),
  });
}
