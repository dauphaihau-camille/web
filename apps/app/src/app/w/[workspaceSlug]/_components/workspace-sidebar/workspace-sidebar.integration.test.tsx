import { render, screen } from '@testing-library/react';

import { SidebarProvider } from '@/components/ui/sidebar';
import type * as DocumentDomain from '@/domains/document';
import type * as FavoriteDomain from '@/domains/favorite';
import type * as WorkspaceDomain from '@/domains/workspace';

import { WorkspaceSidebar } from './workspace-sidebar';

const {
  useWorkspaceDocumentRootQueryMock,
  useWorkspaceFavoritesQueryMock,
  useWorkspaceQueryMock,
} = vi.hoisted(() => ({
  useWorkspaceDocumentRootQueryMock: vi.fn(),
  useWorkspaceFavoritesQueryMock: vi.fn(),
  useWorkspaceQueryMock: vi.fn(),
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

vi.mock('../workspace-user-dropdown', () => ({
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
      data: { name: 'Acme', current_user_role: 'admin' },
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
});
