import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HTTPError } from 'ky';

import type * as WorkspaceDomain from '@/domains/workspace';
import type { UpdateWorkspaceInput, Workspace } from '@/domains/workspace';
import { renderWithProviders } from '@shared/test/render';

import { WorkspaceSettingsPanel } from './workspace-settings-panel';

const { replaceMock, updateWorkspaceMock } = vi.hoisted(() => ({
  replaceMock: vi.fn<(path: string) => void>(),
  updateWorkspaceMock: vi.fn<
    (workspaceId: string, input: UpdateWorkspaceInput) => Promise<Workspace>
  >(),
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
    updateWorkspace: updateWorkspaceMock,
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

describe('WorkspaceSettingsPanel integration', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    updateWorkspaceMock.mockReset();
  });

  it('disables submit until the form changes', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <WorkspaceSettingsPanel workspace={workspaceFixture} />,
    );

    const submitButton = screen.getByRole('button', { name: 'Save workspace' });
    const domainInput = screen.getByLabelText('Domain');

    expect(submitButton).toBeDisabled();

    await user.clear(domainInput);
    await user.type(domainInput, 'updated-domain');

    expect(submitButton).toBeEnabled();
  });

  it('shows a friendly field error when the domain is unavailable', async () => {
    const user = userEvent.setup();
    const error = new HTTPError(
      new Response(null, { status: 409, statusText: 'Conflict' }),
      new Request('http://localhost/v1/workspaces/workspace-1'),
      {} as never,
    );
    error.data = {
      message: 'Workspace domain is already in use.',
    };
    updateWorkspaceMock.mockRejectedValue(error);

    renderWithProviders(
      <WorkspaceSettingsPanel workspace={workspaceFixture} />,
    );

    const submitButton = screen.getByRole('button', { name: 'Save workspace' });
    const domainInput = screen.getByLabelText('Domain');

    expect(submitButton).toBeDisabled();

    await user.clear(domainInput);
    await user.type(domainInput, 'taken-domain');

    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(await screen.findByText('Domain not available')).toBeInTheDocument();
    expect(domainInput).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.queryByText(/Request failed with status code 409 Conflict/),
    ).not.toBeInTheDocument();
  });
});
