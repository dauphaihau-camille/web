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

import type { UseLoginFormResult } from '../../_hooks/use-login-form';

export function EmailCodeChallengeForm({ auth }: { auth: UseLoginFormResult }) {
  const codeValue = auth.codeForm.watch('code');
  const isVerifyingCode =
    auth.verifyEmailAuthMutation.isPending || auth.codeForm.formState.isSubmitting;

  return (
    <form key="email-code-challenge" onSubmit={auth.codeForm.handleSubmit(auth.handleVerifyCode)} noValidate>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel>Enter login code</FieldLabel>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to {auth.emailChallenge?.email}.
          </p>
        </Field>
        <Field data-invalid={auth.codeForm.getFieldState('code').invalid}>
          <Input
            id="login-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            disabled={isVerifyingCode}
            readOnly={isVerifyingCode}
            aria-invalid={auth.codeForm.getFieldState('code').invalid}
            className={`h-12 px-4 text-center text-lg tracking-[0.45em] ${authInputClassName}`}
            maxLength={6}
            onChange={(event) => {
              auth.codeForm.setValue(
                'code',
                event.target.value.replace(/\D/g, '').slice(0, 6),
                { shouldDirty: true, shouldValidate: true },
              );
            }}
            placeholder="123456"
            value={codeValue ?? ''}
          />
          {auth.codeForm.getFieldState('code').invalid
            ? <FieldError errors={[auth.codeForm.getFieldState('code').error]} />
            : null}
        </Field>
        {auth.codeForm.formState.errors.root?.message
          ? (
            <Field data-invalid>
              <FieldError>{auth.codeForm.formState.errors.root.message}</FieldError>
            </Field>
          )
          : null}

        <Button type="submit" disabled={isVerifyingCode} className="h-11 w-full font-medium">
          {auth.verifyEmailAuthMutation.isPending ? <LoadingIcon className="size-4" /> : 'Verify code'}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={auth.startEmailAuthMutation.isPending || auth.resendCooldownSeconds > 0}
          className="h-11 w-full"
          onClick={auth.handleResendCode}
        >
          {auth.startEmailAuthMutation.isPending
            ? 'Sending...'
            : auth.resendCooldownSeconds > 0
              ? `Resend in ${auth.resendCooldownSeconds}s`
              : 'Resend code'}
        </Button>

        <Button type="button" variant="ghost" className="h-11 w-full" onClick={auth.handleEditEmail}>
          Use a different email
        </Button>
      </FieldGroup>
    </form>
  );
}
