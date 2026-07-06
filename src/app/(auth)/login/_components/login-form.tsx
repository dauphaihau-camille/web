'use client';

import { Controller } from 'react-hook-form';

import LoadingFullPage from '@/components/loading-full-page';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { GitHubIcon, GoogleIcon } from '../../../../components/brand-icons';
import { useLoginForm } from '../_hooks/use-login-form';

export function LoginForm() {
  const {
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
  } = useLoginForm();

  if (isOAuthRedirecting) {
    return <LoadingFullPage overlay />;
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6 px-4 py-28">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-5xl font-semibold tracking-tight">Log in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you<br /> a code to continue in Camille.
        </p>
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
      </div>
    </div>
  );
}
