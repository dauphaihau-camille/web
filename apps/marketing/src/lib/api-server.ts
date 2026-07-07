import 'server-only';

import { cookies, headers } from 'next/headers';

function normalizeUrl(value?: string) {
  return value?.replace(/\/+$/, '');
}

function normalizePathSegment(value?: string) {
  return value?.replace(/^\/+|\/+$/g, '');
}

function buildApiBaseUrl(origin?: string, version?: string) {
  if (!origin) {
    return undefined;
  }

  if (version && origin.endsWith(`/${version}`)) {
    return origin;
  }

  return version ? `${origin}/${version}` : origin;
}

const apiBaseUrl = buildApiBaseUrl(
  normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
  normalizePathSegment(process.env.NEXT_PUBLIC_API_VERSION) || 'v1',
);

function normalizePath(path: string) {
  return path.replace(/^\/+/, '');
}

function getApiUrl(path: string) {
  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is required for server API requests.');
  }
  return `${apiBaseUrl}/${normalizePath(path)}`;
}

async function createServerHeaders(initialHeaders?: HeadersInit) {
  const requestHeaders = new Headers(initialHeaders);
  const cookieStore = await cookies();
  const incomingHeaders = await headers();

  requestHeaders.set('accept', 'application/json');

  if (!requestHeaders.has('cookie')) {
    const cookieHeader = cookieStore.toString();

    if (cookieHeader) {
      requestHeaders.set('cookie', cookieHeader);
    }
  }

  for (const headerName of ['origin', 'referer', 'user-agent', 'x-forwarded-host', 'x-forwarded-proto']) {
    if (requestHeaders.has(headerName)) {
      continue;
    }

    const headerValue = incomingHeaders.get(headerName);

    if (headerValue) {
      requestHeaders.set(headerName, headerValue);
    }
  }

  return requestHeaders;
}

export async function apiServerRequest(path: string, init?: RequestInit) {
  return fetch(getApiUrl(path), {
    ...init,
    headers: await createServerHeaders(init?.headers),
    cache: 'no-store',
  });
}

export async function apiServerGet<TResponse>(path: string, init?: RequestInit) {
  return apiServerRequest(path, init).then((response) => response.json() as Promise<TResponse>);
}

export async function apiServerPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  init?: RequestInit,
) {
  return apiServerRequest(path, {
    ...init,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
    method: 'POST',
  }).then((response) => response.json() as Promise<TResponse>);
}
