import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';

import { documentKeys } from '@/domains/document';
import type * as TeamspaceDomain from '@/domains/teamspace';

import { CreateTeamspaceDialog } from './create-teamspace-dialog';

const {
  createTeamspaceMock,
} = vi.hoisted(() => ({
  createTeamspaceMock: vi.fn(),
}));

vi.mock('@/domains/teamspace', async () => {
  const actual = await vi.importActual<typeof TeamspaceDomain>('@/domains/teamspace');

  return {
    ...actual,
    createTeamspace: createTeamspaceMock,
  };
});

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

describe('CreateTeamspaceDialog', () => {
  beforeEach(() => {
    createTeamspaceMock.mockReset();
  });

  it('creates a closed teamspace from the dialog', async () => {
    createTeamspaceMock.mockResolvedValue({
      id: 'teamspace-1',
      version: 1,
      workspace_id: 'acme',
      name: 'Platform',
      description: undefined,
      access_mode: 'restricted',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    const { Wrapper, queryClient } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const onOpenChange = vi.fn();

    render(
      <CreateTeamspaceDialog
        open
        workspaceSlug="acme"
        onOpenChange={onOpenChange}
      />,
      {
        wrapper: Wrapper,
      },
    );

    fireEvent.change(screen.getByLabelText('Name'), {
      target: {
        value: 'Platform',
      },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: {
        value: 'Shared product docs',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Open/ }));
    fireEvent.click(screen.getByText('Closed'));
    fireEvent.click(screen.getByRole('button', { name: 'Create teamspace' }));

    await waitFor(() => {
      expect(createTeamspaceMock).toHaveBeenCalledWith('acme', {
        name: 'Platform',
        description: 'Shared product docs',
        access_mode: 'restricted',
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: documentKeys.lists('acme'),
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
