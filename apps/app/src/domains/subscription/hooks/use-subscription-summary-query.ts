'use client';

import { useQuery } from '@tanstack/react-query';
import { subscriptionSummaryQueryOptions } from '../api/subscription.queries';
import type { SubscriptionSummary } from '../api/subscription.types';

export function useSubscriptionSummaryQuery(
  workspaceId: string,
  initialData?: SubscriptionSummary,
) {
  return useQuery({
    ...subscriptionSummaryQueryOptions(workspaceId),
    ...(initialData ? { initialData, staleTime: Number.POSITIVE_INFINITY } : {}),
  });
}
