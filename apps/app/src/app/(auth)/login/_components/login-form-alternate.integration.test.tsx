import { queryOptions } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import type * as AuthDomain from '@/domains/auth';
import type { CurrentUser } from '@/domains/auth';
import type { Workspace } from '@/domains/workspace';
import { renderWithProviders } from '@/test/render';
import { mswServer } from '@/test/msw/server';

import { LoginForm } from './login-form';

const authEmailStartUrlPattern = /\/auth\/email\/start\/?$/;
const authEmailVerifyUrlPattern = /\/auth\/email\/verify\/?$/;
const myWorkspacesUrlPattern = /\/me\/workspaces\/?$/;

const {
  useSearchParamsGetMock,
  currentUserQueryOptionsMock,
  navigateAfterLoginMock,
  openWindowMock,
} = vi.hoisted(() => ({
  useSearchParamsGetMock: vi.fn<(key: string) => string | null>(),
  currentUserQueryOptionsMock: vi.fn(),
  navigateAfterLoginMock: vi.fn<(path: string) => void>(),
  openWindowMock: vi.fn(),
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

describe('LoginForm alternate flows', () => {
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
    openWindowMock.mockReset();
    openWindowMock.mockReturnValue({
      focus: vi.fn(),
      closed: false,
    });
    vi.stubGlobal('open', openWindowMock);

    currentUserQueryOptionsMock.mockImplementation(() =>
      queryOptions({
        queryKey: ['test', 'current-user'],
        queryFn: async () => currentUserResult,
      }));

    mswServer.use(http.get(myWorkspacesUrlPattern, () => HttpResponse.json(workspaceListResult)));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a sign-up prompt when login verification succeeds but no account exists', async () => {
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
            message: 'No account found for this email.',
          },
          {
            status: 404,
          },
        )),
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.input(await screen.findByPlaceholderText('123456'), {
      target: { value: '123456' },
    });
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    const errorAlert = await screen.findByRole('alert');

    expect(errorAlert.textContent).toMatch(/No account found for this email\. Sign up instead\./i);
  });

  it('opens OAuth in a popup window with a popup callback redirect', async () => {
    const user = userEvent.setup();

    searchParams = new URLSearchParams('redirectTo=/shared/doc-1');

    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Google' }));

    expect(openWindowMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '/auth/oauth/google?redirectTo=%2Foauth%2Fpopup%3FredirectTo%3D%252Fshared%252Fdoc-1',
      ),
      'camille-oauth',
      expect.stringContaining('popup=yes'),
    );
  });

  it('shows only the full-page loader after OAuth completes before navigation', async () => {
    renderWithProviders(<LoginForm />);

    window.dispatchEvent(new MessageEvent('message', {
      origin: window.location.origin,
      data: {
        type: 'camille:oauth-complete',
      },
    }));

    await waitFor(() => {
      expect(screen.queryByText('Log in')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(navigateAfterLoginMock).toHaveBeenCalledWith('/acme');
    });
  });
});
