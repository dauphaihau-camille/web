import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type * as WorkspaceDomain from '@/domains/workspace';
import type { CreateWorkspaceInput, Workspace } from '@/domains/workspace';
import { renderWithProviders } from '@/test/render';

import { CreateWorkspaceForm } from './create-workspace-form';

const { pushMock, createWorkspaceMock } = vi.hoisted(() => ({
  pushMock: vi.fn<(path: string) => void>(),
  createWorkspaceMock: vi.fn<(input: CreateWorkspaceInput) => Promise<Workspace>>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/domains/workspace', async () => {
  const actual = await vi.importActual<typeof WorkspaceDomain>(
    '@/domains/workspace',
  );

  return {
    ...actual,
    createWorkspace: createWorkspaceMock,
  };
});

const workspaceFixture: Workspace = {
  id: 'workspace-1',
  version: 1,
  name: 'Acme Product',
  slug: 'acme-product',
  description: 'Shared docs and planning',
  current_user_role: 'owner',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('CreateWorkspaceForm integration', () => {
  beforeEach(() => {
    pushMock.mockReset();
    createWorkspaceMock.mockReset();
  });

  it('blocks submit when the domain is reserved', async () => {
    const user = userEvent.setup();

    renderWithProviders(<CreateWorkspaceForm variant="plain" />);

    await user.type(screen.getByLabelText('Workspace name'), 'Workspace');
    await user.clear(screen.getByLabelText('Domain'));
    await user.type(screen.getByLabelText('Domain'), 'workspace');
    await user.click(screen.getByRole('button', { name: 'Create workspace' }));

    expect(await screen.findByText('Domain not allowed')).toBeInTheDocument();
    expect(createWorkspaceMock).not.toHaveBeenCalled();
  });

  it('creates the workspace and redirects to the slug route', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    createWorkspaceMock.mockResolvedValue(workspaceFixture);

    renderWithProviders(
      <CreateWorkspaceForm onSuccess={onSuccess} variant="plain" />,
    );

    await user.type(screen.getByLabelText('Workspace name'), 'Acme Product');
    await user.type(
      screen.getByLabelText('Description'),
      '  Shared docs and planning  ',
    );
    await user.click(screen.getByRole('button', { name: 'Create workspace' }));

    await waitFor(() => {
      expect(createWorkspaceMock).toHaveBeenCalledTimes(1);
      expect(createWorkspaceMock.mock.calls[0]?.[0]).toEqual({
        name: 'Acme Product',
        slug: 'acme-product',
        description: 'Shared docs and planning',
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith('/acme-product');
    });
  });

  it('shows the API error when workspace creation fails', async () => {
    const user = userEvent.setup();

    createWorkspaceMock.mockRejectedValue(new Error('Workspace slug already exists.'));

    renderWithProviders(<CreateWorkspaceForm variant="plain" />);

    await user.type(screen.getByLabelText('Workspace name'), 'Acme Product');
    await user.click(screen.getByRole('button', { name: 'Create workspace' }));

    expect(
      await screen.findByText('Workspace slug already exists.'),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
