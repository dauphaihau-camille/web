import { render, screen } from '@testing-library/react';

import { SidebarProvider } from '@/components/ui/sidebar';
import type * as DocumentDomain from '@/domains/document';
import type * as FavoriteDomain from '@/domains/favorite';
import type * as SubscriptionDomain from '@/domains/subscription';
import type * as WorkspaceDomain from '@/domains/workspace';

import { WorkspaceSidebar } from './workspace-sidebar';

const {
  useWorkspaceDocumentRootQueryMock,
  useWorkspaceFavoritesQueryMock,
  useWorkspaceQueryMock,
  useSubscriptionSummaryQueryMock,
} = vi.hoisted(() => ({
  useWorkspaceDocumentRootQueryMock: vi.fn(),
  useWorkspaceFavoritesQueryMock: vi.fn(),
  useWorkspaceQueryMock: vi.fn(),
  useSubscriptionSummaryQueryMock: vi.fn(),
}));

vi.mock('@/domains/document', async () => {
  const actual = await vi.importActual<typeof DocumentDomain>(
    '@/domains/document',
  );

  return {
    ...actual,
    useWorkspaceDocumentRootQuery: useWorkspaceDocumentRootQueryMock,
  };
});

vi.mock('@/domains/favorite', async () => {
  const actual = await vi.importActual<typeof FavoriteDomain>(
    '@/domains/favorite',
  );

  return {
    ...actual,
    useWorkspaceFavoritesQuery: useWorkspaceFavoritesQueryMock,
  };
});

vi.mock('@/domains/subscription', async () => {
  const actual = await vi.importActual<typeof SubscriptionDomain>(
    '@/domains/subscription',
  );

  return {
    ...actual,
    useSubscriptionSummaryQuery: useSubscriptionSummaryQueryMock,
  };
});

vi.mock('@/domains/workspace', async () => {
  const actual = await vi.importActual<typeof WorkspaceDomain>(
    '@/domains/workspace',
  );

  return {
    ...actual,
    useWorkspaceQuery: useWorkspaceQueryMock,
  };
});

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('./workspace-user-dropdown', () => ({
  WorkspaceUserDropdown: ({ workspaceSlug, workspace }: { workspaceSlug: string; workspace?: { name: string } }) => <div>{workspace ? `user:${workspace.name}` : `user:${workspaceSlug}`}</div>,
}));

vi.mock('./workspace-search-button', () => ({
  WorkspaceSearchButton: ({ workspaceSlug }: { workspaceSlug: string }) => <div>{`search:${workspaceSlug}`}</div>,
}));

vi.mock('./workspace-trash-button/workspace-trash-button', () => ({
  WorkspaceTrashButton: ({ workspaceSlug }: { workspaceSlug: string }) => <div>{`trash:${workspaceSlug}`}</div>,
}));

vi.mock('../workspace-skeleton/workspace-sidebar-tree-skeleton', () => ({
  WorkspaceSidebarTreeSkeleton: () => <div>tree-skeleton</div>,
}));

vi.mock('../workspace-skeleton/workspace-sidebar-actions-skeleton', () => ({
  WorkspaceSidebarActionsSkeleton: () => <div>actions-skeleton</div>,
}));

vi.mock('./favorites-documents-group', () => ({
  FavoritesDocumentsGroup: ({ workspaceSlug }: { workspaceSlug: string }) => <div>{`favorites:${workspaceSlug}`}</div>,
}));

vi.mock('./private-documents-group', () => ({
  PrivateDocumentsGroup: ({ workspaceSlug }: { workspaceSlug: string }) => <div>{`private:${workspaceSlug}`}</div>,
}));

vi.mock('./teamspaces-group', () => ({
  TeamspacesGroup: ({
    canEditDocuments,
    workspaceSlug,
  }: {
    canEditDocuments: boolean;
    workspaceSlug: string;
  }) => <div>{`teamspaces:${workspaceSlug}:${canEditDocuments ? 'editable' : 'readonly'}`}</div>,
}));

vi.mock('./shared-documents-group', () => ({
  SharedDocumentsGroup: ({ workspaceSlug }: { workspaceSlug: string }) => <div>{`shared:${workspaceSlug}`}</div>,
}));

