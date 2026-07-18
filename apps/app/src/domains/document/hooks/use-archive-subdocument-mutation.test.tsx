import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  documentKeys,
  type Document,
  type DocumentNavigationPage,
} from '@/domains/document';

import { useArchiveSubdocumentMutationImpl as useArchiveSubdocumentMutation } from './use-archive-subdocument-mutation.impl';
import { archiveSubdocCommand } from '../api/document.requests';

vi.mock('../api/document.requests', async () => {
  const actual = await import('../api/document.requests');

  return {
    ...actual,
    archiveSubdocCommand: vi.fn(),
  };
});

const archiveSubdocCommandMock = vi.mocked(archiveSubdocCommand);

const parentDocument: Document = {
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
  breadcrumb: [{
    id: 'ancestor-1',
    public_id: 'public-ancestor-1',
    title: 'Workspace Home',
  }],
};

const subdocument: Document = {
  id: 'doc-2',
  public_id: 'public-doc-2',
  version: 1,
  workspace_id: 'acme',
  teamspace_id: undefined,
  parent_document_id: 'doc-1',
  title: 'Child doc',
  content_format: 'blocknote_v1',
  content: [],
  sort_key: 20,
  archived_at: undefined,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useArchiveSubdocumentMutation', () => {
  it('optimistically removes the subdocument and persists archived state on success', async () => {
    archiveSubdocCommandMock.mockResolvedValue({
      parent_document: {
        ...parentDocument,
        version: 4,
        content: [{ type: 'paragraph', content: 'saved parent content' }],
      },
      archived_child_document: {
        ...subdocument,
        archived_at: '2026-01-02T00:00:00.000Z',
      },
    });

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(documentKeys.detail(parentDocument.id), parentDocument);
    queryClient.setQueryData(documentKeys.detail(subdocument.id), subdocument);
    queryClient.setQueryData<DocumentNavigationPage>(
      documentKeys.childList('acme', parentDocument.id, 50),
      {
        items: [{
          id: subdocument.id,
          public_id: subdocument.public_id,
          title: subdocument.title,
          teamspace_id: subdocument.teamspace_id,
          parent_document_id: subdocument.parent_document_id,
          sort_key: subdocument.sort_key,
          has_children: false,
          has_content: false,
          is_favorite: false,
        }],
        next_cursor: undefined,
      },
    );

    const { result } = renderHook(
      () => useArchiveSubdocumentMutation({ document: parentDocument, workspaceSlug: 'acme' }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        subdocumentId: subdocument.id,
        content: [{ type: 'paragraph', content: 'saved parent content' }],
      });
    });

    await waitFor(() => {
      expect(archiveSubdocCommandMock).toHaveBeenCalledWith(
        parentDocument.id,
        {
          subdocument_id: subdocument.id,
          version: parentDocument.version,
          content: [{ type: 'paragraph', content: 'saved parent content' }],
        },
      );
      expect(
        queryClient.getQueryData<DocumentNavigationPage>(
          documentKeys.childList('acme', parentDocument.id, 50),
        )?.items,
      ).toEqual([]);
      expect(
        queryClient.getQueryData<Document>(documentKeys.detail(parentDocument.id)),
      ).toMatchObject({
        version: 4,
        content: [{ type: 'paragraph', content: 'saved parent content' }],
      });
      expect(
        queryClient.getQueryData<Document>(documentKeys.detail(subdocument.id)),
      ).toMatchObject({
        archived_at: '2026-01-02T00:00:00.000Z',
      });
    });
  });

  it('restores previous caches when the archive request fails', async () => {
    archiveSubdocCommandMock.mockRejectedValue(new Error('archive failed'));

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(documentKeys.detail(parentDocument.id), parentDocument);
    queryClient.setQueryData(documentKeys.detail(subdocument.id), subdocument);
    queryClient.setQueryData<DocumentNavigationPage>(
      documentKeys.childList('acme', parentDocument.id, 50),
      {
        items: [{
          id: subdocument.id,
          public_id: subdocument.public_id,
          title: subdocument.title,
          teamspace_id: subdocument.teamspace_id,
          parent_document_id: subdocument.parent_document_id,
          sort_key: subdocument.sort_key,
          has_children: false,
          has_content: false,
          is_favorite: false,
        }],
        next_cursor: undefined,
      },
    );

    const { result } = renderHook(
      () => useArchiveSubdocumentMutation({ document: parentDocument, workspaceSlug: 'acme' }),
      { wrapper: Wrapper },
    );

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          subdocumentId: subdocument.id,
          content: [{ type: 'paragraph', content: 'saved parent content' }],
        });
      }),
    ).rejects.toThrow('archive failed');

    await waitFor(() => {
      expect(
        queryClient.getQueryData<DocumentNavigationPage>(
          documentKeys.childList('acme', parentDocument.id, 50),
        )?.items,
      ).toHaveLength(1);
      expect(
        queryClient.getQueryData<Document>(documentKeys.detail(parentDocument.id)),
      ).toMatchObject(parentDocument);
      expect(
        queryClient.getQueryData<Document>(documentKeys.detail(subdocument.id)),
      ).toMatchObject(subdocument);
    });
  });
});
