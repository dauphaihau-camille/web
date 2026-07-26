import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { SidebarProvider } from '@/components/ui/sidebar';
import type {
  Document,
  useWorkspaceDocumentRootQuery,
  WorkspaceDocumentNavigation,
} from '@/domains/document';
import type * as DocumentDomain from '@/domains/document';
import { documentKeys } from '@/domains/document';

import { TeamspacesGroup } from './teamspaces-group';

const {
  createRootDocumentMock,
  pushMock,
} = vi.hoisted(() => ({
  createRootDocumentMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('@/domains/document', async () => {
  const actual = await vi.importActual<typeof DocumentDomain>(
    '@/domains/document',
  );

  return {
    ...actual,
    createRootDocument: createRootDocumentMock,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('../document-tree/document-tree-list/document-tree-list', () => ({
  DocumentTreeList: ({
    actionMode,
    emptyMessage,
    items,
  }: {
    actionMode?: string;
    emptyMessage: string;
    items: Array<{ title: string }>;
  }) => (
    <div>
      <p>{`actions:${actionMode ?? 'full'}`}</p>
      {items.length === 0
        ? <p>{emptyMessage}</p>
        : items.map((item) => <p key={item.title}>{item.title}</p>)}
    </div>
  ),
}));

vi.mock('../create-teamspace-dialog', () => ({
  CreateTeamspaceDialog: () => null,
}));

function createRootQuery(data: WorkspaceDocumentNavigation) {
  return {
    data,
    isError: false,
    isLoading: false,
  } as ReturnType<typeof useWorkspaceDocumentRootQuery>;
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return {
    queryClient,
    Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <SidebarProvider>{children}</SidebarProvider>
        </QueryClientProvider>
      );
    },
  };
}

function createNavigation(): WorkspaceDocumentNavigation {
  return {
    private_documents: {
      items: [],
      next_cursor: undefined,
    },
    shared_documents: {
      items: [],
      next_cursor: undefined,
    },
    teamspaces: [
      {
        id: 'teamspace-1',
        name: 'Engineering',
        description: 'Engineering docs',
        documents: {
          items: [
            {
              id: 'doc-1',
              public_id: 'public-doc-1',
              title: 'Architecture Decisions',
              teamspace_id: 'teamspace-1',
              parent_document_id: undefined,
              sort_key: 10,
              has_children: false,
              has_content: true,
              is_favorite: false,
            },
          ],
          next_cursor: undefined,
        },
      },
      {
        id: 'teamspace-2',
        name: 'Product',
        description: 'Product docs',
        documents: {
          items: [],
          next_cursor: undefined,
        },
      },
    ],
  };
}

const createdTeamspaceDocumentFixture: Document = {
  id: 'doc-2',
  public_id: 'public-doc-2',
  version: 1,
  workspace_id: 'acme',
  owner_user_id: 'user-1',
  teamspace_id: 'teamspace-1',
  parent_document_id: undefined,
  title: 'Untitled',
  content_format: 'blocknote_v1',
  content: [],
  sort_key: 20,
  archived_at: undefined,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  breadcrumb: [],
};

function createNavigationWithNestedTeamspaceDocument(): WorkspaceDocumentNavigation {
  const navigation = createNavigation();

  return {
    ...navigation,
    teamspaces: navigation.teamspaces.map((teamspace) =>
      teamspace.id === 'teamspace-1'
        ? {
          ...teamspace,
          documents: {
            ...teamspace.documents,
            items: teamspace.documents.items.map((document) => ({
              ...document,
              has_children: true,
            })),
          },
        }
        : teamspace),
  };
}

function renderTeamspacesGroup(
  navigation: WorkspaceDocumentNavigation,
  canEditDocuments = true,
) {
  const wrapper = createWrapper();

  render(
    <TeamspacesGroup
      workspaceSlug="acme"
      rootQuery={createRootQuery(navigation)}
      canEditDocuments={canEditDocuments}
    />,
    { wrapper: wrapper.Wrapper },
  );

  return wrapper;
}

describe('TeamspacesGroup', () => {
  beforeEach(() => {
    createRootDocumentMock.mockReset();
    pushMock.mockReset();
  });

  it('renders each teamspace with its document tree', () => {
    renderTeamspacesGroup(createNavigationWithNestedTeamspaceDocument());

    expect(screen.getByText('Teamspaces')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Architecture Decisions')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New teamspace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add document to Engineering' })).toBeInTheDocument();
    expect(screen.queryByText('No documents yet.')).not.toBeInTheDocument();
    expect(screen.getAllByText('actions:full')).toHaveLength(1);
  });

  it('keeps a read-only actions menu when editing is unavailable', () => {
    renderTeamspacesGroup(createNavigationWithNestedTeamspaceDocument(), false);

    expect(screen.getAllByText('actions:readOnly')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Add document to Engineering' })).not.toBeInTheDocument();
  });

  it('does not make an empty teamspace collapsible', () => {
    renderTeamspacesGroup(createNavigation());

    expect(screen.getByRole('button', { name: 'Product' })).not.toHaveAttribute('aria-expanded');
  });

  it('does not collapse a flat teamspace document list', () => {
    renderTeamspacesGroup(createNavigation());

    const engineeringButton = screen.getByRole('button', { name: 'Engineering' });

    expect(engineeringButton).not.toHaveAttribute('aria-expanded');

    fireEvent.click(engineeringButton);

    expect(screen.getByText('Architecture Decisions')).toBeInTheDocument();
  });

  it('collapses the teamspaces group', () => {
    renderTeamspacesGroup(createNavigationWithNestedTeamspaceDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Teamspaces' }));

    expect(screen.getByText('Engineering').closest('[hidden]')).not.toBeNull();
  });

  it('collapses a teamspace document tree when the teamspace row is clicked', () => {
    renderTeamspacesGroup(createNavigationWithNestedTeamspaceDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Engineering' }));

    expect(screen.queryByText('Architecture Decisions')).not.toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
  });

  it('creates a root document inside the selected teamspace', async () => {
    createRootDocumentMock.mockResolvedValue(createdTeamspaceDocumentFixture);
    const navigation = createNavigation();
    const { queryClient } = renderTeamspacesGroup(navigation);

    queryClient.setQueryData(
      documentKeys.rootList('acme', 10),
      navigation,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add document to Engineering' }));

    await waitFor(() => {
      expect(createRootDocumentMock).toHaveBeenCalledWith({
        workspace_id: 'acme',
        teamspace_id: 'teamspace-1',
      });
      expect(
        queryClient
          .getQueryData<WorkspaceDocumentNavigation>(
            documentKeys.rootList('acme', 10),
          )
          ?.teamspaces[0]?.documents.items,
      ).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: createdTeamspaceDocumentFixture.id,
          teamspace_id: 'teamspace-1',
          parent_document_id: undefined,
        }),
        expect.objectContaining({
          id: 'doc-1',
        }),
      ]));
      expect(pushMock).toHaveBeenCalledWith('/acme/untitled-public-doc-2');
    });
  });
});
