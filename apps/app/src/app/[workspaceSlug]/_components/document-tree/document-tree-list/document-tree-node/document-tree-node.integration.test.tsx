import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type * as DocumentDomain from '@/domains/document';
import type { DocumentNavigationNode } from '@/domains/document';
import { renderWithProviders } from '@shared/test/render';

import { DocumentTreeNode } from './document-tree-node';

const { useWorkspaceDocumentChildrenQueryMock } = vi.hoisted(() => ({
  useWorkspaceDocumentChildrenQueryMock: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: ComponentProps<'a'>) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/domains/document', async () => {
  const actual = await vi.importActual<typeof DocumentDomain>(
    '@/domains/document',
  );

  return {
    ...actual,
    useWorkspaceDocumentChildrenQuery: useWorkspaceDocumentChildrenQueryMock,
  };
});

vi.mock('./document-tree-node-actions', () => ({
  DocumentTreeNodeActions: () => null,
}));

const parentDocument: DocumentNavigationNode = {
  id: 'parent-1',
  public_id: 'pub-parent-1',
  title: 'Parent Document',
  teamspace_id: undefined,
  parent_document_id: undefined,
  sort_key: 10,
  has_children: true,
  has_content: true,
  is_favorite: false,
};

const childDocuments: DocumentNavigationNode[] = [
  {
    id: 'child-1',
    public_id: 'pub-child-1',
    title: 'Alpha child',
    teamspace_id: undefined,
    parent_document_id: 'parent-1',
    sort_key: 1,
    has_children: false,
    has_content: true,
    is_favorite: false,
  },
  {
    id: 'child-2',
    public_id: 'pub-child-2',
    title: 'Newest child',
    teamspace_id: undefined,
    parent_document_id: 'parent-1',
    sort_key: 5,
    has_children: false,
    has_content: false,
    is_favorite: true,
  },
];

describe('DocumentTreeNode integration', () => {
  beforeEach(async () => {
    const { useDocumentTreeExpansionStore } = await import(
      '@/stores/document-tree-expansion-store',
    );
    const { useDocumentTitleDraftStore } = await import(
      '@/stores/document-title-draft-store',
    );

    localStorage.clear();
    useDocumentTreeExpansionStore.setState({
      expandedByWorkspace: {},
      hydratedWorkspaceIds: [],
    });
    useDocumentTitleDraftStore.setState({
      activeDocumentId: null,
      draftTitle: null,
    });

    useWorkspaceDocumentChildrenQueryMock.mockReset();
    useWorkspaceDocumentChildrenQueryMock.mockImplementation(
      (_workspaceSlug: string, _documentId: string, options?: { enabled?: boolean }) => ({
        data: options?.enabled
          ? {
            items: childDocuments,
          }
          : undefined,
        isLoading: false,
      }),
    );
  });

  it('enables the children query and renders sorted child documents after expand', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <DocumentTreeNode
        document={parentDocument}
        workspaceSlug="acme"
        pathname="/acme"
      />,
    );

    const expandButton = screen.getByRole('button', {
      name: 'Expand document children',
    });

    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Newest child')).not.toBeInTheDocument();

    await user.click(expandButton);

    expect(screen.getByRole('button', {
      name: 'Collapse document children',
    })).toHaveAttribute('aria-expanded', 'true');

    expect(useWorkspaceDocumentChildrenQueryMock.mock.calls).toContainEqual([
      'acme',
      'parent-1',
      expect.objectContaining({
        enabled: true,
      }),
    ]);

    const childTitles = screen.getAllByText(/child$/i).map((node) => node.textContent);

    expect(childTitles).toEqual(['Newest child', 'Alpha child']);
  });

  it('uses the draft title for the active document', async () => {
    const { useDocumentTitleDraftStore } = await import('@/stores/document-title-draft-store');

    useDocumentTitleDraftStore.getState().setDraftTitle('parent-1', 'Untitled draft');

    renderWithProviders(
      <DocumentTreeNode
        document={parentDocument}
        workspaceSlug="acme"
        pathname="/acme"
      />,
    );

    expect(screen.getByText('Untitled draft')).toBeInTheDocument();
    expect(screen.queryByText('Parent Document')).not.toBeInTheDocument();
  });
});
