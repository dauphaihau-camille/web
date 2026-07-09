import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type * as DocumentDomain from '@shared/domains/document';
import {
  documentKeys,
  type Document,
  type DocumentNavigationNode,
  type WorkspaceDocumentNavigation,
} from '@shared/domains/document';
import { workspaceRoutes } from '@shared/domains/workspace';
import {
  favoriteKeys,
  type FavoriteDocument,
  type FavoriteStatus,
} from '@/domains/favorite';
import { useDocumentTreeExpansionStore } from '@/stores/document-tree-expansion-store';
import type * as DocumentTreeNodeActionHelpers from './document-tree-node-action-helpers';

import { useDocumentTreeNodeActions } from './use-document-tree-node-actions';

const replaceMock = vi.fn();
const pushMock = vi.fn();
const toastMock = vi.fn();
const archiveDocumentMock = vi.fn();
const createDocumentMock = vi.fn();
const favoriteDocumentMock = vi.fn();
const unfavoriteDocumentMock = vi.fn();
const documentDetailQueryOptionsMock = vi.fn();
const resolveArchiveDestinationMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

vi.mock('sonner', () => ({
  toast: toastMock,
}));

vi.mock('@shared/domains/document', async () => {
  const actual = await vi.importActual<typeof DocumentDomain>(
    '@shared/domains/document',
  );

  return {
    ...actual,
    archiveDocument: archiveDocumentMock,
    createDocument: createDocumentMock,
    documentDetailQueryOptions: documentDetailQueryOptionsMock,
  };
});

vi.mock('@/domains/favorite', async () => {
  const actual = await vi.importActual('@/domains/favorite');

  return {
    ...actual,
    favoriteDocument: favoriteDocumentMock,
    unfavoriteDocument: unfavoriteDocumentMock,
  };
});

vi.mock('./document-tree-node-action-helpers', async () => {
  const actual = await vi.importActual<
    typeof DocumentTreeNodeActionHelpers
  >('./document-tree-node-action-helpers');

  return {
    ...actual,
    resolveArchiveDestination: resolveArchiveDestinationMock,
  };
});

const documentFixture: Document = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 3,
  workspace_id: 'acme',
  teamspace_id: undefined,
  parent_document_id: undefined,
  title: 'Quarterly plan',
  content_format: 'blocknote_v1',
  content: [],
  sort_key: 10,
  archived_at: undefined,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const documentNodeFixture: DocumentNavigationNode = {
  id: documentFixture.id,
  public_id: documentFixture.public_id,
  title: documentFixture.title,
  teamspace_id: documentFixture.teamspace_id,
  parent_document_id: documentFixture.parent_document_id,
  sort_key: documentFixture.sort_key,
  has_children: false,
  has_content: false,
  is_favorite: true,
};

const nextDocumentFixture: DocumentNavigationNode = {
  id: 'doc-2',
  public_id: 'public-doc-2',
  title: 'Roadmap',
  teamspace_id: undefined,
  parent_document_id: undefined,
  sort_key: 5,
  has_children: false,
  has_content: true,
  is_favorite: false,
};

const childDocumentFixture: Document = {
  id: 'child-1',
  public_id: 'public-child-1',
  version: 1,
  workspace_id: 'acme',
  teamspace_id: undefined,
  parent_document_id: documentFixture.id,
  title: 'Untitled',
  content_format: 'blocknote_v1',
  content: [],
  sort_key: 20,
  archived_at: undefined,
  created_at: '2026-01-03T00:00:00.000Z',
  updated_at: '2026-01-03T00:00:00.000Z',
};

