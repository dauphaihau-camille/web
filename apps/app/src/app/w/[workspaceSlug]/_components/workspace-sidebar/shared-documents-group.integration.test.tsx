import {
  render,
  screen,
} from '@testing-library/react';

import { SidebarProvider } from '@/components/ui/sidebar';
import type {
  useWorkspaceDocumentRootQuery,
  WorkspaceDocumentNavigation,
} from '@/domains/document';

import { SharedDocumentsGroup } from './shared-documents-group';

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('../document-tree/document-tree-list/document-tree-list', () => ({
  DocumentTreeList: ({
    actionMode,
    getActionMode,
    items,
  }: {
    actionMode?: string;
    getActionMode?: (item: { is_owned_by_current_user?: boolean }) => string;
    items: Array<{ is_owned_by_current_user?: boolean; title: string }>;
  }) => (
    <div>
      {items.map((item) => (
        <p key={item.title}>
          {`${item.title}:actions:${getActionMode?.(item) ?? actionMode ?? 'full'}`}
        </p>
      ))}
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

function createNavigation(
  sharedItems: WorkspaceDocumentNavigation['shared_documents']['items'],
): WorkspaceDocumentNavigation {
  return {
    private_documents: {
      items: [],
      next_cursor: undefined,
    },
    shared_documents: {
      items: sharedItems,
      next_cursor: undefined,
    },
    teamspaces: [],
  };
}

describe('SharedDocumentsGroup', () => {
  it('renders directly shared documents as read-only', () => {
    render(
      <SidebarProvider>
        <SharedDocumentsGroup
          workspaceSlug="acme"
          rootQuery={createRootQuery(createNavigation([
            {
              id: 'doc-1',
              public_id: 'public-doc-1',
              access_scope: 'shared',
              is_owned_by_current_user: false,
              title: 'Shared plan',
              teamspace_id: undefined,
              parent_document_id: undefined,
              sort_key: 10,
              has_children: false,
              has_content: true,
              is_favorite: false,
            },
          ]))}
        />
      </SidebarProvider>,
    );

    expect(screen.getByText('Shared')).toBeInTheDocument();
    expect(screen.getByText('Shared plan:actions:readOnly')).toBeInTheDocument();
  });

  it('renders owner-owned shared documents with full actions', () => {
    render(
      <SidebarProvider>
        <SharedDocumentsGroup
          workspaceSlug="acme"
          rootQuery={createRootQuery(createNavigation([
            {
              id: 'doc-1',
              public_id: 'public-doc-1',
              access_scope: 'shared',
              is_owned_by_current_user: true,
              title: 'Owner shared plan',
              teamspace_id: undefined,
              parent_document_id: undefined,
              sort_key: 10,
              has_children: false,
              has_content: true,
              is_favorite: false,
            },
          ]))}
        />
      </SidebarProvider>,
    );

    expect(screen.getByText('Shared')).toBeInTheDocument();
    expect(screen.getByText('Owner shared plan:actions:full')).toBeInTheDocument();
  });

  it('does not render when there are no directly shared documents', () => {
    render(
      <SidebarProvider>
        <SharedDocumentsGroup
          workspaceSlug="acme"
          rootQuery={createRootQuery(createNavigation([]))}
        />
      </SidebarProvider>,
    );

    expect(screen.queryByText('Shared')).not.toBeInTheDocument();
  });
});
