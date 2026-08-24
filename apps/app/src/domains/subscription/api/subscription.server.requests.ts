import 'server-only';

import { apiServerRequest } from '@shared/lib/api-server';
import { subscriptionSummarySchema } from './subscription.schemas';
import type { SubscriptionSummary } from './subscription.types';

class SubscriptionServerRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'SubscriptionServerRequestError';
  }
}

async function buildSubscriptionRequestError(label: string, response: Response) {
  const responseBody = await response.text().catch(() => '');
  const trimmedBody = responseBody.trim();
  const details = trimmedBody ? ` Body: ${trimmedBody}` : '';

  return new SubscriptionServerRequestError(
    `Failed to load ${label}. Status: ${response.status}.${details}`,
    response.status,
  );
}

export async function getSubscriptionSummaryServer(
  workspaceId: string,
): Promise<SubscriptionSummary> {
  const response = await apiServerRequest(`workspaces/${workspaceId}/subscription`);

  if (!response.ok) {
    throw await buildSubscriptionRequestError('the workspace subscription', response);
  }

  const payload = await response.json();

  return subscriptionSummarySchema.parse(payload);
}
