'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { useEffect, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';

import {
  authRoutes,
  login,
  startEmailAuth,
  verifyEmailAuth,
} from '@/domains/auth';
import type {
  EmailAuthStartInput,
  EmailAuthStartResponse,
  EmailAuthVerifyInput,
  LoginInput,
  LoginResponse,
} from '@/domains/auth';

import { usePostAuthRedirect } from '../../_hooks/use-post-auth-redirect';
import {
  passwordLoginFormSchema,
  type PasswordLoginFormValues,
  requestEmailCodeFormSchema,
  type RequestEmailCodeFormValues,
  type VerifyEmailCodeFormValues,
  verifyEmailCodeFormSchema,
} from '../_forms/login.scheme';

const RESEND_COOLDOWN_SECONDS = 30;
const OAUTH_POPUP_MESSAGE_TYPE = 'camille:oauth-complete';
const OAUTH_POPUP_WINDOW_NAME = 'camille-oauth';
const OAUTH_POPUP_WIDTH = 520;
const OAUTH_POPUP_HEIGHT = 720;

export type LoginAuthMethod = 'email-code' | 'password';

interface EmailChallenge {
  challengeId: string;
  email: string;
  displayName?: string;
}

export interface UseLoginFormResult {
  codeForm: UseFormReturn<VerifyEmailCodeFormValues>;
  emailChallenge: EmailChallenge | null;
  emailForm: UseFormReturn<RequestEmailCodeFormValues>;
  handleEditEmail(): void;
  handleOAuthSignIn(provider: 'google' | 'github'): void;
  handlePasswordLogin(values: PasswordLoginFormValues): void;
  handleRequestCode(values: RequestEmailCodeFormValues): void;
  handleResendCode(): void;
  handleVerifyCode(values: VerifyEmailCodeFormValues): void;
  isOAuthRedirecting: boolean;
  isVerifyRedirecting: boolean;
  passwordLoginForm: UseFormReturn<PasswordLoginFormValues>;
  passwordLoginMutation: UseMutationResult<LoginResponse, Error, LoginInput>;
  redirectTarget: string;
  resendCooldownSeconds: number;
  startEmailAuthMutation: UseMutationResult<EmailAuthStartResponse, Error, EmailAuthStartInput>;
  verifyEmailAuthMutation: UseMutationResult<LoginResponse, Error, EmailAuthVerifyInput>;
}

export function useLoginForm(): UseLoginFormResult {
  const [emailChallenge, setEmailChallenge] = useState<EmailChallenge | null>(null);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [isVerifyRedirecting, setIsVerifyRedirecting] = useState(false);
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);
  const { redirectAfterAuth, redirectTarget } = usePostAuthRedirect({
    fallbackAuthPath: 'login',
  });

  const emailForm = useForm<RequestEmailCodeFormValues>({
    resolver: zodResolver(requestEmailCodeFormSchema),
    defaultValues: {
      email: '',
      displayName: '',
    },
  });

  const codeForm = useForm<VerifyEmailCodeFormValues>({
    resolver: zodResolver(verifyEmailCodeFormSchema),
    defaultValues: {
      challengeId: '',
      code: '',
    },
  });

  const passwordLoginForm = useForm<PasswordLoginFormValues>({
    resolver: zodResolver(passwordLoginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function handleAuthSuccess() {
    setIsVerifyRedirecting(true);
    await redirectAfterAuth();
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
        displayName: variables.displayName,
      });
      setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    },
    onError: (error) => {
      emailForm.setError('root', {
        message: buildEmailAuthErrorMessage(error, 'start'),
      });
    },
  });

  const verifyEmailAuthMutation = useMutation({
    mutationFn: verifyEmailAuth,
    onSuccess: handleAuthSuccess,
    onError: (error) => {
      setIsVerifyRedirecting(false);
      codeForm.setError('root', {
        message: buildEmailAuthErrorMessage(error, 'verify'),
      });
    },
  });

  const passwordLoginMutation = useMutation({
    mutationFn: login,
    onSuccess: handleAuthSuccess,
    onError: (error) => {
      setIsVerifyRedirecting(false);
      passwordLoginForm.setError('root', {
        message: buildPasswordLoginErrorMessage(error),
      });
    },
  });

  function handleRequestCode(values: RequestEmailCodeFormValues) {
    emailForm.clearErrors('root');
    startEmailAuthMutation.mutate({
      email: values.email,
      displayName: values.displayName || undefined,
      intent: 'login',
    });
  }

  function handleVerifyCode(values: VerifyEmailCodeFormValues) {
    codeForm.clearErrors('root');
    verifyEmailAuthMutation.mutate({
      challengeId: values.challengeId,
      code: values.code,
      displayName: emailChallenge?.displayName,
      intent: 'login',
    });
  }

  function handlePasswordLogin(values: PasswordLoginFormValues) {
    passwordLoginForm.clearErrors('root');
    passwordLoginMutation.mutate(values);
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

    startEmailAuthMutation.mutate({
      email: emailChallenge.email,
      displayName: emailChallenge.displayName,
      intent: 'login',
    });
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
      await redirectAfterAuth();
    }

    window.addEventListener('message', handleOAuthMessage);

    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [redirectAfterAuth]);

  return {
    codeForm,
    emailChallenge,
    emailForm,
    handleEditEmail,
    handleOAuthSignIn,
    handlePasswordLogin,
    handleRequestCode,
    handleResendCode,
    handleVerifyCode,
    isVerifyRedirecting,
    isOAuthRedirecting,
    passwordLoginForm,
    passwordLoginMutation,
    redirectTarget,
    resendCooldownSeconds,
    startEmailAuthMutation,
    verifyEmailAuthMutation,
  };
}

function buildEmailAuthErrorMessage(error: unknown, step: 'start' | 'verify') {
  if (error instanceof HTTPError) {
    if (error.response.status === 429) {
      return step === 'start'
        ? 'Too many attempts. Please wait a moment before requesting another code.'
        : 'Too many attempts. Please wait a moment and try again.';
    }

    if (error.response.status === 404) {
      return 'No account found for this email. Sign up instead.';
    }

    if (step === 'verify' && (error.response.status === 400 || error.response.status === 401)) {
      return 'That code is invalid or expired. Request a new code and try again.';
    }
  }

  return step === 'start' ? 'Failed to send code.' : 'Code verification failed.';
}

function buildPasswordLoginErrorMessage(error: unknown) {
  if (error instanceof HTTPError) {
    if (error.response.status === 429) {
      return 'Too many login attempts. Please wait a moment and try again.';
    }

    if (error.response.status === 401 || error.response.status === 404) {
      return 'Invalid email or password.';
    }
  }

  return 'Login failed.';
}
