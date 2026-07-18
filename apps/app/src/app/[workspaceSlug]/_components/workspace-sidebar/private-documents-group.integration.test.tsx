import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent, render, screen, waitFor, 
} from '@testing-library/react';
import type { ReactNode } from 'react';

import type * as DocumentDomain from '@/domains/document';
import {
  documentKeys,
  type Document,
  type WorkspaceDocumentNavigation,
} from '@/domains/document';

import { PrivateDocumentsGroup } from './private-documents-group';

const {
  createRootDocumentMock,
  pushMock,
  useWorkspaceDocumentRootQueryMock,
} = vi.hoisted(() => ({
  createRootDocumentMock: vi.fn(),
  pushMock: vi.fn(),
  useWorkspaceDocumentRootQueryMock: vi.fn(),
}));

vi.mock('@/domains/document', async () => {
  const actual = await vi.importActual<typeof DocumentDomain>(
    '@/domains/document',
  );

  return {
    ...actual,
    createRootDocument: createRootDocumentMock,
    useWorkspaceDocumentRootQuery: useWorkspaceDocumentRootQueryMock,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('../document-tree/document-tree', () => ({
  DocumentTree: ({ workspaceSlug }: { workspaceSlug: string }) => <div>{`private-tree:${workspaceSlug}`}</div>,
}));

const createdDocumentFixture: Document = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 1,
  workspace_id: 'acme',
  teamspace_id: undefined,
  parent_document_id: undefined,
  title: 'Untitled',
  content_format: 'blocknote_v1',
  content: [],
  sort_key: 10,
  archived_at: undefined,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  breadcrumb: [],
};

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
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
  };
}

function createNavigation(items: WorkspaceDocumentNavigation['private_documents']['items'] = []): WorkspaceDocumentNavigation {
  return {
    private_documents: {
      items,
      next_cursor: undefined,
    },
    teamspaces: [],
  } as WorkspaceDocumentNavigation;
}

describe('PrivateDocumentsGroup', () => {
  beforeEach(() => {
    createRootDocumentMock.mockReset();
    pushMock.mockReset();
    useWorkspaceDocumentRootQueryMock.mockReset();
  });

  it('renders the private document tree inside the group shell', () => {
    const { Wrapper } = createWrapper();

    render(<PrivateDocumentsGroup workspaceSlug="acme" />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('private-tree:acme')).toBeInTheDocument();
  });

  it('optimistically inserts a root document before the request resolves', async () => {
    let resolveCreateRequest: ((value: Document) => void) | undefined;

    createRootDocumentMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreateRequest = resolve;
        }),
    );

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(
      documentKeys.rootList('acme', 10),
      createNavigation(),
    );

    render(<PrivateDocumentsGroup workspaceSlug="acme" />, {
      wrapper: Wrapper,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create private document' }));

    await waitFor(() => {
      expect(
        queryClient.getQueryData<WorkspaceDocumentNavigation>(
          documentKeys.rootList('acme', 10),
        )?.private_documents.items,
      ).toEqual([
        expect.objectContaining({
          title: 'Untitled',
          parent_document_id: undefined,
        }),
      ]);
    });

    const optimisticDocumentId = queryClient
      .getQueryData<WorkspaceDocumentNavigation>(documentKeys.rootList('acme', 10))
      ?.private_documents.items[0]?.id;

    expect(optimisticDocumentId).toMatch(/^optimistic-root-doc:/);

    if (!resolveCreateRequest) {
      throw new Error('Create root document request did not start');
    }

    resolveCreateRequest(createdDocumentFixture);

    await waitFor(() => {
      expect(
        queryClient.getQueryData<WorkspaceDocumentNavigation>(
          documentKeys.rootList('acme', 10),
        )?.private_documents.items,
      ).toEqual([
        expect.objectContaining({
          id: createdDocumentFixture.id,
          public_id: createdDocumentFixture.public_id,
        }),
      ]);
      expect(
        queryClient.getQueryData<Document>(
          documentKeys.detail(createdDocumentFixture.id),
        ),
      ).toEqual(createdDocumentFixture);
      expect(pushMock).toHaveBeenCalledWith('/acme/untitled-public-doc-1');
    });
  });

  it('rolls back the optimistic root document when the request fails', async () => {
    let rejectCreateRequest: ((error: Error) => void) | undefined;

    createRootDocumentMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectCreateRequest = reject;
        }),
    );

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(
      documentKeys.rootList('acme', 10),
      createNavigation(),
    );

    render(<PrivateDocumentsGroup workspaceSlug="acme" />, {
      wrapper: Wrapper,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create private document' }));

    let optimisticDocumentId: string | undefined;

    await waitFor(() => {
      const items = queryClient.getQueryData<WorkspaceDocumentNavigation>(
        documentKeys.rootList('acme', 10),
      )?.private_documents.items;

      expect(items).toHaveLength(1);
      optimisticDocumentId = items?.[0]?.id;
    });

    if (!rejectCreateRequest) {
      throw new Error('Create root document request did not start');
    }

    rejectCreateRequest(new Error('create root document failed'));

    await waitFor(() => {
      expect(
        queryClient.getQueryData<WorkspaceDocumentNavigation>(
          documentKeys.rootList('acme', 10),
        )?.private_documents.items,
      ).toEqual([]);
      expect(pushMock).not.toHaveBeenCalled();
      expect(
        optimisticDocumentId
          ? queryClient.getQueryData<Document>(documentKeys.detail(optimisticDocumentId))
          : undefined,
      ).toBeUndefined();
    });
  });
});
