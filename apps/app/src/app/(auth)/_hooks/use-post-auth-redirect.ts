'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import {
  myWorkspaceListQueryOptions,
  workspaceKeys,
  workspaceRoutes,
} from '@/domains/workspace';
import {
  authKeys,
  authRoutes,
  currentUserQueryOptions,
  getPostLoginRedirectTarget,
} from '@/domains/auth';
import { getLastActiveWorkspace } from '@/domains/workspace-preference';

import { navigateAfterLogin } from './login-navigation';

export function usePostAuthRedirect(options?: { fallbackAuthPath?: 'login' | 'signup' }) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const redirectTarget = getPostLoginRedirectTarget(
    searchParams.get('redirectTo') ?? searchParams.get('from'),
  );
  const fallbackAuthPath = options?.fallbackAuthPath ?? 'login';

  const resolvePostLoginPath = useCallback(async () => {
    const currentUser = await queryClient.fetchQuery(currentUserQueryOptions());

    if (!currentUser) {
      return fallbackAuthPath === 'signup' ? authRoutes.signup() : authRoutes.login();
    }

    if (redirectTarget !== workspaceRoutes.entry()) {
      return redirectTarget;
    }

    const lastActiveWorkspace = await getLastActiveWorkspace();

    if (lastActiveWorkspace) {
      return workspaceRoutes.detail(lastActiveWorkspace.slug);
    }

    const workspaces = await queryClient.fetchQuery(myWorkspaceListQueryOptions());

    return workspaces[0]
      ? workspaceRoutes.detail(workspaces[0].slug)
      : workspaceRoutes.entry();
  }, [fallbackAuthPath, queryClient, redirectTarget]);

  const redirectAfterAuth = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: authKeys.all,
    });
    await queryClient.invalidateQueries({
      queryKey: workspaceKeys.all,
    });

    navigateAfterLogin(await resolvePostLoginPath());
  }, [queryClient, resolvePostLoginPath]);

  return {
    redirectAfterAuth,
    redirectTarget,
  };
}
