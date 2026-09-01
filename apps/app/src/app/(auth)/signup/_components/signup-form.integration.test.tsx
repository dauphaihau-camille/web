import { queryOptions } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import type { Workspace } from '@/domains/workspace';
import { renderWithProviders } from '@shared/test/render';
import { mswServer } from '@shared/test/msw/server';
import type * as AuthDomain from '@/domains/auth';
import type { CurrentUser } from '@/domains/auth';

import { SignupForm } from './signup-form';

const authRegisterUrlPattern = /\/auth\/register\/?$/;
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

vi.mock('../../_hooks/login-navigation', () => ({
  navigateAfterLogin: navigateAfterLoginMock,
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

describe('SignupForm integration', () => {
  let searchParams: URLSearchParams;
  let currentUserResult: CurrentUser | null;
  let workspaceListResult: Workspace[];
  let lastActiveWorkspaceResult: Workspace | null;

  beforeEach(() => {
    searchParams = new URLSearchParams();
    currentUserResult = currentUserFixture;
    workspaceListResult = [workspaceFixture];
    lastActiveWorkspaceResult = null;

    useSearchParamsGetMock.mockImplementation((key) => searchParams.get(key));
    currentUserQueryOptionsMock.mockReset();
    navigateAfterLoginMock.mockReset();

    currentUserQueryOptionsMock.mockImplementation(() =>
      queryOptions({
        queryKey: ['test', 'current-user'],
        queryFn: async () => currentUserResult,
      }));

    mswServer.use(
      http.get(myWorkspacesUrlPattern, () => HttpResponse.json(workspaceListResult)),
      http.get(lastActiveWorkspaceUrlPattern, () => HttpResponse.json(lastActiveWorkspaceResult)),
    );
  });

  it('links back to the login route', async () => {
    renderWithProviders(<SignupForm />);

    expect(screen.getByRole('button', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('registers with a Password Credential and redirects after signup', async () => {
    const user = userEvent.setup();
    let registerRequestBody: unknown = null;

    workspaceListResult = [];

    mswServer.use(
      http.post(authRegisterUrlPattern, async ({ request }) => {
        registerRequestBody = await request.json();

        return HttpResponse.json({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          user: {
            id: currentUserFixture.id,
            email: 'new@example.com',
            display_name: 'New User',
            status: currentUserFixture.status,
            session_id: currentUserFixture.sessionId,
            roles: currentUserFixture.roles,
            permissions: currentUserFixture.permissions,
          },
        });
      }),
    );

    renderWithProviders(<SignupForm />);

    await user.type(screen.getByLabelText('Name'), 'New User');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'strong-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(navigateAfterLoginMock).toHaveBeenCalledWith('/workspace');
    });

    expect(registerRequestBody).toEqual({
      email: 'new@example.com',
      password: 'strong-password',
      display_name: 'New User',
    });
  });

  it('shows a login prompt when the signup email already exists', async () => {
    const user = userEvent.setup();

    mswServer.use(
      http.post(authRegisterUrlPattern, () =>
        HttpResponse.json(
          {
            message: 'Email is already registered.',
          },
          {
            status: 409,
          },
        )),
    );

    renderWithProviders(<SignupForm />);

    await user.type(screen.getByLabelText('Name'), 'Member');
    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.type(screen.getByLabelText('Password'), 'strong-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    const errorAlert = await screen.findByRole('alert');

    expect(errorAlert.textContent).toMatch(/This email already has an account\. Log in instead\./i);
  });
});
