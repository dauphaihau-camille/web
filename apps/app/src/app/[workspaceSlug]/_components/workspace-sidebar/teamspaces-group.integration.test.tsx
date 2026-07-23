import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { SidebarProvider } from '@/components/ui/sidebar';
import type {
  useWorkspaceDocumentRootQuery,
  WorkspaceDocumentNavigation,
} from '@/domains/document';

import { TeamspacesGroup } from './teamspaces-group';

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

function createRootQuery(data: WorkspaceDocumentNavigation) {
  return {
    data,
    isError: false,
    isLoading: false,
  } as ReturnType<typeof useWorkspaceDocumentRootQuery>;
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

describe('TeamspacesGroup', () => {
  it('renders each teamspace with its document tree', () => {
    render(
      <SidebarProvider>
        <TeamspacesGroup
          workspaceSlug="acme"
          rootQuery={createRootQuery(createNavigationWithNestedTeamspaceDocument())}
          canEditDocuments
        />
      </SidebarProvider>,
    );

    expect(screen.getByText('Teamspaces')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Architecture Decisions')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.queryByText('No documents yet.')).not.toBeInTheDocument();
    expect(screen.getAllByText('actions:full')).toHaveLength(1);
  });

  it('keeps a read-only actions menu when editing is unavailable', () => {
    render(
      <SidebarProvider>
        <TeamspacesGroup
          workspaceSlug="acme"
          rootQuery={createRootQuery(createNavigationWithNestedTeamspaceDocument())}
          canEditDocuments={false}
        />
      </SidebarProvider>,
    );

    expect(screen.getAllByText('actions:readOnly')).toHaveLength(1);
  });

  it('does not make an empty teamspace collapsible', () => {
    render(
      <SidebarProvider>
        <TeamspacesGroup
          workspaceSlug="acme"
          rootQuery={createRootQuery(createNavigation())}
          canEditDocuments
        />
      </SidebarProvider>,
    );

    expect(screen.getByRole('button', { name: 'Product' })).not.toHaveAttribute('aria-expanded');
  });

  it('does not collapse a flat teamspace document list', () => {
    render(
      <SidebarProvider>
        <TeamspacesGroup
          workspaceSlug="acme"
          rootQuery={createRootQuery(createNavigation())}
          canEditDocuments
        />
      </SidebarProvider>,
    );

    const engineeringButton = screen.getByRole('button', { name: 'Engineering' });

    expect(engineeringButton).not.toHaveAttribute('aria-expanded');

    fireEvent.click(engineeringButton);

    expect(screen.getByText('Architecture Decisions')).toBeInTheDocument();
  });

  it('collapses the teamspaces group', () => {
    render(
      <SidebarProvider>
        <TeamspacesGroup
          workspaceSlug="acme"
          rootQuery={createRootQuery(createNavigationWithNestedTeamspaceDocument())}
          canEditDocuments
        />
      </SidebarProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Teamspaces' }));

    expect(screen.getByText('Engineering').closest('[hidden]')).not.toBeNull();
  });

  it('collapses a teamspace document tree when the teamspace row is clicked', () => {
    render(
      <SidebarProvider>
        <TeamspacesGroup
          workspaceSlug="acme"
          rootQuery={createRootQuery(createNavigationWithNestedTeamspaceDocument())}
          canEditDocuments
        />
      </SidebarProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Engineering' }));

    expect(screen.queryByText('Architecture Decisions')).not.toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
  });
});
