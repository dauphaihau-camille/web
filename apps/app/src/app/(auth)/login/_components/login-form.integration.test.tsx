import { queryOptions } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import type { Workspace } from '@/domains/workspace';
import { renderWithProviders } from '@shared/test/render';
import { mswServer } from '@shared/test/msw/server';
import type * as AuthDomain from '@/domains/auth';
import type { CurrentUser } from '@/domains/auth';

import { LoginForm } from './login-form';

const authEmailStartUrlPattern = /\/auth\/email\/start\/?$/;
const authEmailVerifyUrlPattern = /\/auth\/email\/verify\/?$/;
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

  it('validates the email before requesting a code', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginForm />);

    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'invalid-email');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
  });

  it('links to the dedicated signup route', async () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('button', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
  });

  it('redirects to the requested route after a successful code verification', async () => {
    const user = userEvent.setup();
    let startRequestBody: unknown = null;
    let verifyRequestBody: unknown = null;

    searchParams = new URLSearchParams('redirectTo=/shared/doc-1');

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

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.input(await screen.findByPlaceholderText('123456'), {
      target: { value: '123456' },
    });
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() => {
      expect(navigateAfterLoginMock).toHaveBeenCalledWith('/shared/doc-1');
    });

    expect(startRequestBody).toEqual({
      email: 'member@example.com',
      intent: 'login',
    });
    expect(verifyRequestBody).toEqual({
      challenge_id: 'challenge-1',
      code: '123456',
      intent: 'login',
    });
  });

  it('accepts a null display name after verification and still redirects', async () => {
    const user = userEvent.setup();

    mswServer.use(
      http.post(authEmailStartUrlPattern, () =>
        HttpResponse.json({
          challenge_id: 'challenge-1',
          expires_in_seconds: 600,
        })),
      http.post(authEmailVerifyUrlPattern, () =>
        HttpResponse.json({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          user: {
            id: currentUserFixture.id,
            email: currentUserFixture.email,
            display_name: null,
            status: currentUserFixture.status,
            session_id: currentUserFixture.sessionId,
            roles: currentUserFixture.roles,
            permissions: currentUserFixture.permissions,
          },
        })),
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.input(await screen.findByPlaceholderText('123456'), {
      target: { value: '123456' },
    });
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() => {
      expect(navigateAfterLoginMock).toHaveBeenCalledWith('/w/acme');
    });
  });

  it('prefers the last active workspace when there is no explicit redirect target', async () => {
    const user = userEvent.setup();

    lastActiveWorkspaceResult = {
      ...workspaceFixture,
      id: 'workspace-2',
      slug: 'beta',
      name: 'Beta',
    };

    mswServer.use(
      http.post(authEmailStartUrlPattern, () =>
        HttpResponse.json({
          challenge_id: 'challenge-1',
          expires_in_seconds: 600,
        })),
      http.post(authEmailVerifyUrlPattern, () =>
        HttpResponse.json({
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
        })),
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.input(await screen.findByPlaceholderText('123456'), {
      target: { value: '123456' },
    });
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() => {
      expect(navigateAfterLoginMock).toHaveBeenCalledWith('/w/beta');
    });
  });

  it('falls back to the first workspace when last-active returns an empty response body', async () => {
    const user = userEvent.setup();

    mswServer.use(
      http.get(lastActiveWorkspaceUrlPattern, () => new HttpResponse(null, { status: 200 })),
      http.post(authEmailStartUrlPattern, () =>
        HttpResponse.json({
          challenge_id: 'challenge-1',
          expires_in_seconds: 600,
        })),
      http.post(authEmailVerifyUrlPattern, () =>
        HttpResponse.json({
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
        })),
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.input(await screen.findByPlaceholderText('123456'), {
      target: { value: '123456' },
    });
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() => {
      expect(navigateAfterLoginMock).toHaveBeenCalledWith('/w/acme');
    });
  });

  it('shows the API error when sending the code fails', async () => {
    const user = userEvent.setup();

    mswServer.use(
      http.post(authEmailStartUrlPattern, () =>
        HttpResponse.json(
          {
            message: 'Too many attempts.',
          },
          {
            status: 429,
          },
        )),
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    const errorAlert = await screen.findByRole('alert');

    expect(errorAlert).toHaveTextContent(
      'Too many attempts. Please wait a moment before requesting another code.',
    );
    expect(errorAlert).not.toHaveTextContent('localhost:3000');
    expect(errorAlert).not.toHaveTextContent('Request failed');
    expect(navigateAfterLoginMock).not.toHaveBeenCalled();
  });

  it('shows the API error when code verification fails', async () => {
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
            message: 'Invalid login code.',
          },
          {
            status: 401,
          },
        )),
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.input(await screen.findByPlaceholderText('123456'), {
      target: { value: '123456' },
    });
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    const errorAlert = await screen.findByRole('alert');

    expect(errorAlert).toHaveTextContent(
      'That code is invalid or expired. Request a new code and try again.',
    );
    expect(errorAlert).not.toHaveTextContent('localhost:3000');
    expect(errorAlert).not.toHaveTextContent('Request failed');
    expect(navigateAfterLoginMock).not.toHaveBeenCalled();
  });

  it('disables resend behind a countdown after sending the code', async () => {
    const user = userEvent.setup();

    mswServer.use(
      http.post(authEmailStartUrlPattern, () =>
        HttpResponse.json({
          challenge_id: 'challenge-1',
          expires_in_seconds: 600,
        })),
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('button', { name: /Resend in \d+s/ })).toBeDisabled();
  });
});
