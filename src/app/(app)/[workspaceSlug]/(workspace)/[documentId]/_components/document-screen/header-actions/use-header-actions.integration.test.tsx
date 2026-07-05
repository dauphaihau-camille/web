import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import type { Document } from '@/domains/document';
import { mswServer } from '@/test/msw/server';

import { useHeaderActions } from './use-header-actions';

const favoriteStatusUrlPattern = /\/documents\/doc-1\/favorite\/?$/;
const publishStatusUrlPattern = /\/documents\/doc-1\/publish\/?$/;

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

const documentFixture: Document = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 1,
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

describe('useHeaderActions integration', () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it('updates favorite status optimistically before the mutation resolves', async () => {
    let isFavorite = false;
    let resolveFavoriteRequest: (() => void) | null = null;

    mswServer.use(
      http.get(favoriteStatusUrlPattern, () =>
        HttpResponse.json({
          document_id: documentFixture.id,
          is_favorite: isFavorite,
        })),
      http.post(favoriteStatusUrlPattern, async () => {
        await new Promise<void>((resolve) => {
          resolveFavoriteRequest = resolve;
        });
        isFavorite = true;

        return HttpResponse.json({
          document_id: documentFixture.id,
          is_favorite: true,
        });
      }),
      http.get(publishStatusUrlPattern, () => HttpResponse.json({})),
    );

    const { result } = renderHook(
      () => useHeaderActions({ document: documentFixture, workspaceSlug: 'acme' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.favoriteStatus?.is_favorite).toBe(false);
    });

    act(() => {
      result.current.toggleFavorite();
    });

    await waitFor(() => {
      expect(result.current.favoriteStatus?.is_favorite).toBe(true);
      expect(result.current.isFavoriting).toBe(true);
    });

    const favoriteRequestResolver: () => void = resolveFavoriteRequest ?? (() => {
      throw new Error('Favorite request did not start');
    });

    favoriteRequestResolver();

    await waitFor(() => {
      expect(result.current.favoriteStatus?.is_favorite).toBe(true);
      expect(result.current.isFavoriting).toBe(false);
    });
  });
});
