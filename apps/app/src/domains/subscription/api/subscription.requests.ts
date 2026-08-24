import {
  apiGet,
  apiPost,
} from '@shared/lib/api-client';
import {
  checkoutSessionSchema,
  subscriptionSummarySchema,
} from './subscription.schemas';
import type {
  CheckoutSession,
  SubscriptionSummary,
} from './subscription.types';

export async function getSubscriptionSummary(
  workspaceId: string,
): Promise<SubscriptionSummary> {
  const response = await apiGet<unknown>(`workspaces/${workspaceId}/subscription`);

  return subscriptionSummarySchema.parse(response);
}

export async function createCheckoutSession(
  workspaceId: string,
  input?: {
    return_url?: string;
  },
): Promise<CheckoutSession> {
  const response = await apiPost<unknown, typeof input>(
    `workspaces/${workspaceId}/subscription/checkout`,
    input,
  );

  return checkoutSessionSchema.parse(response);
}

export async function cancelSubscription(
  workspaceId: string,
): Promise<SubscriptionSummary> {
  const response = await apiPost<unknown>(`workspaces/${workspaceId}/subscription/cancel`);

  return subscriptionSummarySchema.parse(response);
}
