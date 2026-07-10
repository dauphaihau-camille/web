import { screen } from '@testing-library/react';

import type * as DocumentDomain from '@/domains/document';
import { renderWithProviders } from '@shared/test/render';

import { PrivateDocumentsGroup } from './private-documents-group';

const { useWorkspaceDocumentRootQueryMock } = vi.hoisted(() => ({
  useWorkspaceDocumentRootQueryMock: vi.fn(),
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

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('../document-tree/document-tree', () => ({
  DocumentTree: () => <div>private-tree</div>,
}));

vi.mock('../document-tree/document-tree-loading', () => ({
  DocumentTreeLoading: () => <div>loading-tree</div>,
}));

vi.mock('../document-tree/document-tree-list', () => ({
  DocumentTreeList: ({ items }: { items: Array<{ title: string }> }) => (
    <div>{items.map((item) => item.title).join(', ')}</div>
  ),
}));

describe('PrivateDocumentsGroup', () => {
  beforeEach(() => {
    useWorkspaceDocumentRootQueryMock.mockReset();
  });

  it('renders teamspace groups for seeded workspace documents', () => {
    useWorkspaceDocumentRootQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        private_documents: {
          items: [],
        },
        teamspaces: [
          {
            id: 'general-teamspace',
            name: 'General',
            documents: {
              items: [
                {
                  id: 'home-doc',
                  public_id: 'home-public',
                  title: 'Home',
                  teamspace_id: 'general-teamspace',
                  parent_document_id: undefined,
                  sort_key: 0,
                  has_children: false,
                  has_content: true,
                  is_favorite: false,
                },
              ],
            },
          },
        ],
      },
    });

    renderWithProviders(<PrivateDocumentsGroup workspaceSlug="acme" />);

    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});
