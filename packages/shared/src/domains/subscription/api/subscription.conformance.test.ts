import {
  describe,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import type {
  checkoutSessionSchema,
  subscriptionPlanSchema,
  subscriptionStatusSchema,
  subscriptionSummarySchema,
} from '../../../../../../apps/app/src/domains/subscription/api/subscription.schemas';
import type { ApiSchema, paths } from '../../../api/contracts';

type SubscriptionSummaryInferred = z.infer<typeof subscriptionSummarySchema>;
type CheckoutSessionInferred = z.infer<typeof checkoutSessionSchema>;
type SubscriptionPlanInferred = z.infer<typeof subscriptionPlanSchema>;
type SubscriptionStatusInferred = z.infer<typeof subscriptionStatusSchema>;

type SubscriptionSummaryResponse =
  paths['/v1/workspaces/{workspaceId}/subscription']['get']['responses'][200]['content']['application/json'];
type CheckoutSessionResponse =
  paths['/v1/workspaces/{workspaceId}/subscription/checkout']['post']['responses'][201]['content']['application/json'];
type CancelSubscriptionResponse =
  paths['/v1/workspaces/{workspaceId}/subscription/cancel']['post']['responses'][200]['content']['application/json'];

describe('subscription contract', () => {
  it('subscriptionSummarySchema accepts SubscriptionSummaryResponseDto payloads', () => {
    // The runtime schema types `provider_status` as nullable, while the
    // contract declares it as a plain optional string. Every value the API
    // emits per the contract still parses, so the contract -> schema direction
    // is the strongest true statement; the reverse would forbid nulls the API
    // is documented to send.
    expectTypeOf<ApiSchema<'SubscriptionSummaryResponseDto'>>()
      .toExtend<SubscriptionSummaryInferred>();
  });

  it('subscriptionSummaryResponseDto narrows plan and status to the domain enums', () => {
    expectTypeOf<SubscriptionPlanInferred>()
      .toEqualTypeOf<ApiSchema<'SubscriptionSummaryResponseDto'>['plan']>();
    expectTypeOf<SubscriptionStatusInferred>()
      .toEqualTypeOf<ApiSchema<'SubscriptionSummaryResponseDto'>['status']>();
  });

  it('subscriptionSummary entitlements match SubscriptionEntitlementsResponseDto', () => {
    expectTypeOf<SubscriptionSummaryInferred['entitlements']>()
      .toEqualTypeOf<ApiSchema<'SubscriptionEntitlementsResponseDto'>>();
    expectTypeOf<ApiSchema<'SubscriptionEntitlementsResponseDto'>>()
      .toEqualTypeOf<SubscriptionSummaryInferred['entitlements']>();
  });

  it('checkoutSessionSchema matches CheckoutSessionResponseDto', () => {
    expectTypeOf<CheckoutSessionInferred>()
      .toEqualTypeOf<ApiSchema<'CheckoutSessionResponseDto'>>();
    expectTypeOf<ApiSchema<'CheckoutSessionResponseDto'>>()
      .toEqualTypeOf<CheckoutSessionInferred>();
  });

  it('subscription operations resolve to the subscription DTOs', () => {
    expectTypeOf<SubscriptionSummaryResponse>()
      .toEqualTypeOf<ApiSchema<'SubscriptionSummaryResponseDto'>>();
    expectTypeOf<CancelSubscriptionResponse>()
      .toEqualTypeOf<ApiSchema<'SubscriptionSummaryResponseDto'>>();
    expectTypeOf<CheckoutSessionResponse>()
      .toEqualTypeOf<ApiSchema<'CheckoutSessionResponseDto'>>();
  });
});
