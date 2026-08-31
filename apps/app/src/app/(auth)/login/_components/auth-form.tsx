'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Controller } from 'react-hook-form';

import LoadingFullPage from '@shared/components/loading-full-page';
import { Button } from '@shared/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@shared/components/ui/input';
import { Separator } from '@shared/components/ui/separator';

import { GitHubIcon, GoogleIcon } from './social-icons';
import { authRoutes } from '@/domains/auth';
import { useLoginForm, type AuthFormMode } from '../_hooks/use-login-form';

const authCopy = {
  login: {
    title: 'Log in',
    alternateCtaLabel: 'Sign up',
    alternateCtaText: 'New user?',
  },
  signup: {
    title: 'Create your account',
    alternateCtaLabel: 'Log in',
    alternateCtaText: 'Already have an account?',
  },
} as const;

export function AuthForm({ mode }: { mode: AuthFormMode }) {
  const searchParams = useSearchParams();
  const copy = authCopy[mode];
  const redirectTo = searchParams.get('redirectTo') ?? searchParams.get('from');
  const alternateHref =
    mode === 'login'
      ? authRoutes.signup(redirectTo)
      : authRoutes.login(redirectTo);
  const {
    codeForm,
    emailChallenge,
    emailForm,
    handleEditEmail,
    handleOAuthSignIn,
    handleRequestCode,
    handleResendCode,
    handleVerifyCode,
    isVerifyRedirecting,
    isOAuthRedirecting,
    resendCooldownSeconds,
    startEmailAuthMutation,
    verifyEmailAuthMutation,
  } = useLoginForm(mode);

  const codeValue = codeForm.watch('code');
  const isRequestingCode =
    startEmailAuthMutation.isPending || emailForm.formState.isSubmitting;
  const isVerifyingCode =
    verifyEmailAuthMutation.isPending || codeForm.formState.isSubmitting;

  if (isOAuthRedirecting || isVerifyRedirecting) {
    return <LoadingFullPage overlay />;
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6 px-4 py-28">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-5xl font-semibold tracking-tight">{copy.title}</h1>
      </div>
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
                <Field data-invalid={codeForm.getFieldState('code').invalid}>
                  <Input
                    id="login-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    disabled={isVerifyingCode}
                    readOnly={isVerifyingCode}
                    aria-invalid={codeForm.getFieldState('code').invalid}
                    className="h-12 px-4 text-center text-lg tracking-[0.45em]"
                    maxLength={6}
                    onChange={(event) => {
                      codeForm.setValue(
                        'code',
                        event.target.value.replace(/\D/g, '').slice(0, 6),
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      );
                    }}
                    placeholder="123456"
                    value={codeValue ?? ''}
                  />
                  {codeForm.getFieldState('code').invalid
                    ? (
                      <FieldError errors={[codeForm.getFieldState('code').error]} />
                    )
                    : null}
                </Field>
                {codeForm.formState.errors.root?.message
                  ? (
                    <Field data-invalid>
                      <FieldError>
                        {codeForm.formState.errors.root.message}
                      </FieldError>
                    </Field>
                  )
                  : null}
                <Button
                  type="submit"
                  disabled={isVerifyingCode}
                  className="h-11 w-full font-medium"
                >
                  {verifyEmailAuthMutation.isPending
                    ? 'Verifying...'
                    : 'Verify code'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    startEmailAuthMutation.isPending || resendCooldownSeconds > 0
                  }
                  className="h-11 w-full"
                  onClick={handleResendCode}
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
                {mode === 'signup'
                  ? (
                    <Controller
                      name="displayName"
                      control={emailForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="signup-display-name">
                            Name
                          </FieldLabel>
                          <Input
                            {...field}
                            id="signup-display-name"
                            autoComplete="name"
                            aria-invalid={fieldState.invalid}
                            className="h-11 px-3"
                            placeholder="Jane Appleseed"
                          />
                          {fieldState.invalid
                            ? (
                              <FieldError errors={[fieldState.error]} />
                            )
                            : null}
                        </Field>
                      )}
                    />
                  )
                  : null}
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
                        disabled={isRequestingCode}
                        readOnly={isRequestingCode}
                        autoComplete="email"
                        aria-invalid={fieldState.invalid}
                        className="h-11 px-3"
                        placeholder="Enter your email address..."
                      />
                      {fieldState.invalid
                        ? (
                          <FieldError errors={[fieldState.error]} />
                        )
                        : null}
                    </Field>
                  )}
                />
                {emailForm.formState.errors.root?.message
                  ? (
                    <Field data-invalid>
                      <FieldError>
                        {emailForm.formState.errors.root.message}
                      </FieldError>
                    </Field>
                  )
                  : null}
                <Button
                  type="submit"
                  disabled={isRequestingCode}
                  className="h-11 w-full"
                >
                  {startEmailAuthMutation.isPending ? 'Sending...' : 'Continue'}
                </Button>
                <div className="flex items-center gap-3 py-1 text-xs tracking-[0.18em] text-muted-foreground">
                  <Separator aria-hidden="true" className="flex-1" />
                  <span className="shrink-0">or continue with</span>
                  <Separator aria-hidden="true" className="flex-1" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-2 font-medium"
                  onClick={() => handleOAuthSignIn('google')}
                >
                  <GoogleIcon className="size-4 shrink-0" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-2 font-medium"
                  onClick={() => handleOAuthSignIn('github')}
                >
                  <GitHubIcon className="size-4 shrink-0 text-foreground" />
                  GitHub
                </Button>
              </FieldGroup>
            </form>
          )}
        <p className="text-center text-sm text-muted-foreground">
          {copy.alternateCtaText}{' '}
          <Button
            variant="link"
            className="h-auto px-0 py-0 font-semibold"
            render={<Link href={alternateHref} />}
          >
            {copy.alternateCtaLabel}
          </Button>
        </p>
      </div>
    </div>
  );
}
