import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const port = 3000;

type Workspace = {
  id: string;
  version: number;
  name: string;
  slug: string;
  current_user_role: string;
  created_at: string;
  updated_at: string;
  description?: string;
};

const defaultUser = {
  id: 'user-1',
  email: 'member@example.com',
  display_name: 'Member',
  status: 'active',
  session_id: 'session-1',
  roles: ['member'],
  permissions: ['workspace:read'],
};

const emptyWorkspaceList: Workspace[] = [];

function sendJson(
  response: ServerResponse<IncomingMessage>,
  status: number,
  body: unknown,
) {
  response.writeHead(status, {
    'access-control-allow-origin': 'http://127.0.0.1:4000',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'content-type': 'application/json',
  });
  response.end(JSON.stringify(body));
}

function hasSessionCookie(cookieHeader?: string | null) {
  if (!cookieHeader) {
    return false;
  }

  return /(?:^|;\s*)(accessToken|refreshToken)=/.test(cookieHeader);
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const cookieHeader = request.headers.cookie;

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'access-control-allow-origin': 'http://127.0.0.1:4000',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    });
    response.end();
    return;
  }

  if (url.pathname === '/healthz') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname === '/v1/auth/me' && request.method === 'GET') {
    if (!hasSessionCookie(cookieHeader)) {
      sendJson(response, 401, { message: 'Unauthorized' });
      return;
    }

    sendJson(response, 200, defaultUser);
    return;
  }

  if (url.pathname === '/v1/me/workspaces' && request.method === 'GET') {
    if (!hasSessionCookie(cookieHeader)) {
      sendJson(response, 401, { message: 'Unauthorized' });
      return;
    }

    sendJson(response, 200, emptyWorkspaceList);
    return;
  }

  sendJson(response, 404, { message: 'Not found' });
});

server.listen(port, () => {
  console.log(`Mock API server listening on http://localhost:${port}`);
});
