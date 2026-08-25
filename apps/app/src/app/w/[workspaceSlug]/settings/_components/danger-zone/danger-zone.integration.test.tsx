import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type * as WorkspaceDomain from '@/domains/workspace';
import type { Workspace } from '@/domains/workspace';
import { renderWithProviders } from '@shared/test/render';

import { DangerZone } from './danger-zone';

const { deleteWorkspaceMock, replaceMock } = vi.hoisted(() => ({
  deleteWorkspaceMock: vi.fn<(workspaceId: string) => Promise<void>>(),
  replaceMock: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('@/domains/workspace', async () => {
  const actual = await vi.importActual<typeof WorkspaceDomain>(
    '@/domains/workspace',
  );

  return {
    ...actual,
    deleteWorkspace: deleteWorkspaceMock,
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

describe('WorkspaceDangerZoneSection integration', () => {
  beforeEach(() => {
    deleteWorkspaceMock.mockReset();
    replaceMock.mockReset();
  });

  it('requires the workspace name before deleting', async () => {
    const user = userEvent.setup();
    deleteWorkspaceMock.mockResolvedValue(undefined);

    renderWithProviders(
      <DangerZone workspace={workspaceFixture} />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete workspace' }));

    const confirmButton = screen.getByRole('button', {
      name: 'Permanently delete workspace',
    });

    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByLabelText('Workspace name'), 'Wrong name');
    expect(confirmButton).toBeDisabled();

    await user.clear(screen.getByLabelText('Workspace name'));
    await user.type(screen.getByLabelText('Workspace name'), 'Acme Product');

    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteWorkspaceMock).toHaveBeenCalledWith('workspace-1');
    });
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/workspace');
    });
  });

  it('does not let non-owners open the delete dialog', async () => {
    renderWithProviders(
      <DangerZone
        workspace={{
          ...workspaceFixture,
          current_user_role: 'admin',
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Delete workspace' })).toBeDisabled();
    expect(
      screen.queryByText('Delete this entire workspace permanently?'),
    ).not.toBeInTheDocument();
  });
});
