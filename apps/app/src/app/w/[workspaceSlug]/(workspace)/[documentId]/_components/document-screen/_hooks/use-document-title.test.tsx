import type { PropsWithChildren } from 'react';
import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import * as Yjs from 'yjs';

import type { Document } from '@/domains/document';
import { useDocumentTitleDraftStore } from '@/stores/document-title-draft-store';

import { useDocumentTitle } from './use-document-title';

const LOCAL_EDIT_ORIGIN = Symbol('test-local-title-edit');

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

function createWrapper(queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

function renderUseDocumentTitle({
  queryClient,
}: {
  queryClient?: QueryClient;
} = {}) {
  const collaborationDocument = new Yjs.Doc();

  const hook = renderHook(
    () => useDocumentTitle({
      collaborationDocument,
      document: documentFixture,
      editOrigin: LOCAL_EDIT_ORIGIN,
      workspaceSlug: 'acme',
    }),
    {
      wrapper: createWrapper(queryClient),
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
    window.history.pushState(null, '', '/w/acme/quarterly-plan-public-doc-1');
  });

  afterEach(() => {
    vi.useRealTimers();
    useDocumentTitleDraftStore.setState({
      activeDocumentId: null,
      draftTitle: null,
    });
  });

  it('commits title changes into collaborative metadata immediately and debounces projections', () => {
    const {
      collaborationDocument,
      result,
    } = renderUseDocumentTitle();
    const meta = collaborationDocument.getMap('meta');

    act(() => {
      result.current.handleTitleChange('Renamed plan');
    });

    expect(meta.get('title')).toBe('Renamed plan');
    expect(result.current.title).toBe('Renamed plan');
    expect(result.current.savedTitle).toBe('Quarterly plan');
    expect(window.location.pathname).toBe('/w/acme/quarterly-plan-public-doc-1');

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(result.current.savedTitle).toBe('Quarterly plan');
    expect(window.location.pathname).toBe('/w/acme/quarterly-plan-public-doc-1');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.savedTitle).toBe('Renamed plan');
    expect(window.location.pathname).toBe('/w/acme/renamed-plan-public-doc-1');
  });

  it('flushes the projected title on blur', () => {
    const {
      collaborationDocument,
      result,
    } = renderUseDocumentTitle();
    const meta = collaborationDocument.getMap('meta');

    act(() => {
      result.current.handleTitleChange('Blurred plan');
      result.current.handleTitleBlur('Blurred plan');
    });

    expect(meta.get('title')).toBe('Blurred plan');
    expect(result.current.savedTitle).toBe('Blurred plan');
    expect(window.location.pathname).toBe('/w/acme/blurred-plan-public-doc-1');
  });

  it('does not fan out title projections for every local keystroke', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const setQueriesDataSpy = vi.spyOn(queryClient, 'setQueriesData');
    const {
      result,
    } = renderUseDocumentTitle({ queryClient });

    const initialProjectionCalls = setQueriesDataSpy.mock.calls.length;

    act(() => {
      result.current.handleTitleChange('Renamed plan 1');
      result.current.handleTitleChange('Renamed plan 2');
      result.current.handleTitleChange('Renamed plan 3');
    });

    expect(setQueriesDataSpy.mock.calls.length).toBe(initialProjectionCalls);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(setQueriesDataSpy.mock.calls.length).toBe(initialProjectionCalls + 1);
  });

  it('preserves a trailing-space draft when the projected document prop refreshes', () => {
    const collaborationDocument = new Yjs.Doc();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const hook = renderHook(
      ({ document }) => useDocumentTitle({
        collaborationDocument,
        document,
        editOrigin: LOCAL_EDIT_ORIGIN,
        workspaceSlug: 'acme',
      }),
      {
        initialProps: {
          document: documentFixture,
        },
        wrapper: createWrapper(queryClient),
      },
    );

    act(() => {
      hook.result.current.handleTitleChange('Untitled');
      vi.advanceTimersByTime(299);
      hook.result.current.handleTitleChange('Untitled ');
      vi.advanceTimersByTime(1);
    });

    hook.rerender({
      document: {
        ...documentFixture,
        title: 'Untitled',
      },
    });

    expect(hook.result.current.title).toBe('Untitled ');
  });
});
