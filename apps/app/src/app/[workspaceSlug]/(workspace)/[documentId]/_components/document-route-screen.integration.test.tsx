import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import type * as DocumentDomain from '@/domains/document';
import type { Document } from '@/domains/document';
import { workspaceRoutes } from '@/domains/workspace';

import { DocumentRouteScreen } from './document-route-screen';

const {
  replaceMock,
  useDocumentQueryMock,
} = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  useDocumentQueryMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/acme-product/private-doc-4ec5b7fac06c3796d684e145a7fcc1cc',
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('@/domains/document', async () => {
  const actual = await vi.importActual<typeof DocumentDomain>('@/domains/document');

  return {
    ...actual,
    useDocumentQuery: useDocumentQueryMock,
  };
});

vi.mock('./document-screen/document-screen', () => ({
  DocumentScreen: ({ document }: { document: Document }) => (
    <div>{`document:${document.title}`}</div>
  ),
}));

vi.mock('../../../_components/workspace-skeleton/document-screen-skeleton', () => ({
  DocumentScreenSkeleton: () => <div>Loading document</div>,
}));

const documentFixture: Document = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 1,
  workspace_id: 'northwind-ops',
  owner_user_id: 'user-1',
  teamspace_id: undefined,
  parent_document_id: undefined,
  title: 'Account Health Review',
  content_format: 'blocknote_v1',
  content: [],
  sort_key: 10,
  archived_at: undefined,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function documentQueryResult(input: {
  data?: Document;
  isError?: boolean;
  isPending?: boolean;
}) {
  return {
    data: input.data,
    isError: input.isError ?? false,
    isPending: input.isPending ?? false,
    refetch: vi.fn(),
  };
}

describe('DocumentRouteScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    replaceMock.mockReset();
    useDocumentQueryMock.mockReset();
  });

  it('stores the last successfully loaded document route', async () => {
    useDocumentQueryMock.mockImplementation((documentId: string) =>
      documentQueryResult({
        data: documentId === documentFixture.public_id || documentId === documentFixture.id
          ? documentFixture
          : undefined,
      }));

    render(
      <DocumentRouteScreen
        documentId={documentFixture.public_id}
        workspaceSlug="northwind-ops"
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('document:Account Health Review')).toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem('last-valid-document-route')).toBe(
        workspaceRoutes.document(
          'northwind-ops',
          documentFixture.public_id,
          documentFixture.title,
        ),
      );
    });
  });

  it('redirects failed document loads to the last valid document route', async () => {
    const lastValidRoute = workspaceRoutes.document(
      'northwind-ops',
      documentFixture.public_id,
      documentFixture.title,
    );
    localStorage.setItem('last-valid-document-route', lastValidRoute);
    useDocumentQueryMock.mockImplementation((_documentId: string, options?: { enabled?: boolean }) =>
      documentQueryResult({
        isError: options?.enabled === false ? false : true,
        isPending: false,
      }));

    render(
      <DocumentRouteScreen
        documentId="4ec5b7fac06c3796d684e145a7fcc1cc"
        workspaceSlug="acme-product"
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(lastValidRoute);
    });
  });

  it('redirects failed document loads to workspace entry without a last valid route', async () => {
    useDocumentQueryMock.mockImplementation((_documentId: string, options?: { enabled?: boolean }) =>
      documentQueryResult({
        isError: options?.enabled === false ? false : true,
        isPending: false,
      }));

    render(
      <DocumentRouteScreen
        documentId="4ec5b7fac06c3796d684e145a7fcc1cc"
        workspaceSlug="acme-product"
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(workspaceRoutes.entry());
    });
  });
});
