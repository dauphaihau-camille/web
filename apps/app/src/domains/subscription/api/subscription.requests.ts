import {
  apiGet,
  apiPost,
} from '@shared/lib/api-client';
import type { ApiRequestBody, ApiSuccess } from '@shared/api/contracts';
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
  const response = await apiGet<
    ApiSuccess<'/v1/workspaces/{workspaceId}/subscription', 'get'>
  >(`workspaces/${workspaceId}/subscription`);

  return subscriptionSummarySchema.parse(response);
}

export async function createCheckoutSession(
  workspaceId: string,
  input?: {
    return_url?: string;
  },
): Promise<CheckoutSession> {
  const response = await apiPost<
    ApiSuccess<'/v1/workspaces/{workspaceId}/subscription/checkout', 'post', 201>,
    ApiRequestBody<'/v1/workspaces/{workspaceId}/subscription/checkout', 'post'>
  >(
    `workspaces/${workspaceId}/subscription/checkout`,
    input,
  );

  return checkoutSessionSchema.parse(response);
}

export async function cancelSubscription(
  workspaceId: string,
): Promise<SubscriptionSummary> {
  const response = await apiPost<
    ApiSuccess<'/v1/workspaces/{workspaceId}/subscription/cancel', 'post'>
  >(`workspaces/${workspaceId}/subscription/cancel`);

  return subscriptionSummarySchema.parse(response);
}
