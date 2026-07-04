import type { BrowserContext, Page, Route } from '@playwright/test';

const apiBaseUrl = 'http://localhost:3000/v1';

export type WorkspaceApiFixture = {
  id: string;
  version: number;
  name: string;
  slug: string;
  current_user_role: string;
  created_at: string;
  updated_at: string;
  description?: string;
};

export type LoginApiScenario = {
  loginStatus?: number;
  loginBody?: Record<string, unknown>;
  currentUserStatus?: number;
  workspaces?: WorkspaceApiFixture[];
};

function corsHeaders() {
  return {
    'access-control-allow-origin': 'http://127.0.0.1:4000',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
  };
}

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: corsHeaders(),
    body: JSON.stringify(body),
  });
}

export async function mockLoginApi(page: Page, scenario: LoginApiScenario = {}) {
  const {
    loginStatus = 200,
    loginBody = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'member@example.com',
        display_name: 'Member',
        status: 'active',
        session_id: 'session-1',
        roles: ['member'],
        permissions: ['workspace:read'],
      },
    },
    currentUserStatus = 200,
    workspaces = [
      {
        id: 'workspace-1',
        version: 1,
        name: 'Acme',
        slug: 'acme',
        current_user_role: 'owner',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
  } = scenario;

  await page.route(`${apiBaseUrl}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: corsHeaders(),
      });
      return;
    }

    if (url.pathname.endsWith('/auth/login') && request.method() === 'POST') {
      await fulfillJson(route, loginStatus, loginBody);
      return;
    }

    if (url.pathname.endsWith('/auth/me') && request.method() === 'GET') {
      if (currentUserStatus === 401) {
        await fulfillJson(route, 401, { message: 'Unauthorized' });
        return;
      }

      await fulfillJson(route, 200, {
        id: 'user-1',
        email: 'member@example.com',
        display_name: 'Member',
        status: 'active',
        session_id: 'session-1',
        roles: ['member'],
        permissions: ['workspace:read'],
      });
      return;
    }

    if (url.pathname.endsWith('/me/workspaces') && request.method() === 'GET') {
      await fulfillJson(route, 200, workspaces);
      return;
    }

    await route.continue();
  });
}

export async function addAuthenticatedSession(context: BrowserContext) {
  await context.addCookies([
    {
      name: 'accessToken',
      value: 'test-access-token',
      domain: '127.0.0.1',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
    },
    {
      name: 'refreshToken',
      value: 'test-refresh-token',
      domain: '127.0.0.1',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
    },
  ]);
}

export { apiBaseUrl };
