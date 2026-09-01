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
import { authInputClassName } from '../../../_components/auth-form-styles';

import { AuthProviderButtons } from './auth-provider-buttons';
import type { LoginAuthMethod, UseLoginFormResult } from '../../_hooks/use-login-form';

export function EmailCodeLoginForm({
  auth,
  setLoginAuthMethod,
}: {
  auth: UseLoginFormResult;
  setLoginAuthMethod: (method: LoginAuthMethod) => void;
}) {
  const isRequestingCode =
    auth.startEmailAuthMutation.isPending || auth.emailForm.formState.isSubmitting;

  return (
    <form key="email-code-login" onSubmit={auth.emailForm.handleSubmit(auth.handleRequestCode)} noValidate>
      <FieldGroup className="gap-4">
        <Controller
          name="email"
          control={auth.emailForm.control}
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
                className={`h-11 px-3 ${authInputClassName}`}
                placeholder="Enter your email address..."
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        {auth.emailForm.formState.errors.root?.message
          ? (
            <Field data-invalid>
              <FieldError>{auth.emailForm.formState.errors.root.message}</FieldError>
            </Field>
          )
          : null}

        <Button type="submit" disabled={isRequestingCode} className="h-11 w-full">
          {auth.startEmailAuthMutation.isPending ? <LoadingIcon className="size-4" /> : 'Continue'}
        </Button>

        <AuthProviderButtons
          auth={auth}
          setLoginAuthMethod={setLoginAuthMethod}
          switchMethod="password"
        />
      </FieldGroup>
    </form>
  );
}
