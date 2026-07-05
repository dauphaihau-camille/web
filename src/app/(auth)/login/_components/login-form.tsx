'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
import { navigateAfterLogin } from './login-navigation';

const RESEND_COOLDOWN_SECONDS = 15;

export function LoginForm() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [emailChallenge, setEmailChallenge] = useState<{
    challengeId: string;
    email: string;
  } | null>(null);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);

  const redirectTarget = getPostLoginRedirectTarget(
    searchParams.get('redirectTo') ?? searchParams.get('from'),
  );

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
      const postLoginPath = await resolvePostLoginPath();
      navigateAfterLogin(postLoginPath);
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

  return (
    <div className="grid gap-6">
      {emailChallenge
        ? (
          <form onSubmit={codeForm.handleSubmit(handleVerifyCode)} noValidate>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel>Enter login code</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to {emailChallenge.email}.
                </p>
              </Field>
              <Controller
                name="code"
                control={codeForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      id="login-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      aria-invalid={fieldState.invalid}
                      className="h-12 px-4 text-center text-lg tracking-[0.45em]"
                      maxLength={6}
                      onChange={(event) => {
                        field.onChange(event.target.value.replace(/\D/g, '').slice(0, 6));
                      }}
                      placeholder="123456"
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              {codeForm.formState.errors.root?.message
                ? (
                  <Field data-invalid>
                    <FieldError>{codeForm.formState.errors.root.message}</FieldError>
                  </Field>
                )
                : null}
              <Button
                type="submit"
                disabled={verifyEmailAuthMutation.isPending || codeForm.formState.isSubmitting}
                className="h-11 w-full font-medium"
              >
                {verifyEmailAuthMutation.isPending ? 'Verifying...' : 'Verify code'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={startEmailAuthMutation.isPending || resendCooldownSeconds > 0}
                className="h-11 w-full"
                onClick={() => startEmailAuthMutation.mutate({ email: emailChallenge.email })}
              >
                {startEmailAuthMutation.isPending
                  ? 'Sending...'
                  : resendCooldownSeconds > 0
                    ? `Resend in ${resendCooldownSeconds}s`
                    : 'Resend code'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full"
                onClick={handleEditEmail}
              >
                Use a different email
              </Button>
            </FieldGroup>
          </form>
        )
        : (
          <form onSubmit={emailForm.handleSubmit(handleRequestCode)} noValidate>
            <FieldGroup className="gap-4">
              <Controller
                name="email"
                control={emailForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                      className="h-11 px-3"
                      placeholder="Enter your email address..."
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              {emailForm.formState.errors.root?.message
                ? (
                  <Field data-invalid>
                    <FieldError>{emailForm.formState.errors.root.message}</FieldError>
                  </Field>
                )
                : null}
              <Button
                type="submit"
                disabled={startEmailAuthMutation.isPending || emailForm.formState.isSubmitting}
                className="h-11 w-full font-medium"
              >
                {startEmailAuthMutation.isPending ? 'Sending...' : 'Continue'}
              </Button>
            </FieldGroup>
          </form>
        )}
    </div>
  );
}
