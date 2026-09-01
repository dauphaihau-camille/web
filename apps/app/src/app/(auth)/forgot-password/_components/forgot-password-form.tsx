'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { Controller, useForm } from 'react-hook-form';

import { LoadingIcon } from '@shared/components/loading-icon';
import { Button } from '@shared/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@shared/components/ui/input';
import { AuthFormShell } from '../../_components/auth-form-shell';
import { authInputClassName } from '../../_components/auth-form-styles';
import { authRoutes, forgotPassword } from '@/domains/auth';

import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from '../_forms/forgot-password.scheme';

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? searchParams.get('from') ?? undefined;
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [hasResent, setHasResent] = useState(false);
  const [successError, setSuccessError] = useState<string | null>(null);
  const isShowingSuccess = submittedEmail !== null;
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: '',
    },
  });
  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      form.clearErrors('root');
      setSuccessError(null);
    },
    onError: (error) => {
      form.setError('root', {
        message: error instanceof HTTPError && error.response.status === 429
          ? 'Too many reset requests. Please wait a moment and try again.'
          : 'Failed to request password reset.',
      });
    },
  });
  const isSubmitting = forgotPasswordMutation.isPending || form.formState.isSubmitting;

  function handleSubmit(values: ForgotPasswordFormValues) {
    form.clearErrors('root');
    setSuccessError(null);
    forgotPasswordMutation.mutate(
      {
        ...values,
        redirectTo,
      },
      {
        onSuccess: () => {
          setSubmittedEmail(values.email);
          setHasResent(false);
        },
      },
    );
  }

  function handleResend() {
    if (!submittedEmail || hasResent) {
      return;
    }

    setSuccessError(null);
    forgotPasswordMutation.mutate(
      {
        email: submittedEmail,
        redirectTo,
      },
      {
        onSuccess: () => {
          setHasResent(true);
        },
        onError: (error) => {
          setSuccessError(
            error instanceof HTTPError && error.response.status === 429
              ? 'Too many reset requests. Please wait a moment and try again.'
              : 'Failed to resend password reset.',
          );
        },
      },
    );
  }

  function handleReconfirm() {
    forgotPasswordMutation.reset();
    setSubmittedEmail(null);
    setHasResent(false);
    setSuccessError(null);
    form.clearErrors('root');
  }

  if (isShowingSuccess) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col justify-center px-4 py-28">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <FieldGroup className="gap-5">
            <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
            <div role="status" className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                If <strong className="font-semibold text-foreground">{submittedEmail}</strong>{' '}matches an email
                address we have on file, we&apos;ve sent you an email with a link to reset your password.
              </p>
              <p>
                {hasResent
                  ? (
                    <>
                      Check again. If you still haven&apos;t received the email, this may be the wrong email address
                      for your account.{' '}
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto px-0 py-0 align-baseline font-medium"
                        onClick={handleReconfirm}
                      >
                        Reconfirm your email address.
                      </Button>
                    </>
                  )
                  : (
                    <>
                      If you haven&apos;t received the email in 5 minutes, check your spam folder,{' '}
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto px-0 py-0 align-baseline font-medium"
                        disabled={forgotPasswordMutation.isPending}
                        onClick={handleResend}
                      >
                        resend
                      </Button>
                      , or{' '}
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto px-0 py-0 align-baseline font-medium"
                        onClick={handleReconfirm}
                      >
                        reconfirm your email address.
                      </Button>
                    </>
                  )}
              </p>
            </div>
            {successError
              ? (
                <Field data-invalid>
                  <FieldError>{successError}</FieldError>
                </Field>
              )
              : null}
            <Button
              className="h-11 w-full"
              render={<Link href={authRoutes.login()} />}
            >
              Back to login
            </Button>
          </FieldGroup>
        </div>
      </div>
    );
  }

  return (
    <AuthFormShell
      title="Forgot password"
      description={'Enter your email and we\'ll send a reset link if an account exists.'}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
        <FieldGroup className="gap-4">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
                <Input
                  {...field}
                  id="forgot-password-email"
                  type="email"
                  disabled={isSubmitting}
                  readOnly={isSubmitting}
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                  className={`h-11 px-3 ${authInputClassName}`}
                  placeholder="Enter your email address..."
                />
                {fieldState.invalid
                  ? <FieldError errors={[fieldState.error]} />
                  : null}
              </Field>
            )}
          />
          {form.formState.errors.root?.message
            ? (
              <Field data-invalid>
                <FieldError>{form.formState.errors.root.message}</FieldError>
              </Field>
            )
            : null}
          <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
            {forgotPasswordMutation.isPending ? <LoadingIcon className="size-4" /> : 'Send reset link'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full"
            render={<Link href={authRoutes.login()} />}
          >
            Back to login
          </Button>
        </FieldGroup>
      </form>
    </AuthFormShell>
  );
}
