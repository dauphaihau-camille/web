import type { z } from 'zod';

import type { ApiSchema } from '@shared/api/contracts';
import type {
  subscriptionSummarySchema,
} from './subscription.schemas';

export type SubscriptionPlan = ApiSchema<'SubscriptionSummaryResponseDto'>['plan'];
export type SubscriptionStatus = ApiSchema<'SubscriptionSummaryResponseDto'>['status'];
export type SubscriptionSummary = z.infer<typeof subscriptionSummarySchema>; // provider_status is nullable here, optional in the contract
export type CheckoutSession = ApiSchema<'CheckoutSessionResponseDto'>;
