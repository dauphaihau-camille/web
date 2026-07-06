import { queryOptions } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import type * as AuthDomain from '@/domains/auth';
import type { CurrentUser } from '@/domains/auth';
import type { Workspace } from '@/domains/workspace';
import { renderWithProviders } from '@/test/render';
import { mswServer } from '@/test/msw/server';

import { SignupForm } from './signup-form';

const authEmailStartUrlPattern = /\/auth\/email\/start\/?$/;
const authEmailVerifyUrlPattern = /\/auth\/email\/verify\/?$/;
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

describe('SignupForm integration', () => {
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

  it('links back to the login route', async () => {
    renderWithProviders(<SignupForm />);

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('submits signup intent and display name through email verification', async () => {
    const user = userEvent.setup();
    let startRequestBody: unknown = null;
    let verifyRequestBody: unknown = null;

    workspaceListResult = [];

    mswServer.use(
      http.post(authEmailStartUrlPattern, async ({ request }) => {
        startRequestBody = await request.json();

        return HttpResponse.json({
          challenge_id: 'challenge-1',
          expires_in_seconds: 600,
        });
      }),
      http.post(authEmailVerifyUrlPattern, async ({ request }) => {
        verifyRequestBody = await request.json();

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
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.input(await screen.findByPlaceholderText('123456'), {
      target: { value: '123456' },
    });
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() => {
      expect(navigateAfterLoginMock).toHaveBeenCalledWith('/workspace');
    });

    expect(startRequestBody).toEqual({
      email: 'new@example.com',
      intent: 'signup',
      display_name: 'New User',
    });
    expect(verifyRequestBody).toEqual({
      challenge_id: 'challenge-1',
      code: '123456',
      intent: 'signup',
      display_name: 'New User',
    });
  });

  it('shows a login prompt when the signup email already exists', async () => {
    const user = userEvent.setup();

    mswServer.use(
      http.post(authEmailStartUrlPattern, () =>
        HttpResponse.json({
          challenge_id: 'challenge-1',
          expires_in_seconds: 600,
        })),
      http.post(authEmailVerifyUrlPattern, () =>
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

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.input(await screen.findByPlaceholderText('123456'), {
      target: { value: '123456' },
    });
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    const errorAlert = await screen.findByRole('alert');

    expect(errorAlert.textContent).toMatch(/This email already has an account\. Log in instead\./i);
  });
});
