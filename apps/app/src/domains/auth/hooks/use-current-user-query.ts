'use client';

import { useQuery } from '@tanstack/react-query';

import { currentUserQueryOptions } from '../api/auth.queries';

export function useCurrentUserQuery() {
  return useQuery(currentUserQueryOptions());
}
