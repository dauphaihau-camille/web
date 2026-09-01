'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import LoadingFullPage from '@shared/components/loading-full-page';
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
import { authRoutes, resetPassword, verifyResetPasswordToken } from '@/domains/auth';

import { usePostAuthRedirect } from '../../_hooks/use-post-auth-redirect';
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from '../_forms/reset-password.scheme';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') ?? '';
  const { redirectAfterAuth } = usePostAuthRedirect();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: '',
    },
  });
  const tokenQuery = useQuery({
    enabled: token.length > 0,
    queryKey: ['auth', 'reset-password-token', token],
    queryFn: async () => {
      await verifyResetPasswordToken({ token });
      return true;
    },
    retry: false,
  });
  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: async () => {
      await redirectAfterAuth();
    },
    onError: (error) => {
      form.setError('root', {
        message: buildResetPasswordErrorMessage(error),
      });
    },
  });
  const isSubmitting = resetPasswordMutation.isPending || form.formState.isSubmitting;

  function handleSubmit(values: ResetPasswordFormValues) {
    form.clearErrors('root');
    resetPasswordMutation.mutate({
      token,
      password: values.password,
    });
  }

  if (resetPasswordMutation.isSuccess) {
    return <LoadingFullPage overlay />;
  }

  if (!token) {
    return <InvalidResetTokenMessage message="This password reset link is missing a token." />;
  }

  if (tokenQuery.isLoading) {
    return <LoadingFullPage overlay />;
  }

  if (tokenQuery.isError) {
    return <InvalidResetTokenMessage message="This password reset link is invalid or expired." />;
  }

  return (
    <AuthFormShell
      title="Reset password"
      description="Enter a new password for your account."
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
        <FieldGroup className="gap-4">
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="reset-password">Password</FieldLabel>
                <Input
                  {...field}
                  id="reset-password"
                  type="password"
                  disabled={isSubmitting}
                  readOnly={isSubmitting}
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  className={`h-11 px-3 ${authInputClassName}`}
                  placeholder="Enter a new password..."
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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full"
          >
            {resetPasswordMutation.isPending ? <LoadingIcon className="size-4" /> : 'Reset password'}
          </Button>
        </FieldGroup>
      </form>
    </AuthFormShell>
  );
}

function InvalidResetTokenMessage({ message }: { message: string }) {
  return (
    <AuthFormShell
      title="Reset password"
      description={message}
      descriptionProps={{ role: 'alert' }}
    >
      <Button
        variant="outline"
        className="h-11 w-full"
        render={<Link href={authRoutes.forgotPassword()} />}
      >
        Request a new reset link
      </Button>
    </AuthFormShell>
  );
}

function buildResetPasswordErrorMessage(error: unknown) {
  if (error instanceof HTTPError) {
    if (error.response.status === 429) {
      return 'Too many reset attempts. Please wait a moment and try again.';
    }

    if (error.response.status === 400 || error.response.status === 401) {
      return 'This password reset link is invalid or expired.';
    }
  }

  return 'Failed to reset password.';
}
