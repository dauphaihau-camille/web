'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Controller } from 'react-hook-form';

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
import { authRoutes } from '@/domains/auth';
import { useSignupForm } from '../_hooks/use-signup-form';

export function SignupForm() {
  const searchParams = useSearchParams();
  const auth = useSignupForm();
  const redirectTo = searchParams.get('redirectTo') ?? searchParams.get('from');

  const isSigningUpWithPassword =
    auth.mutation.isPending || auth.form.formState.isSubmitting;

  if (auth.isVerifyRedirecting) {
    return <LoadingFullPage overlay />;
  }

  return (
    <AuthFormShell title="Create your account">
      <div className="grid gap-6">
        <form key="signup" onSubmit={auth.form.handleSubmit(auth.handleSignup)} noValidate>
          <FieldGroup className="gap-4">
            <Controller
              name="displayName"
              control={auth.form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-display-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="signup-display-name"
                    autoComplete="name"
                    disabled={isSigningUpWithPassword}
                    readOnly={isSigningUpWithPassword}
                    aria-invalid={fieldState.invalid}
                    className={`h-11 px-3 ${authInputClassName}`}
                    placeholder="Jane Appleseed"
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={auth.form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="signup-email"
                    type="email"
                    disabled={isSigningUpWithPassword}
                    readOnly={isSigningUpWithPassword}
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
              control={auth.form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                  <Input
                    {...field}
                    id="signup-password"
                    type="password"
                    disabled={isSigningUpWithPassword}
                    readOnly={isSigningUpWithPassword}
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    className={`h-11 px-3 ${authInputClassName}`}
                    placeholder="Enter a password..."
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            {auth.form.formState.errors.root?.message
              ? (
                <Field data-invalid>
                  <FieldError>{auth.form.formState.errors.root.message}</FieldError>
                </Field>
              )
              : null}
            <Button type="submit" disabled={isSigningUpWithPassword} className="h-11 w-full">
              {auth.mutation.isPending ? <LoadingIcon className="size-4" /> : 'Create account'}
            </Button>
          </FieldGroup>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Button
            variant="link"
            className="h-auto px-0 py-0 font-semibold"
            render={<Link href={authRoutes.login(redirectTo)} />}
          >
            Log in
          </Button>
        </p>
      </div>
    </AuthFormShell>
  );
}
