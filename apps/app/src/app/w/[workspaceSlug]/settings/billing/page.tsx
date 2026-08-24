import { requireCurrentUserServer } from '@/domains/auth/api/auth.server.requests';
import { getSubscriptionSummaryServer } from '@/domains/subscription/api/subscription.server.requests';
import { workspaceRoutes } from '@/domains/workspace';
import { getWorkspaceServer } from '@/domains/workspace/api/workspace.server.requests';
import { BillingPanel } from './_components/billing-panel';

export default async function WorkspaceBillingPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };
  await requireCurrentUserServer(workspaceRoutes.settingsBilling(workspaceSlug));

  const workspace = await getWorkspaceServer(workspaceSlug);
  const subscription = await getSubscriptionSummaryServer(workspace.id);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Billing</h2>
        <p className="text-sm text-muted-foreground">
          Manage this workspace subscription and usage.
        </p>
      </div>
      <BillingPanel workspace={workspace} initialSubscription={subscription} />
    </section>
  );
}
