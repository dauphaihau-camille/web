import { queryOptions, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';
import ky, { type Input, type Options } from 'ky';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

type ApiRequestOptions = Omit<Options, 'prefixUrl'>;

type ApiQueryOptions<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>;

function normalizePath(path: string) {
  return path.replace(/^\/+/, '');
}

export const apiClient = ky.create({
  ...(apiBaseUrl ? { prefixUrl: apiBaseUrl } : {}),
  credentials: 'include',
  headers: {
    accept: 'application/json',
  },
});

export function createQueryKey(...parts: QueryKey) {
  return parts;
}

export function apiRequest(path: Input, options?: ApiRequestOptions) {
  if (typeof path === 'string' && apiBaseUrl) {
    return apiClient(normalizePath(path), options);
  }

  return apiClient(path, options);
}

export async function apiGet<TResponse>(path: Input, options?: ApiRequestOptions) {
  return apiRequest(path, options).json<TResponse>();
}

export async function apiPost<TResponse, TBody = unknown>(
  path: Input,
  body?: TBody,
  options?: ApiRequestOptions
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
  options?: ApiRequestOptions
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
  options?: ApiRequestOptions
) {
  return apiRequest(path, {
    ...options,
    json: body,
    method: 'patch',
  }).json<TResponse>();
}

export async function apiDelete<TResponse>(path: Input, options?: ApiRequestOptions) {
  return apiRequest(path, {
    ...options,
    method: 'delete',
  }).json<TResponse>();
}

export function createApiQueryOptions<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
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
