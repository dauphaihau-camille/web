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
  type ArchivedDocumentListPage,
  type Document,
} from '@shared/domains/document';

import { useWorkspaceTrash } from './use-workspace-trash';

const toastMock = vi.fn();
const restoreDocumentMock = vi.fn();
const permanentlyDeleteDocumentMock = vi.fn();
const workspaceArchivedDocumentListQueryOptionsMock = vi.fn();

vi.mock('ahooks', () => ({
  useDebounceFn: (fn: (value: string) => void) => ({
    run: fn,
    cancel: vi.fn(),
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
    permanentlyDeleteDocument: permanentlyDeleteDocumentMock,
    restoreDocument: restoreDocumentMock,
    workspaceArchivedDocumentListQueryOptions:
      workspaceArchivedDocumentListQueryOptionsMock,
  };
});

const archivedDocumentFixture = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 2,
  title: 'Quarterly plan',
  has_content: true,
  breadcrumb_path: ['General', 'Planning'],
  archived_at: '2026-01-01T00:00:00.000Z',
} satisfies ArchivedDocumentListPage['items'][number];

const documentFixture: Document = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 2,
  workspace_id: 'acme',
  teamspace_id: undefined,
  parent_document_id: undefined,
  title: 'Quarterly plan',
  content_format: 'blocknote_v1',
  content: [],
  sort_key: 1,
  archived_at: '2026-01-01T00:00:00.000Z',
  archived_by_name: 'Alice',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
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

describe('useWorkspaceTrash integration', () => {
  beforeEach(() => {
    toastMock.mockReset();
    restoreDocumentMock.mockReset();
    permanentlyDeleteDocumentMock.mockReset();
    workspaceArchivedDocumentListQueryOptionsMock.mockReset();
    workspaceArchivedDocumentListQueryOptionsMock.mockImplementation(
      (
        workspaceSlug: string,
        limit: number,
        cursor?: string,
        query?: string,
      ) =>
        queryOptions({
          queryKey: documentKeys.archivedList(workspaceSlug, limit, cursor, query),
          queryFn: async () => ({
            items: [archivedDocumentFixture],
          }),
        }),
    );
  });

  it('optimistically removes a restored document from the archived list', async () => {
    let resolveRestoreRequest: ((document: Document) => void) | null = null;

    restoreDocumentMock.mockImplementation(
      () =>
        new Promise<Document>((resolve) => {
          resolveRestoreRequest = resolve;
        }),
    );

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(documentKeys.detail(documentFixture.id), documentFixture);

    const { result } = renderHook(
      () => useWorkspaceTrash({ workspaceSlug: 'acme' }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.handleOpenChange(true);
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    act(() => {
      result.current.handleRestoreDocument({
        documentId: archivedDocumentFixture.id,
        version: archivedDocumentFixture.version,
      });
    });

    await waitFor(() => {
      expect(result.current.busyDocumentId).toBe(archivedDocumentFixture.id);
      expect(result.current.items).toHaveLength(0);
      expect(
        queryClient.getQueryData<Document>(documentKeys.detail(documentFixture.id)),
      ).toMatchObject({
        archived_at: undefined,
        archived_by_name: undefined,
      });
    });

    const finishRestore: (document: Document) => void =
      resolveRestoreRequest ??
      (() => {
        throw new Error('Restore request did not start');
      });

    finishRestore({
      ...documentFixture,
      archived_at: undefined,
      archived_by_name: undefined,
    });

    await waitFor(() => {
      expect(result.current.busyDocumentId).toBeUndefined();
      expect(
        queryClient.getQueryData<Document>(documentKeys.detail(documentFixture.id)),
      ).toMatchObject({
        archived_at: undefined,
        archived_by_name: undefined,
      });
      expect(toastMock).toHaveBeenCalledWith('Document restored');
    });
  });

  it('clears search state when the popover closes', async () => {
    const { Wrapper } = createWrapper();

    const { result } = renderHook(
      () => useWorkspaceTrash({ workspaceSlug: 'acme' }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.handleOpenChange(true);
      result.current.handleSearchChange('  roadmap  ');
    });

    await waitFor(() => {
      expect(result.current.searchValue).toBe('  roadmap  ');
      expect(result.current.searchQueryValue).toBe('roadmap');
    });

    act(() => {
      result.current.handleOpenChange(false);
    });

    expect(result.current.searchValue).toBe('');
    expect(result.current.searchQueryValue).toBe('');
  });
});
