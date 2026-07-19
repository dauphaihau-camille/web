// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { Document } from '@/domains/document';

import { useDocumentDraftPersistence } from './use-document-draft-persistence';

const {
  cleanupStaleDocumentDraftsMock,
  deleteDocumentDraftMock,
  loadDocumentDraftMock,
  markDocumentDraftFailedMock,
  markDocumentDraftSyncingMock,
  saveDocumentDraftMock,
} = vi.hoisted(() => ({
  cleanupStaleDocumentDraftsMock: vi.fn(),
  deleteDocumentDraftMock: vi.fn(),
  loadDocumentDraftMock: vi.fn(),
  markDocumentDraftFailedMock: vi.fn(),
  markDocumentDraftSyncingMock: vi.fn(),
  saveDocumentDraftMock: vi.fn(),
}));

vi.mock('./document-draft-store', () => ({
  cleanupStaleDocumentDrafts: cleanupStaleDocumentDraftsMock,
  deleteDocumentDraft: deleteDocumentDraftMock,
  getDocumentDraftId: vi.fn((workspaceSlug: string, documentId: string) => `${workspaceSlug}:${documentId}`),
  loadDocumentDraft: loadDocumentDraftMock,
  markDocumentDraftFailed: markDocumentDraftFailedMock,
  markDocumentDraftSyncing: markDocumentDraftSyncingMock,
  saveDocumentDraft: saveDocumentDraftMock,
}));

const documentFixture: Document = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 5,
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

describe('useDocumentDraftPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    cleanupStaleDocumentDraftsMock.mockResolvedValue(undefined);
    deleteDocumentDraftMock.mockResolvedValue(undefined);
    loadDocumentDraftMock.mockResolvedValue(null);
    markDocumentDraftFailedMock.mockResolvedValue(undefined);
    markDocumentDraftSyncingMock.mockResolvedValue(undefined);
    saveDocumentDraftMock.mockResolvedValue(undefined);
  });

  it('silently deletes an equivalent draft without prompting', async () => {
    loadDocumentDraftMock.mockResolvedValue({
      id: 'acme:doc-1',
      workspaceSlug: 'acme',
      documentId: 'doc-1',
      content: [{ type: 'paragraph', content: [] }],
      baseVersion: 5,
      updatedAt: 1,
      syncState: 'pending',
    });

    renderHook(() => useDocumentDraftPersistence({
      document: documentFixture,
      workspaceSlug: 'acme',
      onRestoreDraft: vi.fn(),
    }));

    await waitFor(() => {
      expect(deleteDocumentDraftMock).toHaveBeenCalledWith('acme:doc-1');
    });

    expect(window.confirm).not.toHaveBeenCalled();
  });

  it('prompts and restores when a different non-conflicting draft exists', async () => {
    const onRestoreDraft = vi.fn();

    loadDocumentDraftMock.mockResolvedValue({
      id: 'acme:doc-1',
      workspaceSlug: 'acme',
      documentId: 'doc-1',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Recovered' }] }],
      baseVersion: 5,
      updatedAt: 1,
      syncState: 'pending',
    });

    renderHook(() => useDocumentDraftPersistence({
      document: documentFixture,
      workspaceSlug: 'acme',
      onRestoreDraft,
    }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'A local recovery draft was found for this document. Restore it?',
      );
      expect(onRestoreDraft).toHaveBeenCalledWith([
        { type: 'paragraph', content: [{ type: 'text', text: 'Recovered' }] },
      ]);
    });

    expect(deleteDocumentDraftMock).not.toHaveBeenCalled();
  });

  it('checks recovery only once for the same opened document instance', async () => {
    const initialDraft = {
      id: 'acme:doc-1',
      workspaceSlug: 'acme',
      documentId: 'doc-1',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Recovered' }] }],
      baseVersion: 4,
      updatedAt: 1,
      syncState: 'pending' as const,
    };

    loadDocumentDraftMock.mockResolvedValue(initialDraft);

    const { rerender } = renderHook(
      ({ document }) => useDocumentDraftPersistence({
        document,
        workspaceSlug: 'acme',
        onRestoreDraft: vi.fn(),
      }),
      {
        initialProps: {
          document: documentFixture,
        },
      },
    );

    await waitFor(() => {
      expect(loadDocumentDraftMock).toHaveBeenCalledTimes(1);
    });

    rerender({
      document: {
        ...documentFixture,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Changed server content' }] }],
        version: 6,
      },
    });

    await waitFor(() => {
      expect(loadDocumentDraftMock).toHaveBeenCalledTimes(1);
    });
  });

  it('persists drafts and forwards sync state updates to the store', async () => {
    const { result } = renderHook(() => useDocumentDraftPersistence({
      document: documentFixture,
      workspaceSlug: 'acme',
      onRestoreDraft: vi.fn(),
    }));

    await result.current.persistLocalDraft([{ type: 'paragraph', content: [] }]);
    await result.current.markRemoteSaveStarted();
    await result.current.markRemoteSaveSucceeded();
    await result.current.markRemoteSaveFailed(new Error('network down'));

    expect(saveDocumentDraftMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'acme:doc-1',
      baseVersion: 5,
      content: [{ type: 'paragraph', content: [] }],
      syncState: 'pending',
    }));
    expect(markDocumentDraftSyncingMock).toHaveBeenCalledWith('acme:doc-1');
    expect(deleteDocumentDraftMock).toHaveBeenCalledWith('acme:doc-1');
    expect(markDocumentDraftFailedMock).toHaveBeenCalledWith('acme:doc-1', 'network down');
  });
});
