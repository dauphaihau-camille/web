import type { z } from 'zod';
import type {
  checkoutSessionSchema,
  subscriptionPlanSchema,
  subscriptionStatusSchema,
  subscriptionSummarySchema,
} from './subscription.schemas';

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type SubscriptionSummary = z.infer<typeof subscriptionSummarySchema>;
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;
