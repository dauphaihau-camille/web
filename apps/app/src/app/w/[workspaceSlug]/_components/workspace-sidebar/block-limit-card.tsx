'use client';

import Link from 'next/link';

import { Progress } from '@/components/ui/progress';
import { useSubscriptionSummaryQuery } from '@/domains/subscription';
import { workspaceRoutes } from '@/domains/workspace';
import type { Workspace } from '@/domains/workspace';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';

const NEAR_LIMIT_RATIO = 0.8;
const HIGH_LIMIT_RATIO = 0.95;

export function BlockLimitCard({
  workspace,
  workspaceSlug,
}: {
  workspace: Workspace;
  workspaceSlug: string;
}) {
  const subscriptionQuery = useSubscriptionSummaryQuery(workspace.id);
  const subscription = subscriptionQuery.data;

  if (
    !subscription
    || subscription.plan !== 'free'
    || subscription.block_limit === null
  ) {
    return null;
  }

  const usageRatio = subscription.block_count / subscription.block_limit;

  if (usageRatio < NEAR_LIMIT_RATIO) {
    return null;
  }

  const usagePercent = Math.min(100, Math.round(usageRatio * 100));
  const isHighUsage = usageRatio >= HIGH_LIMIT_RATIO;

  const title = usageRatio >= 1
    ? 'Upgrade to keep creating blocks'
    : isHighUsage
      ? 'Almost at your block limit'
      : 'Workspace block limit';

  return (
    <aside className="shrink-0 bg-sidebar p-3">
      <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3">
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-sidebar-foreground">
              {title}
            </p>
            <p
              className={cn(
                'text-xs leading-5 text-sidebar-foreground/90 font-medium',
                isHighUsage ? 'text-destructive-surface-foreground' : '',
              )}
            >
              This workspace has used{' '}
              {subscription.block_count.toLocaleString()} of its{' '}
              {subscription.block_limit.toLocaleString()} block limit (
              {usagePercent}
              %).
            </p>
          </div>

          <Progress
            value={usagePercent}
            aria-label="Workspace block usage"
            aria-valuetext={`${subscription.block_count} of ${subscription.block_limit} blocks`}
            className={cn(
              'h-1.5 bg-sidebar-border [&_[data-slot=progress-indicator]]:bg-sidebar-foreground/70',
              isHighUsage
                ? '[&_[data-slot=progress-indicator]]:bg-destructive-surface-foreground'
                : '',
            )}
          />

          <Button
            variant="link"
            size="sm"
            className="h-auto justify-start p-0 text-sidebar-foreground"
            render={(
              <Link href={workspaceRoutes.settingsBilling(workspaceSlug)} />
            )}
          >
            Upgrade plan
          </Button>
        </div>
      </div>
    </aside>
  );
}
