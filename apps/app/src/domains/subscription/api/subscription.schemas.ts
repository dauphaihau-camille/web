import { z } from 'zod';

export const subscriptionPlanSchema = z.enum(['free', 'plus']);
export const subscriptionStatusSchema = z.enum(['free', 'active', 'past_due', 'canceling']);

export const subscriptionSummarySchema = z.object({
  workspace_id: z.string().min(1),
  plan: subscriptionPlanSchema,
  status: subscriptionStatusSchema,
  seat_count: z.number().int().nonnegative(),
  block_count: z.number().int().nonnegative(),
  block_limit: z.number().int().nonnegative().nullable(),
  entitlements: z.object({
    max_blocks: z.number().int().nonnegative().nullable(),
  }),
  current_period_start: z.string().optional(),
  current_period_end: z.string().optional(),
  cancel_at_period_end: z.boolean(),
  provider_status: z.string().nullable().optional(),
});

export const checkoutSessionSchema = z.object({
  session_id: z.string().min(1),
  checkout_url: z.string().min(1),
  expires_at: z.string().optional(),
});
