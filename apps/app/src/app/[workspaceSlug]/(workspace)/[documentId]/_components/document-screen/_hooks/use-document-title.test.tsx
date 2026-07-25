import type { PropsWithChildren } from 'react';
import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import * as Yjs from 'yjs';

import type { Document } from '@/domains/document';
import { useDocumentTitleDraftStore } from '@/stores/document-title-draft-store';

import { useDocumentTitle } from './use-document-title';

const documentFixture: Document = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 1,
  workspace_id: 'workspace-1',
  owner_user_id: 'user-1',
  owner_user: {
    id: 'user-1',
    email: 'owner@example.com',
    display_name: 'Owner',
  },
  teamspace_id: undefined,
  parent_document_id: undefined,
  title: 'Quarterly plan',
  content_format: 'blocknote_v1',
  content: [],
  sort_key: 10,
  archived_at: undefined,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  access: {
    scope: 'private',
    permission: 'manage',
    can_view: true,
    can_edit: true,
    can_manage: true,
  },
  collaboration: {
    enabled: true,
    mode: 'edit',
    show_presence: false,
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

function renderUseDocumentTitle() {
  const collaborationDocument = new Yjs.Doc();

  const hook = renderHook(
    () => useDocumentTitle({
      collaborationDocument,
      document: documentFixture,
      workspaceSlug: 'acme',
    }),
    {
      wrapper: createWrapper(),
    },
  );

  return {
    ...hook,
    collaborationDocument,
  };
}

describe('useDocumentTitle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.pushState(null, '', '/acme/quarterly-plan-public-doc-1');
  });

  afterEach(() => {
    vi.useRealTimers();
    useDocumentTitleDraftStore.setState({
      activeDocumentId: null,
      draftTitle: null,
    });
  });

  it('commits title changes after the debounce delay', () => {
    const {
      collaborationDocument,
      result,
    } = renderUseDocumentTitle();
    const meta = collaborationDocument.getMap('meta');

    act(() => {
      result.current.handleTitleChange('Renamed plan');
    });

    expect(meta.get('title')).toBe('Quarterly plan');
    expect(window.location.pathname).toBe('/acme/quarterly-plan-public-doc-1');

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(meta.get('title')).toBe('Quarterly plan');
    expect(window.location.pathname).toBe('/acme/quarterly-plan-public-doc-1');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(meta.get('title')).toBe('Renamed plan');
    expect(window.location.pathname).toBe('/acme/renamed-plan-public-doc-1');
  });

  it('flushes a pending title change on blur', () => {
    const {
      collaborationDocument,
      result,
    } = renderUseDocumentTitle();
    const meta = collaborationDocument.getMap('meta');

    act(() => {
      result.current.handleTitleChange('Blurred plan');
      vi.advanceTimersByTime(100);
      result.current.handleTitleBlur('Blurred plan');
    });

    expect(meta.get('title')).toBe('Blurred plan');
    expect(window.location.pathname).toBe('/acme/blurred-plan-public-doc-1');
  });
});
