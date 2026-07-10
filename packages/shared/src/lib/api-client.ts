import { queryOptions, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';
import ky, { type Input, type Options } from 'ky';

import { publicEnv } from './public-env';

const apiBaseUrl = publicEnv.apiBaseUrl;
const AUTH_RETRY_HEADER = 'x-auth-refresh-retry';
let onUnauthorized: (() => void) | null = null;

type ApiRequestOptions = Omit<Options, 'prefix'>;

type ApiQueryOptions<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>;

function normalizePath(path: string) {
  return path.replace(/^\/+/, '');
}

function getApiUrl(path: string) {
  if (apiBaseUrl) {
    return `${apiBaseUrl}/${normalizePath(path)}`;
  }

  if (typeof window !== 'undefined') {
    return new URL(path, window.location.origin).toString();
  }

  return path;
}

async function refreshAccessToken() {
  return fetch(getApiUrl('auth/refresh'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      accept: 'application/json',
    },
  });
}

export function configureApiClient(options: {
  onUnauthorized?: (() => void) | null;
}) {
  onUnauthorized = options.onUnauthorized ?? null;
}

export const apiClient = ky.create({
  ...(apiBaseUrl ? { prefix: apiBaseUrl } : {}),
  credentials: 'include',
  headers: {
    accept: 'application/json',
  },
  hooks: {
    afterResponse: [
      async ({ request, options, response }) => {
        if (response.status !== 401 || request.headers.get(AUTH_RETRY_HEADER) === '1') {
          return response;
        }

        if (
          request.url.endsWith('/auth/login')
          || request.url.endsWith('/auth/refresh')
          || request.url.endsWith('/auth/email/verify')
        ) {
          return response;
        }

        const refreshResponse = await refreshAccessToken();

        if (!refreshResponse.ok) {
          onUnauthorized?.();
          return response;
        }

        const retryHeaders = new Headers(options.headers ?? request.headers);
        retryHeaders.set(AUTH_RETRY_HEADER, '1');

        return apiClient(request, {
          ...options,
          headers: retryHeaders,
        });
      },
    ],
  },
});

export function createQueryKey(...parts: QueryKey) {
  return parts;
}

export function apiRequest(path: Input, options?: ApiRequestOptions) {
  if (typeof path === 'string') {
    if (apiBaseUrl) {
      return apiClient(normalizePath(path), options);
    }

    return apiClient(getApiUrl(path), options);
  }

  return apiClient(path, options);
}

export async function apiGet<TResponse>(path: Input, options?: ApiRequestOptions) {
  return apiRequest(path, options).json<TResponse>();
}

export async function apiPost<TResponse, TBody = unknown>(
  path: Input,
  body?: TBody,
  options?: ApiRequestOptions,
) {
  return apiRequest(path, {
    ...options,
    json: body,
    method: 'post',
  }).json<TResponse>();
}

export async function apiPut<TResponse, TBody = unknown>(
  path: Input,
  body?: TBody,
  options?: ApiRequestOptions,
) {
  return apiRequest(path, {
    ...options,
    json: body,
    method: 'put',
  }).json<TResponse>();
}

export async function apiPatch<TResponse, TBody = unknown>(
  path: Input,
  body?: TBody,
  options?: ApiRequestOptions,
) {
  return apiRequest(path, {
    ...options,
    json: body,
    method: 'patch',
  }).json<TResponse>();
}

export async function apiDelete<TResponse>(path: Input, options?: ApiRequestOptions) {
  const response = await apiRequest(path, {
    ...options,
    method: 'delete',
  });

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json<TResponse>();
}

export function createApiQueryOptions<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>({
  path,
  queryKey,
  request,
  ...options
}: ApiQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  path: Input;
  queryKey: TQueryKey;
  request?: ApiRequestOptions;
}) {
  return queryOptions({
    ...options,
    queryKey,
    queryFn: ({ signal }) => apiGet<TQueryFnData>(path, { ...request, signal }),
  });
}
