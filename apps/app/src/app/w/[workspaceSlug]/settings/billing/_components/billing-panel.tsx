'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckIcon } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import {
  cancelSubscription,
  createCheckoutSession,
  subscriptionKeys,
  type SubscriptionStatus,
  type SubscriptionSummary,
  useSubscriptionSummaryQuery,
} from '@/domains/subscription';
import type { Workspace } from '@/domains/workspace';
import { SettingsRow } from '../../_components/settings-section';

const subscriptionStatusLabels: Partial<Record<SubscriptionStatus, string>> = {
  past_due: 'Payment issue',
  canceling: 'Cancels at period end',
};

const upgradeFeatures = [
  'Unlimited blocks',
  'Unlimited workspace members',
  'Seat-based billing',
  'Workspace-level collaboration',
  'Active content remains editable',
];

export function BillingPanel({
  initialSubscription,
  workspace,
}: {
  initialSubscription: SubscriptionSummary;
  workspace: Workspace;
}) {
  const queryClient = useQueryClient();
  const workspaceId = workspace.id;
  const subscriptionQuery = useSubscriptionSummaryQuery(workspaceId, initialSubscription);
  const subscription = subscriptionQuery.data ?? initialSubscription;

  const canStartCheckout =
    workspace.current_user_role === 'owner'
    || workspace.current_user_role === 'admin';

  const canCancel = workspace.current_user_role === 'owner';

  const isPaid = subscription.plan === 'plus' && subscription.status !== 'free';
  const subscriptionStatusLabel = subscriptionStatusLabels[subscription.status];

  const checkoutMutation = useMutation({
    mutationFn: () => createCheckoutSession(workspaceId, {
      return_url: window.location.href,
    }),
    onSuccess: (checkoutSession) => {
      window.location.assign(checkoutSession.checkout_url);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscription(workspaceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: subscriptionKeys.summary(workspaceId),
      });
    },
  });

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <SettingsRow
          title={(
            <span className="capitalize">{subscription.plan} plan</span>
          )}
          description={(
            <>
              {isPaid ? 'Plus workspace' : 'Free for all users'}
              {' · '}
              {subscription.seat_count.toLocaleString()}{' '}
              {subscription.seat_count === 1 ? 'user' : 'users'}
              {subscriptionStatusLabel
                ? (
                  <>
                    <br />
                    Status: <span>{subscriptionStatusLabel}</span>
                  </>
                )
                : null}
            </>
          )}
          showDivider={false}
        >
          {isPaid
            ? (
              <Button
                variant="outline"
                disabled={
                  !canCancel
                  || cancelMutation.isPending
                  || subscription.cancel_at_period_end
                }
                onClick={() => cancelMutation.mutate()}
              >
                {subscription.cancel_at_period_end
                  ? 'Cancellation scheduled'
                  : 'Cancel Plus'}
              </Button>
            )
            : null}
        </SettingsRow>
      </div>

      {!isPaid
        ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <SettingsRow
              title="Upgrade to Plus plan"
              description="$12 per user/mo"
            >
              <Button
                size="lg"
                disabled={!canStartCheckout || checkoutMutation.isPending}
                onClick={() => checkoutMutation.mutate()}
              >
                {checkoutMutation.isPending
                  ? 'Starting checkout...'
                  : 'Upgrade now'}
              </Button>
            </SettingsRow>

            <div className="p-5">
              <ul className="grid gap-x-8 gap-y-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                {upgradeFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckIcon className="size-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
        : null}

      {isPaid && !canCancel
        ? (
          <p className="text-sm text-muted-foreground">
            Only workspace owners can cancel Plus.
          </p>
        )
        : null}
      {!canStartCheckout && !isPaid
        ? (
          <p className="text-sm text-muted-foreground">
            Members can view billing, but only admins and owners can manage it.
          </p>
        )
        : null}
    </section>
  );
}
