import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type * as SubscriptionDomain from '@/domains/subscription';
import type { CheckoutSession, SubscriptionSummary } from '@/domains/subscription';
import { subscriptionSummarySchema } from '@/domains/subscription';
import type { Workspace } from '@/domains/workspace';
import { renderWithProviders } from '@shared/test/render';
import { BillingPanel } from './billing-panel';

const { assignMock, createCheckoutSessionMock } = vi.hoisted(() => ({
  assignMock: vi.fn<(url: string) => void>(),
  createCheckoutSessionMock: vi.fn<(
    workspaceId: string,
    input?: { return_url?: string },
  ) => Promise<CheckoutSession>>(),
}));

vi.mock('@/domains/subscription', async () => {
  const actual = await vi.importActual<typeof SubscriptionDomain>(
    '@/domains/subscription',
  );

  return {
    ...actual,
    createCheckoutSession: createCheckoutSessionMock,
  };
});

const workspaceFixture: Workspace = {
  id: 'workspace-1',
  version: 1,
  name: 'Acme Product',
  slug: 'acme-product',
  description: 'Shared docs and planning',
  current_user_role: 'owner',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const subscriptionFixture: SubscriptionSummary = {
  workspace_id: 'workspace-1',
  plan: 'free',
  status: 'free',
  seat_count: 2,
  block_count: 900,
  block_limit: 1000,
  entitlements: {
    max_blocks: 1000,
  },
  cancel_at_period_end: false,
};

describe('BillingPanel integration', () => {
  const originalLocation = window.location;

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        assign: assignMock,
        href: 'http://localhost:5102/w/acme-product/settings/billing',
      },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  beforeEach(() => {
    assignMock.mockReset();
    createCheckoutSessionMock.mockReset();
  });

  it('shows the current Free plan and upgrade features', () => {
    renderWithProviders(
      <BillingPanel
        workspace={workspaceFixture}
        initialSubscription={subscriptionFixture}
      />,
    );

    expect(screen.getByText('free plan')).toBeInTheDocument();
    expect(screen.getByText('Free for all users · 2 users')).toBeInTheDocument();
    expect(screen.queryByText(/Status:/)).not.toBeInTheDocument();
    expect(screen.getByText('Upgrade to Plus plan')).toBeInTheDocument();
    expect(screen.getByText('$12 per user/mo')).toBeInTheDocument();
    expect(screen.getByText('Unlimited blocks')).toBeInTheDocument();
    expect(screen.getByText('Unlimited workspace members')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upgrade now' }),
    ).toBeEnabled();
  });

  it('shows customer-friendly copy for a past due Plus subscription', () => {
    renderWithProviders(
      <BillingPanel
        workspace={workspaceFixture}
        initialSubscription={{
          ...subscriptionFixture,
          plan: 'plus',
          status: 'past_due',
          block_limit: null,
          entitlements: {
            max_blocks: null,
          },
        }}
      />,
    );

    expect(screen.getByText('plus plan')).toBeInTheDocument();
    expect(screen.getByText('Payment issue')).toBeInTheDocument();
    expect(screen.queryByText('past_due')).not.toBeInTheDocument();
  });

  it('accepts Free subscription summaries without a provider status', () => {
    expect(subscriptionSummarySchema.parse({
      ...subscriptionFixture,
      provider_status: null,
    })).toMatchObject({
      provider_status: null,
      plan: 'free',
    });
  });

  it('starts checkout when an owner upgrades to Plus', async () => {
    const user = userEvent.setup();
    createCheckoutSessionMock.mockResolvedValue({
      session_id: 'checkout-1',
      checkout_url: 'https://billing.example/checkout-1',
    });

    renderWithProviders(
      <BillingPanel
        workspace={workspaceFixture}
        initialSubscription={subscriptionFixture}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Upgrade now' }));

    expect(createCheckoutSessionMock).toHaveBeenCalledWith('workspace-1', {
      return_url: 'http://localhost:5102/w/acme-product/settings/billing',
    });
    expect(assignMock).toHaveBeenCalledWith('https://billing.example/checkout-1');
  });
});
