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
  DocumentTree: ({ workspaceSlug }: { workspaceSlug: string }) => <div>{`private-tree:${workspaceSlug}`}</div>,
}));

describe('PrivateDocumentsGroup', () => {
  beforeEach(() => {
    useWorkspaceDocumentRootQueryMock.mockReset();
  });

  it('renders the private document tree inside the group shell', () => {
    renderWithProviders(<PrivateDocumentsGroup workspaceSlug="acme" />);

    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('private-tree:acme')).toBeInTheDocument();
  });
});
