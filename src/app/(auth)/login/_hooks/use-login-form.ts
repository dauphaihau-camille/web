'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  authKeys,
  authRoutes,
  currentUserQueryOptions,
  getPostLoginRedirectTarget,
  startEmailAuth,
  verifyEmailAuth,
} from '@/domains/auth';
import {
  myWorkspaceListQueryOptions,
  workspaceKeys,
  workspaceRoutes,
} from '@/domains/workspace';

import {
  requestEmailCodeFormSchema,
  type RequestEmailCodeFormValues,
  type VerifyEmailCodeFormValues,
  verifyEmailCodeFormSchema,
} from '../_forms/login.scheme';
import { navigateAfterLogin } from '../_components/login-navigation';

const RESEND_COOLDOWN_SECONDS = 30;
const OAUTH_POPUP_MESSAGE_TYPE = 'camille:oauth-complete';
const OAUTH_POPUP_WINDOW_NAME = 'camille-oauth';
const OAUTH_POPUP_WIDTH = 520;
const OAUTH_POPUP_HEIGHT = 720;

export function useLoginForm() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [emailChallenge, setEmailChallenge] = useState<{
    challengeId: string;
    email: string;
  } | null>(null);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);

  const redirectTarget = getPostLoginRedirectTarget(
    searchParams.get('redirectTo') ?? searchParams.get('from'),
  );

  const emailForm = useForm<RequestEmailCodeFormValues>({
    resolver: zodResolver(requestEmailCodeFormSchema),
    defaultValues: {
      email: '',
    },
  });

  const codeForm = useForm<VerifyEmailCodeFormValues>({
    resolver: zodResolver(verifyEmailCodeFormSchema),
    defaultValues: {
      challengeId: '',
      code: '',
    },
  });

  async function resolvePostLoginPath() {
    const currentUser = await queryClient.fetchQuery(currentUserQueryOptions());

    if (!currentUser) {
      return authRoutes.login();
    }

    if (redirectTarget !== workspaceRoutes.entry()) {
      return redirectTarget;
    }

    const workspaces = await queryClient.fetchQuery(myWorkspaceListQueryOptions());

    return workspaces[0]
      ? workspaceRoutes.detail(workspaces[0].slug)
      : workspaceRoutes.entry();
  }

  const startEmailAuthMutation = useMutation({
    mutationFn: startEmailAuth,
    onSuccess: (result, variables) => {
      emailForm.clearErrors('root');
      codeForm.clearErrors('root');
      codeForm.reset({
        challengeId: result.challengeId,
        code: '',
      });
      setEmailChallenge({
        challengeId: result.challengeId,
        email: variables.email,
      });
      setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    },
    onError: (error) => {
      emailForm.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to send code.',
      });
    },
  });

  const verifyEmailAuthMutation = useMutation({
    mutationFn: verifyEmailAuth,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: authKeys.all,
      });
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.all,
      });

      navigateAfterLogin(await resolvePostLoginPath());
    },
    onError: (error) => {
      codeForm.setError('root', {
        message: error instanceof Error ? error.message : 'Code verification failed.',
      });
    },
  });

  function handleRequestCode(values: RequestEmailCodeFormValues) {
    emailForm.clearErrors('root');
    startEmailAuthMutation.mutate(values);
  }

  function handleVerifyCode(values: VerifyEmailCodeFormValues) {
    codeForm.clearErrors('root');
    verifyEmailAuthMutation.mutate(values);
  }

  function handleEditEmail() {
    setEmailChallenge(null);
    setResendCooldownSeconds(0);
    codeForm.reset({
      challengeId: '',
      code: '',
    });
  }

  function handleResendCode() {
    if (!emailChallenge) {
      return;
    }

    startEmailAuthMutation.mutate({ email: emailChallenge.email });
  }

  function handleOAuthSignIn(provider: 'google' | 'github') {
    const popupRedirectTarget = authRoutes.oauthPopup(redirectTarget);
    const oauthUrl = authRoutes.oauthStart(provider, popupRedirectTarget);
    const left = window.screenX + Math.max(0, Math.round((window.outerWidth - OAUTH_POPUP_WIDTH) / 2));
    const top = window.screenY + Math.max(0, Math.round((window.outerHeight - OAUTH_POPUP_HEIGHT) / 2));
    const popupFeatures = [
      'popup=yes',
      `width=${OAUTH_POPUP_WIDTH}`,
      `height=${OAUTH_POPUP_HEIGHT}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes',
    ].join(',');
    const popup = window.open(oauthUrl, OAUTH_POPUP_WINDOW_NAME, popupFeatures);

    if (!popup) {
      window.location.assign(oauthUrl);
      return;
    }

    popup.focus();
  }

  useEffect(() => {
    if (resendCooldownSeconds <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setResendCooldownSeconds((currentSeconds) => Math.max(0, currentSeconds - 1));
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resendCooldownSeconds]);

  useEffect(() => {
    async function handleOAuthMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== OAUTH_POPUP_MESSAGE_TYPE) {
        return;
      }

      setIsOAuthRedirecting(true);

      await queryClient.invalidateQueries({
        queryKey: authKeys.all,
      });
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.all,
      });

      navigateAfterLogin(await resolvePostLoginPath());
    }

    window.addEventListener('message', handleOAuthMessage);

    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [queryClient, redirectTarget]);

  return {
    codeForm,
    emailChallenge,
    emailForm,
    handleEditEmail,
    handleOAuthSignIn,
    handleRequestCode,
    handleResendCode,
    handleVerifyCode,
    isOAuthRedirecting,
    resendCooldownSeconds,
    startEmailAuthMutation,
    verifyEmailAuthMutation,
  };
}