const favoriteFixture: FavoriteDocument = {
  document_id: documentFixture.id,
  public_id: documentFixture.public_id,
  workspace_id: documentFixture.workspace_id,
  teamspace_id: documentFixture.teamspace_id,
  parent_document_id: documentFixture.parent_document_id,
  title: documentFixture.title,
  sort_key: documentFixture.sort_key,
  has_children: false,
  has_content: false,
  favorited_at: '2026-01-01T00:00:00.000Z',
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

function createNavigation(
  items: DocumentNavigationNode[],
): WorkspaceDocumentNavigation {
  return {
    private_documents: {
      items,
      next_cursor: undefined,
    },
    teamspaces: [],
  } as WorkspaceDocumentNavigation;
}

describe('useDocumentTreeNodeActions integration', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    pushMock.mockReset();
    toastMock.mockReset();
    archiveDocumentMock.mockReset();
    createDocumentMock.mockReset();
    favoriteDocumentMock.mockReset();
    unfavoriteDocumentMock.mockReset();
    documentDetailQueryOptionsMock.mockReset();
    resolveArchiveDestinationMock.mockReset();
    useDocumentTreeExpansionStore.setState({
      expandedByWorkspace: {
        acme: [documentFixture.id],
      },
      hydratedWorkspaceIds: [],
    });
    window.history.replaceState(
      {},
      '',
      workspaceRoutes.document(
        'acme',
        documentFixture.public_id,
        documentFixture.title,
      ),
    );

    documentDetailQueryOptionsMock.mockImplementation((documentId: string) =>
      queryOptions({
        queryKey: documentKeys.detail(documentId),
        queryFn: async () => documentFixture,
      }));
  });

  it('removes the document and navigates away before archive resolves', async () => {
    let resolveArchiveRequest: ((document: Document) => void) | null = null;

    archiveDocumentMock.mockImplementation(
      () =>
        new Promise<Document>((resolve) => {
          resolveArchiveRequest = resolve;
        }),
    );
    resolveArchiveDestinationMock.mockResolvedValue(nextDocumentFixture);

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(documentKeys.detail(documentFixture.id), documentFixture);
    queryClient.setQueryData(
      documentKeys.rootList('acme', 10),
      createNavigation([documentNodeFixture, nextDocumentFixture]),
    );

    const { result } = renderHook(
      () =>
        useDocumentTreeNodeActions({
          document: documentNodeFixture,
          isActive: true,
          workspaceSlug: 'acme',
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.handleArchive();
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        workspaceRoutes.document(
          'acme',
          nextDocumentFixture.public_id,
          nextDocumentFixture.title,
        ),
      );
      expect(
        queryClient.getQueryData<WorkspaceDocumentNavigation>(
          documentKeys.rootList('acme', 10),
        )?.private_documents.items,
      ).toEqual([nextDocumentFixture]);
      expect(result.current.archiveDocumentMutation.isPending).toBe(true);
      expect(
        useDocumentTreeExpansionStore.getState().expandedByWorkspace.acme,
      ).toEqual([]);
    });

    const finishArchiveRequest: (document: Document) => void =
      resolveArchiveRequest ??
      (() => {
        throw new Error('Archive request did not start');
      });

    finishArchiveRequest({
      ...documentFixture,
      archived_at: '2026-01-02T00:00:00.000Z',
    });

    await waitFor(() => {
      expect(result.current.archiveDocumentMutation.isPending).toBe(false);
      expect(toastMock).toHaveBeenCalledWith('Moved to trash');
    });
  });

  it('restores the tree and route when the archive request fails', async () => {
    let rejectArchiveRequest: ((error: Error) => void) | null = null;
    const previousRoute = window.location.pathname;

    archiveDocumentMock.mockImplementation(
      () =>
        new Promise<Document>((_resolve, reject) => {
          rejectArchiveRequest = (error: Error) => {
            reject(error);
          };
        }),
    );
    resolveArchiveDestinationMock.mockResolvedValue(nextDocumentFixture);

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(documentKeys.detail(documentFixture.id), documentFixture);
    queryClient.setQueryData(
      documentKeys.rootList('acme', 10),
      createNavigation([documentNodeFixture, nextDocumentFixture]),
    );

    const { result } = renderHook(
      () =>
        useDocumentTreeNodeActions({
          document: documentNodeFixture,
          isActive: true,
          workspaceSlug: 'acme',
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.handleArchive();
    });

    await waitFor(() => {
      expect(
        queryClient.getQueryData<WorkspaceDocumentNavigation>(
          documentKeys.rootList('acme', 10),
        )?.private_documents.items,
      ).toEqual([nextDocumentFixture]);
    });

    const failArchiveRequest: (error: Error) => void =
      rejectArchiveRequest ??
      (() => {
        throw new Error('Archive request did not start');
      });

    failArchiveRequest(new Error('archive failed'));

    await waitFor(() => {
      expect(
        queryClient.getQueryData<WorkspaceDocumentNavigation>(
          documentKeys.rootList('acme', 10),
        )?.private_documents.items,
      ).toEqual([documentNodeFixture, nextDocumentFixture]);
      expect(replaceMock).toHaveBeenLastCalledWith(previousRoute);
      expect(
        useDocumentTreeExpansionStore.getState().expandedByWorkspace.acme,
      ).toEqual([documentFixture.id]);
      expect(toastMock).toHaveBeenCalledWith('Could not move to trash');
    });
  });

  it('marks a favorited parent as having children after creating a subdocument', async () => {
    createDocumentMock.mockResolvedValue(childDocumentFixture);

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(documentKeys.detail(documentFixture.id), documentFixture);
    queryClient.setQueryData(
      documentKeys.rootList('acme', 10),
      createNavigation([documentNodeFixture]),
    );
    queryClient.setQueryData<FavoriteDocument[]>(
      favoriteKeys.workspaceList('acme'),
      [favoriteFixture],
    );

    const { result } = renderHook(
      () =>
        useDocumentTreeNodeActions({
          document: documentNodeFixture,
          isActive: true,
          workspaceSlug: 'acme',
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.handleCreateSubdocument();
    });

    await waitFor(() => {
      expect(createDocumentMock).toHaveBeenCalledWith({
        workspace_id: 'acme',
        teamspace_id: undefined,
        parent_document_id: documentFixture.id,
      });
      expect(
        queryClient.getQueryData<FavoriteDocument[]>(
          favoriteKeys.workspaceList('acme'),
        ),
      ).toEqual([
        expect.objectContaining({
          document_id: documentFixture.id,
          has_children: true,
        }),
      ]);
      expect(pushMock).toHaveBeenCalledWith(
        workspaceRoutes.document(
          'acme',
          childDocumentFixture.public_id,
          childDocumentFixture.title,
        ),
      );
    });
  });

  it('optimistically adds a document to favorites before the request resolves', async () => {
    let resolveFavoriteRequest: ((value: FavoriteStatus) => void) | undefined;
    favoriteDocumentMock.mockImplementation(
      () =>
        new Promise<FavoriteStatus>((resolve) => {
          resolveFavoriteRequest = resolve;
        }),
    );

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(documentKeys.detail(documentFixture.id), documentFixture);
    queryClient.setQueryData(
      documentKeys.rootList('acme', 10),
      createNavigation([{
        ...documentNodeFixture,
        is_favorite: false,
      }]),
    );
    queryClient.setQueryData<FavoriteDocument[]>(
      favoriteKeys.workspaceList('acme'),
      [],
    );

    const { result } = renderHook(
      () =>
        useDocumentTreeNodeActions({
          document: {
            ...documentNodeFixture,
            is_favorite: false,
          },
          isActive: true,
          workspaceSlug: 'acme',
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.handleToggleFavorite();
    });

    await waitFor(() => {
      expect(
        queryClient.getQueryData<FavoriteDocument[]>(
          favoriteKeys.workspaceList('acme'),
        ),
      ).toEqual([
        expect.objectContaining({
          document_id: documentFixture.id,
        }),
      ]);
      expect(
        queryClient.getQueryData<WorkspaceDocumentNavigation>(
          documentKeys.rootList('acme', 10),
        )?.private_documents.items[0],
      ).toEqual(expect.objectContaining({
        id: documentFixture.id,
        is_favorite: true,
      }));
    });

    if (!resolveFavoriteRequest) {
      throw new Error('Favorite request did not start');
    }

    resolveFavoriteRequest({
      document_id: documentFixture.id,
      is_favorite: true,
    });

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Added to favorites');
    });
  });

  it('rolls back favorite caches when the optimistic request fails', async () => {
    favoriteDocumentMock.mockRejectedValue(new Error('favorite failed'));

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(documentKeys.detail(documentFixture.id), documentFixture);
    queryClient.setQueryData(
      documentKeys.rootList('acme', 10),
      createNavigation([{
        ...documentNodeFixture,
        is_favorite: false,
      }]),
    );
    queryClient.setQueryData<FavoriteDocument[]>(
      favoriteKeys.workspaceList('acme'),
      [],
    );

    const { result } = renderHook(
      () =>
        useDocumentTreeNodeActions({
          document: {
            ...documentNodeFixture,
            is_favorite: false,
          },
          isActive: true,
          workspaceSlug: 'acme',
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.handleToggleFavorite();
    });

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Could not update favorites');
      expect(
        queryClient.getQueryData<FavoriteDocument[]>(
          favoriteKeys.workspaceList('acme'),
        ),
      ).toEqual([]);
      expect(
        queryClient.getQueryData<WorkspaceDocumentNavigation>(
          documentKeys.rootList('acme', 10),
        )?.private_documents.items[0],
      ).toEqual(expect.objectContaining({
        id: documentFixture.id,
        is_favorite: false,
      }));
    });
  });
});
