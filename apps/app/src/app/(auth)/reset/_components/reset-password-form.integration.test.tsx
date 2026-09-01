import { queryOptions } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import type { Workspace } from '@/domains/workspace';
import { renderWithProviders } from '@shared/test/render';
import { mswServer } from '@shared/test/msw/server';
import type * as AuthDomain from '@/domains/auth';
import type { CurrentUser } from '@/domains/auth';

import { ResetPasswordForm } from './reset-password-form';

const authVerifyTokenUrlPattern = /\/auth\/verify-token\/?$/;
const authResetPasswordUrlPattern = /\/auth\/reset-password\/?$/;
const myWorkspacesUrlPattern = /\/me\/workspaces\/?$/;
const lastActiveWorkspaceUrlPattern = /\/me\/workspaces\/last-active\/?$/;

const {
  useSearchParamsGetMock,
  currentUserQueryOptionsMock,
  navigateAfterLoginMock,
} = vi.hoisted(() => ({
  useSearchParamsGetMock: vi.fn<(key: string) => string | null>(),
  currentUserQueryOptionsMock: vi.fn(),
  navigateAfterLoginMock: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: useSearchParamsGetMock,
  }),
}));

vi.mock('@/domains/auth', async () => {
  const actual = await vi.importActual<typeof AuthDomain>('@/domains/auth');

  return {
    ...actual,
    currentUserQueryOptions: currentUserQueryOptionsMock,
  };
});

vi.mock('../../_hooks/use-post-auth-redirect', () => ({
  usePostAuthRedirect: () => ({
    redirectAfterAuth: async () => navigateAfterLoginMock('/w/acme'),
    redirectTarget: '/workspace',
  }),
}));

const currentUserFixture: CurrentUser = {
  id: 'user-1',
  email: 'member@example.com',
  displayName: 'Member',
  status: 'active',
  sessionId: 'session-1',
  roles: [],
  permissions: [],
};

const workspaceFixture: Workspace = {
  id: 'workspace-1',
  version: 1,
  name: 'Acme',
  slug: 'acme',
  description: undefined,
  current_user_role: 'owner',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('ResetPasswordForm integration', () => {
  let searchParams: URLSearchParams;

  beforeEach(() => {
    searchParams = new URLSearchParams('t=reset-token');

    useSearchParamsGetMock.mockImplementation((key) => searchParams.get(key));
    currentUserQueryOptionsMock.mockReset();
    navigateAfterLoginMock.mockReset();

    currentUserQueryOptionsMock.mockImplementation(() =>
      queryOptions({
        queryKey: ['test', 'current-user'],
        queryFn: async () => currentUserFixture,
      }));

    mswServer.use(
      http.get(authVerifyTokenUrlPattern, () => new HttpResponse(null, { status: 200 })),
      http.get(myWorkspacesUrlPattern, () => HttpResponse.json([workspaceFixture])),
      http.get(lastActiveWorkspaceUrlPattern, () => new HttpResponse(null, { status: 200 })),
    );
  });

  it('shows an invalid token message when no Password Reset Token is present', async () => {
    searchParams = new URLSearchParams();

    renderWithProviders(<ResetPasswordForm />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This password reset link is missing a token.',
    );
    expect(screen.getByRole('button', { name: 'Request a new reset link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('resets the password and redirects after a valid Password Reset Token', async () => {
    const user = userEvent.setup();
    let resetRequestBody: unknown = null;

    mswServer.use(
      http.post(authResetPasswordUrlPattern, async ({ request }) => {
        resetRequestBody = await request.json();

        return HttpResponse.json({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          user: {
            id: currentUserFixture.id,
            email: currentUserFixture.email,
            display_name: currentUserFixture.displayName,
            status: currentUserFixture.status,
            session_id: currentUserFixture.sessionId,
            roles: currentUserFixture.roles,
            permissions: currentUserFixture.permissions,
          },
        });
      }),
    );

    renderWithProviders(<ResetPasswordForm />);

    await user.type(await screen.findByLabelText('Password'), 'new-password');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    await waitFor(() => {
      expect(navigateAfterLoginMock).toHaveBeenCalledWith('/w/acme');
    });

    expect(resetRequestBody).toEqual({
      password: 'new-password',
    });
  });
});
