// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { toast } from 'sonner';

import type {
  Document,
} from '@/domains/document';
import { documentKeys } from '@/domains/document/api/document.keys';

import { useDocumentEditorActions } from './use-document-editor-actions';

const {
  archiveDocumentMock,
  archiveSubdocumentMutateAsyncMock,
  createSubdocumentMutateAsyncMock,
  restoreDocumentMock,
  setRecentWorkspaceDocumentIdMock,
  updateDocumentMock,
  getWorkspaceBlockLimitReachedDataMock,
  useDocumentDraftPersistenceMock,
  useArchiveSubdocumentMutationMock,
} = vi.hoisted(() => ({
  archiveDocumentMock: vi.fn(),
  archiveSubdocumentMutateAsyncMock: vi.fn(),
  createSubdocumentMutateAsyncMock: vi.fn(),
  restoreDocumentMock: vi.fn(),
  setRecentWorkspaceDocumentIdMock: vi.fn(),
  updateDocumentMock: vi.fn(),
  getWorkspaceBlockLimitReachedDataMock: vi.fn(),
  useDocumentDraftPersistenceMock: vi.fn(),
  useArchiveSubdocumentMutationMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

vi.mock('@/domains/subscription', () => ({
  getWorkspaceBlockLimitReachedData: getWorkspaceBlockLimitReachedDataMock,
}));

vi.mock('@/domains/document', () => {
  return {
    archiveDocument: archiveDocumentMock,
    documentDetailQueryOptions: (documentId: string) => ({
      queryKey: documentKeys.detail(documentId),
      queryFn: () => Promise.resolve({
        id: documentId,
        version: 9,
      }),
    }),
    documentKeys,
    restoreDocument: restoreDocumentMock,
    setRecentWorkspaceDocumentId: setRecentWorkspaceDocumentIdMock,
    updateDocument: updateDocumentMock,
    useArchiveSubdocumentMutation: useArchiveSubdocumentMutationMock,
    useCreateSubdocumentMutation: vi.fn(() => ({
      mutateAsync: createSubdocumentMutateAsyncMock,
    })),
  };
});

vi.mock('./use-document-draft-persistence', () => ({
  useDocumentDraftPersistence: useDocumentDraftPersistenceMock,
}));

const documentFixture: Document = {
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

function createBeforeUnloadEvent() {
  const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
  Object.defineProperty(event, 'returnValue', {
    configurable: true,
    writable: true,
    value: undefined,
  });

  return event;
}

describe('useDocumentEditorActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateDocumentMock.mockResolvedValue({
      ...documentFixture,
      version: 4,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Saved' }] }],
    });
    createSubdocumentMutateAsyncMock.mockResolvedValue({
      child_document: {
        id: 'doc-2',
        public_id: 'public-doc-2',
        title: 'Untitled',
        content: [],
      },
    });
    archiveSubdocumentMutateAsyncMock.mockResolvedValue(undefined);
    getWorkspaceBlockLimitReachedDataMock.mockReturnValue(null);
    useArchiveSubdocumentMutationMock.mockReturnValue({
      isPending: false,
      mutateAsync: archiveSubdocumentMutateAsyncMock,
      variables: undefined,
    });
    archiveDocumentMock.mockResolvedValue({
      ...documentFixture,
      id: 'doc-2',
      version: 10,
      archived_at: '2026-01-01T00:00:00.000Z',
    });
    restoreDocumentMock.mockResolvedValue({
      ...documentFixture,
      id: 'doc-2',
      version: 10,
      archived_at: undefined,
    });
    useDocumentDraftPersistenceMock.mockReturnValue({
      persistLocalDraft: vi.fn().mockResolvedValue(undefined),
      markRemoteSaveStarted: vi.fn().mockResolvedValue(undefined),
      markRemoteSaveSucceeded: vi.fn().mockResolvedValue(undefined),
      markRemoteSaveFailed: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('warns on beforeunload after the first local change and clears after IndexedDB persistence completes', async () => {
    let resolvePersist: (() => void) | null = null;

    useDocumentDraftPersistenceMock.mockReturnValue({
      persistLocalDraft: vi.fn(() => new Promise<void>((resolve) => {
        resolvePersist = resolve;
      })),
      markRemoteSaveStarted: vi.fn().mockResolvedValue(undefined),
      markRemoteSaveSucceeded: vi.fn().mockResolvedValue(undefined),
      markRemoteSaveFailed: vi.fn().mockResolvedValue(undefined),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useDocumentEditorActions({
        document: documentFixture,
        workspaceSlug: 'acme',
        onRestoreDraft: vi.fn(),
      }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.markPendingLocalPersistence();
    });

    const pendingEvent = createBeforeUnloadEvent();
    window.dispatchEvent(pendingEvent);

    expect(pendingEvent.defaultPrevented).toBe(true);
    expect(pendingEvent.returnValue).toBe('');

    const queuePromise = result.current.queueContentSave([
      { type: 'paragraph', content: [{ type: 'text', text: 'Draft' }] },
    ]);

    const resolvePersistLocalDraft = resolvePersist ?? (() => {
      throw new Error('persistLocalDraft did not start');
    });

    await act(async () => {
      resolvePersistLocalDraft();
      await queuePromise;
    });

    const settledEvent = createBeforeUnloadEvent();
    window.dispatchEvent(settledEvent);

    expect(settledEvent.defaultPrevented).toBe(false);
  });

  it('persists the local draft before remote save bookkeeping begins', async () => {
    const persistLocalDraft = vi.fn().mockResolvedValue(undefined);
    const markRemoteSaveStarted = vi.fn().mockResolvedValue(undefined);
    const markRemoteSaveSucceeded = vi.fn().mockResolvedValue(undefined);
    const markRemoteSaveFailed = vi.fn().mockResolvedValue(undefined);

    useDocumentDraftPersistenceMock.mockReturnValue({
      persistLocalDraft,
      markRemoteSaveStarted,
      markRemoteSaveSucceeded,
      markRemoteSaveFailed,
    });

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(documentKeys.detail(documentFixture.id), documentFixture);

    const { result } = renderHook(
      () => useDocumentEditorActions({
        document: documentFixture,
        workspaceSlug: 'acme',
        onRestoreDraft: vi.fn(),
      }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.queueContentSave([
        { type: 'paragraph', content: [{ type: 'text', text: 'Draft' }] },
      ]);
    });

    expect(persistLocalDraft).toHaveBeenCalledWith([
      { type: 'paragraph', content: [{ type: 'text', text: 'Draft' }] },
    ]);
    expect(markRemoteSaveStarted).toHaveBeenCalledTimes(1);
    expect(persistLocalDraft.mock.invocationCallOrder[0]).toBeLessThan(
      markRemoteSaveStarted.mock.invocationCallOrder[0],
    );
    expect(markRemoteSaveSucceeded).toHaveBeenCalledTimes(1);
  });

  it('only reports the archiving subdocument while the archive mutation is pending', () => {
    const { Wrapper } = createWrapper();

    useArchiveSubdocumentMutationMock.mockReturnValue({
      isPending: true,
      mutateAsync: archiveSubdocumentMutateAsyncMock,
      variables: {
        subdocumentId: 'doc-2',
      },
    });

    const { result, rerender } = renderHook(
      () => useDocumentEditorActions({
        document: documentFixture,
        workspaceSlug: 'acme',
        onRestoreDraft: vi.fn(),
      }),
      { wrapper: Wrapper },
    );

    expect(result.current.archivingSubdocumentId).toBe('doc-2');

    useArchiveSubdocumentMutationMock.mockReturnValue({
      isPending: false,
      mutateAsync: archiveSubdocumentMutateAsyncMock,
      variables: {
        subdocumentId: 'doc-2',
      },
    });

    rerender();

    expect(result.current.archivingSubdocumentId).toBeNull();
  });

  it('registers archive undo metadata before starting the archive mutation', async () => {
    const registerCommandUndoMetadata = vi.fn();
    const { Wrapper } = createWrapper();

    const { result } = renderHook(
      () => useDocumentEditorActions({
        document: documentFixture,
        registerCommandUndoMetadata,
        workspaceSlug: 'acme',
        onRestoreDraft: vi.fn(),
      }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.archiveSubdocument('doc-2', [
        { type: 'paragraph', content: 'next parent content' },
      ]);
    });

    expect(registerCommandUndoMetadata).toHaveBeenCalledWith({
      subdocumentId: 'doc-2',
      type: 'archiveSubdocument',
    });
    expect(registerCommandUndoMetadata.mock.invocationCallOrder[0]).toBeLessThan(
      archiveSubdocumentMutateAsyncMock.mock.invocationCallOrder[0],
    );
  });

  it('shows an upgrade toast when subdocument creation hits the workspace block limit', async () => {
    const blockLimitError = new Error('block limit reached');
    createSubdocumentMutateAsyncMock.mockRejectedValue(blockLimitError);
    getWorkspaceBlockLimitReachedDataMock.mockReturnValue({
      message: 'Workspace block limit reached.',
      code: 'workspace_block_limit_reached',
      plan: 'free',
      block_count: 1000,
      block_limit: 1000,
      upgrade_available: true,
    });
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useDocumentEditorActions({
        document: documentFixture,
        workspaceSlug: 'acme',
        onRestoreDraft: vi.fn(),
      }),
      { wrapper: Wrapper },
    );

    await expect(result.current.createSubdocument({
      anchorBlockId: 'block-1',
    })).rejects.toBe(blockLimitError);

    expect(getWorkspaceBlockLimitReachedDataMock).toHaveBeenCalledWith(
      blockLimitError,
    );
    expect(toast).toHaveBeenCalledWith('Block limit reached', {
      action: expect.objectContaining({
        label: 'Upgrade',
      }),
    });
  });
});
