import { render, screen } from '@testing-library/react';

import { FavoritesDocumentsGroup } from './favorites-documents-group';

const { useWorkspaceFavoritesQueryMock } = vi.hoisted(() => ({
  useWorkspaceFavoritesQueryMock: vi.fn(),
}));

vi.mock('@/domains/favorite', () => {
  return {
    useWorkspaceFavoritesQuery: useWorkspaceFavoritesQueryMock,
  };
});

vi.mock('../document-tree/document-tree-loading', () => ({
  DocumentTreeLoading: () => <div>loading-tree</div>,
}));

vi.mock('../document-tree/document-tree-list/document-tree-list', () => ({
  DocumentTreeList: ({ items }: { items: Array<{ title: string; has_children: boolean; has_content: boolean }> }) => (
    <div>
      {items.map((item) => `${item.title}:${item.has_children ? 'children' : 'leaf'}:${item.has_content ? 'content' : 'empty'}`).join('|')}
    </div>
  ),
}));

describe('FavoritesDocumentsGroup', () => {
  beforeEach(() => {
    useWorkspaceFavoritesQueryMock.mockReset();
  });

  it('passes through favorite navigation metadata to the document tree', () => {
    useWorkspaceFavoritesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          document_id: 'document-1',
          public_id: 'public-1',
          workspace_id: 'acme',
          teamspace_id: undefined,
          parent_document_id: undefined,
          title: 'Parent favorite',
          sort_key: 1,
          has_children: true,
          has_content: true,
          favorited_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    render(<FavoritesDocumentsGroup workspaceSlug="acme" />);

    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('Parent favorite:children:content')).toBeInTheDocument();
  });
});
