import { queryOptions } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import type * as AuthDomain from '@/domains/auth';
import type { CurrentUser } from '@/domains/auth';
import type { Workspace } from '@/domains/workspace';
import { renderWithProviders } from '@/test/render';
import { mswServer } from '@/test/msw/server';

import { LoginForm } from './login-form';

const authLoginUrlPattern = /\/auth\/login\/?$/;
const myWorkspacesUrlPattern = /\/me\/workspaces\/?$/;

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

vi.mock('./login-navigation', () => ({
  navigateAfterLogin: navigateAfterLoginMock,
}));

const currentUserFixture: CurrentUser = {
  id: 'user-1',
  email: 'member@example.com',
  displayName: 'Member',
  status: 'active',
  sessionId: 'session-1',
  roles: ['member'],
  permissions: ['workspace:read'],
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

describe('LoginForm integration', () => {
  let searchParams: URLSearchParams;
  let currentUserResult: CurrentUser | null;
  let workspaceListResult: Workspace[];

  beforeEach(() => {
    searchParams = new URLSearchParams();
    currentUserResult = currentUserFixture;
    workspaceListResult = [workspaceFixture];

    useSearchParamsGetMock.mockImplementation((key) => searchParams.get(key));
    currentUserQueryOptionsMock.mockReset();
    navigateAfterLoginMock.mockReset();

    currentUserQueryOptionsMock.mockImplementation(() =>
      queryOptions({
        queryKey: ['test', 'current-user'],
        queryFn: async () => currentUserResult,
      }));

    mswServer.use(http.get(myWorkspacesUrlPattern, () => HttpResponse.json(workspaceListResult)));
  });

  it('blocks submit when the password is shorter than the route schema allows', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginForm />);

    await user.clear(screen.getByLabelText('Password'));
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Continue with email' }));

    expect(
      await screen.findByText('Password must be at least 8 characters.'),
    ).toBeInTheDocument();
  });

  it('redirects to the requested route after a successful login', async () => {
    const user = userEvent.setup();
    let loginRequestBody: unknown = null;

    searchParams = new URLSearchParams('redirectTo=/shared/doc-1');

    mswServer.use(
      http.post(authLoginUrlPattern, async ({ request }) => {
        loginRequestBody = await request.json();

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

    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Continue with email' }));

    await waitFor(() => {
      expect(navigateAfterLoginMock).toHaveBeenCalledWith('/shared/doc-1');
    });

    expect(loginRequestBody).toEqual({
      email: 'member@example.com',
      password: 'password123',
    });
  });

  it('shows the API error when login fails', async () => {
    const user = userEvent.setup();

    mswServer.use(
      http.post(authLoginUrlPattern, () =>
        HttpResponse.json(
          {
            message: 'Invalid email or password.',
          },
          {
            status: 401,
          },
        )),
    );

    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Continue with email' }));

    const errorAlert = await screen.findByRole('alert');

    expect(errorAlert.textContent).toMatch(/401|Unauthorized|Request failed/i);
    expect(navigateAfterLoginMock).not.toHaveBeenCalled();
  });
});