describe('WorkspaceSidebar', () => {
  beforeEach(() => {
    useWorkspaceDocumentRootQueryMock.mockReset();
    useWorkspaceFavoritesQueryMock.mockReset();
    useWorkspaceQueryMock.mockReset();
    useSubscriptionSummaryQueryMock.mockReset();
    useSubscriptionSummaryQueryMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isLoading: false,
    });
  });

  it('shows a combined tree skeleton during the initial sidebar load', () => {
    useWorkspaceQueryMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isLoading: true,
    });
    useWorkspaceFavoritesQueryMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isLoading: true,
    });
    useWorkspaceDocumentRootQueryMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isLoading: true,
    });

    render(
      <SidebarProvider>
        <WorkspaceSidebar workspaceSlug="acme" />
      </SidebarProvider>,
    );

    expect(screen.getByText('actions-skeleton')).toBeInTheDocument();
    expect(screen.getByText('tree-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('favorites:acme')).not.toBeInTheDocument();
    expect(screen.queryByText('private:acme')).not.toBeInTheDocument();
  });

  it('renders the groups once either query has resolved data', () => {
    useWorkspaceQueryMock.mockReturnValue({
      data: {
        id: 'workspace-1',
        name: 'Acme',
        current_user_role: 'admin',
      },
      isPending: false,
      isLoading: false,
    });
    useWorkspaceFavoritesQueryMock.mockReturnValue({
      data: [],
      isPending: false,
      isLoading: false,
    });
    useWorkspaceDocumentRootQueryMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isLoading: true,
    });

    render(
      <SidebarProvider>
        <WorkspaceSidebar workspaceSlug="acme" />
      </SidebarProvider>,
    );

    expect(screen.queryByText('actions-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByText('tree-skeleton')).not.toBeInTheDocument();
    expect(screen.getByText('favorites:acme')).toBeInTheDocument();
    expect(screen.getByText('private:acme')).toBeInTheDocument();
    expect(screen.getByText('teamspaces:acme:editable')).toBeInTheDocument();
    expect(screen.getByText('shared:acme')).toBeInTheDocument();
  });

  it('shows a fixed bottom upgrade card when a Free workspace is near its block limit', () => {
    useWorkspaceQueryMock.mockReturnValue({
      data: {
        id: 'workspace-1',
        name: 'Acme',
        current_user_role: 'owner',
      },
      isPending: false,
      isLoading: false,
    });
    useWorkspaceFavoritesQueryMock.mockReturnValue({
      data: [],
      isPending: false,
      isLoading: false,
    });
    useWorkspaceDocumentRootQueryMock.mockReturnValue({
      data: [],
      isPending: false,
      isLoading: false,
    });
    useSubscriptionSummaryQueryMock.mockReturnValue({
      data: {
        workspace_id: 'workspace-1',
        plan: 'free',
        status: 'free',
        seat_count: 2,
        block_count: 999,
        block_limit: 1000,
        entitlements: {
          max_blocks: 1000,
        },
        cancel_at_period_end: false,
      },
      isPending: false,
      isLoading: false,
    });

    render(
      <SidebarProvider>
        <WorkspaceSidebar workspaceSlug="acme" />
      </SidebarProvider>,
    );

    expect(screen.getByText('Almost at your block limit')).toBeInTheDocument();
    expect(screen.getByText(/999 of its 1,000 block limit/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Workspace block usage' }))
      .toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByRole('progressbar', { name: 'Workspace block usage' }))
      .toHaveAttribute('aria-valuetext', '999 of 1000 blocks');
    expect(screen.getByRole('button', { name: 'Upgrade plan' }))
      .toHaveAttribute('href', '/w/acme/settings/billing');
  });

  it('does not show the upgrade card for unlimited workspaces', () => {
    useWorkspaceQueryMock.mockReturnValue({
      data: {
        id: 'workspace-1',
        name: 'Acme',
        current_user_role: 'owner',
      },
      isPending: false,
      isLoading: false,
    });
    useWorkspaceFavoritesQueryMock.mockReturnValue({
      data: [],
      isPending: false,
      isLoading: false,
    });
    useWorkspaceDocumentRootQueryMock.mockReturnValue({
      data: [],
      isPending: false,
      isLoading: false,
    });
    useSubscriptionSummaryQueryMock.mockReturnValue({
      data: {
        workspace_id: 'workspace-1',
        plan: 'plus',
        status: 'active',
        seat_count: 2,
        block_count: 1200,
        block_limit: null,
        entitlements: {
          max_blocks: null,
        },
        cancel_at_period_end: false,
      },
      isPending: false,
      isLoading: false,
    });

    render(
      <SidebarProvider>
        <WorkspaceSidebar workspaceSlug="acme" />
      </SidebarProvider>,
    );

    expect(screen.queryByText('Upgrade plan')).not.toBeInTheDocument();
  });
});
