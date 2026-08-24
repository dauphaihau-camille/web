'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

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

const subscriptionStatusLabels: Partial<Record<SubscriptionStatus, string>> = {
  past_due: 'Payment issue',
  canceling: 'Cancels at period end',
};

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

  const usageLabel = subscription.block_limit === null
    ? `${subscription.block_count.toLocaleString()} blocks`
    : `${subscription.block_count.toLocaleString()} / ${subscription.block_limit.toLocaleString()} blocks`;

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
    <section className="rounded-2xl border bg-muted/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Current plan</p>
          <p className="text-3xl font-semibold capitalize">{subscription.plan}</p>
          {subscriptionStatusLabel
            ? (
              <p className="text-sm text-muted-foreground">
                Status: <span>{subscriptionStatusLabel}</span>
              </p>
            )
            : null}
        </div>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <UsageMetric label="Seats" value={subscription.seat_count.toLocaleString()} />
        <UsageMetric label="Block usage" value={usageLabel} />
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        {isPaid
          ? (
            <Button
              variant="outline"
              disabled={!canCancel || cancelMutation.isPending || subscription.cancel_at_period_end}
              onClick={() => cancelMutation.mutate()}
            >
              {subscription.cancel_at_period_end ? 'Cancellation scheduled' : 'Cancel Plus'}
            </Button>
          )
          : (
            <Button
              disabled={!canStartCheckout || checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
            >
              {checkoutMutation.isPending ? 'Starting checkout...' : 'Upgrade to Plus'}
            </Button>
          )}
      </div>

      {!canStartCheckout
        ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Members can view billing, but only admins and owners can manage it.
          </p>
        )
        : null}
      {isPaid && !canCancel
        ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Only workspace owners can cancel Plus.
          </p>
        )
        : null}
    </section>
  );
}

function UsageMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
