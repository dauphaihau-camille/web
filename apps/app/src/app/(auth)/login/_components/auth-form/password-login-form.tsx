import Link from 'next/link';
import { Controller } from 'react-hook-form';

import { LoadingIcon } from '@shared/components/loading-icon';
import { Button } from '@shared/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@shared/components/ui/input';
import { authRoutes } from '@/domains/auth';
import { authInputClassName } from '../../../_components/auth-form-styles';

import { AuthProviderButtons } from './auth-provider-buttons';
import type { LoginAuthMethod, UseLoginFormResult } from '../../_hooks/use-login-form';

export function PasswordLoginForm({
  auth,
  redirectTo,
  setLoginAuthMethod,
}: {
  auth: UseLoginFormResult;
  redirectTo?: string | null;
  setLoginAuthMethod: (method: LoginAuthMethod) => void;
}) {
  const isLoggingInWithPassword =
    auth.passwordLoginMutation.isPending || auth.passwordLoginForm.formState.isSubmitting;

  return (
    <form key="password-login" onSubmit={auth.passwordLoginForm.handleSubmit(auth.handlePasswordLogin)} noValidate>
      <FieldGroup className="gap-4">
        <Controller
          name="email"
          control={auth.passwordLoginForm.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="password-login-email">Email</FieldLabel>
              <Input
                {...field}
                id="password-login-email"
                type="email"
                disabled={isLoggingInWithPassword}
                readOnly={isLoggingInWithPassword}
                autoComplete="email"
                aria-invalid={fieldState.invalid}
                className={`h-11 px-3 ${authInputClassName}`}
                placeholder="Enter your email address..."
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={auth.passwordLoginForm.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="password-login-password">Password</FieldLabel>
                <Button
                  variant="link"
                  className="h-auto px-0 py-0 text-xs font-medium"
                  render={<Link href={authRoutes.forgotPassword(redirectTo)} />}
                >
                  Forgot password?
                </Button>
              </div>
              <Input
                {...field}
                id="password-login-password"
                type="password"
                disabled={isLoggingInWithPassword}
                readOnly={isLoggingInWithPassword}
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
                className={`h-11 px-3 ${authInputClassName}`}
                placeholder="Enter your password..."
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        {auth.passwordLoginForm.formState.errors.root?.message
          ? (
            <Field data-invalid>
              <FieldError>{auth.passwordLoginForm.formState.errors.root.message}</FieldError>
            </Field>
          )
          : null}
        <Button type="submit" disabled={isLoggingInWithPassword} className="h-11 w-full">
          {auth.passwordLoginMutation.isPending ? <LoadingIcon className="size-4" /> : 'Log in'}
        </Button>
        <AuthProviderButtons
          auth={auth}
          setLoginAuthMethod={setLoginAuthMethod}
          switchMethod="email-code"
        />
      </FieldGroup>
    </form>
  );
}
