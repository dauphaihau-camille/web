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

import { useCreateSubdocumentMutationImpl as useCreateSubdocumentMutation } from './use-create-subdocument-mutation.impl';
import { createSubdocumentCommand } from '../api/document.requests';

vi.mock('../api/document.requests', async () => {
  const actual = await vi.importActual('../api/document.requests');

  return {
    ...actual,
    createSubdocumentCommand: vi.fn(),
  };
});

const createSubdocumentCommandMock = vi.mocked(createSubdocumentCommand);

const parentDocument: Document = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 3,
  workspace_id: 'acme',
  owner_user_id: 'user-1',
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

const childDocument: Document = {
  id: 'doc-2',
  public_id: 'public-doc-2',
  version: 1,
  workspace_id: 'acme',
  owner_user_id: 'user-1',
  teamspace_id: undefined,
  parent_document_id: 'doc-1',
  title: 'Untitled',
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
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useCreateSubdocumentMutation', () => {
  it('creates a subdocument, updates caches, and inserts the child into cached children', async () => {
    createSubdocumentCommandMock.mockResolvedValue({
      child_document: childDocument,
      parent_document: {
        ...parentDocument,
        version: 4,
        content: [{ type: 'paragraph', content: 'hello' }],
      },
    });

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(documentKeys.detail(parentDocument.id), parentDocument);
    queryClient.setQueryData<DocumentNavigationPage>(
      documentKeys.childList('acme', parentDocument.id, 50),
      { items: [], next_cursor: undefined },
    );

    const { result } = renderHook(
      () => useCreateSubdocumentMutation({ document: parentDocument, workspaceSlug: 'acme' }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        anchorBlockId: 'block-1',
        slashCommandText: '/doc',
        content: [{ type: 'paragraph', content: 'hello' }],
      });
    });

    await waitFor(() => {
      expect(createSubdocumentCommandMock).toHaveBeenCalledWith(
        parentDocument.id,
        {
          anchor_block_id: 'block-1',
          slash_command_text: '/doc',
          version: parentDocument.version,
          content: [{ type: 'paragraph', content: 'hello' }],
        },
      );
      expect(
        queryClient.getQueryData<Document>(documentKeys.detail(childDocument.id)),
      ).toMatchObject({
        id: childDocument.id,
        breadcrumb: [
          ...parentDocument.breadcrumb!,
          {
            id: parentDocument.id,
            public_id: parentDocument.public_id,
            title: parentDocument.title,
          },
        ],
      });
      expect(
        queryClient.getQueryData<DocumentNavigationPage>(
          documentKeys.childList('acme', parentDocument.id, 50),
        )?.items,
      ).toMatchObject([
        {
          id: childDocument.id,
          has_content: false,
        },
      ]);
      expect(
        queryClient.getQueryData<Document>(documentKeys.detail(parentDocument.id)),
      ).toMatchObject({
        version: 4,
        content: [{ type: 'paragraph', content: 'hello' }],
      });
    });
  });
});
