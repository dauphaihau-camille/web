import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { WorkspaceProvider } from './workspace-provider';

const { markWorkspaceAsLastActiveMock } = vi.hoisted(() => ({
  markWorkspaceAsLastActiveMock: vi.fn(),
}));

vi.mock('@/domains/workspace-preference', () => ({
  markWorkspaceAsLastActive: markWorkspaceAsLastActiveMock,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('WorkspaceProvider', () => {
  beforeEach(() => {
    markWorkspaceAsLastActiveMock.mockReset();
  });

  it('does not interrupt rendering when last-active tracking fails', async () => {
    markWorkspaceAsLastActiveMock.mockRejectedValue(new Error('Not found'));

    render(
      <WorkspaceProvider workspaceSlug="acme-product">
        <div>Workspace content</div>
      </WorkspaceProvider>,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Workspace content')).toBeInTheDocument();

    await waitFor(() => {
      expect(markWorkspaceAsLastActiveMock).toHaveBeenCalled();
    });
    expect(markWorkspaceAsLastActiveMock.mock.calls[0]?.[0]).toBe('acme-product');
  });
});
