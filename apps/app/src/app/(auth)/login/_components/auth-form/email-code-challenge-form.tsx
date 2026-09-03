import { LoadingIcon } from '@shared/components/loading-icon';
import { Button } from '@shared/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@shared/components/ui/input-otp';

import type { UseLoginFormResult } from '../../_hooks/use-login-form';

export function EmailCodeChallengeForm({ auth }: { auth: UseLoginFormResult }) {
  const codeValue = auth.codeForm.watch('code');

  const isVerifyingCode =
    auth.verifyEmailAuthMutation.isPending || auth.codeForm.formState.isSubmitting;

  const isCodeComplete = codeValue?.length === 6;
  const codeFieldState = auth.codeForm.getFieldState('code');

  return (
    <form key="email-code-challenge" onSubmit={auth.codeForm.handleSubmit(auth.handleVerifyCode)} noValidate>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="login-code">Enter login code</FieldLabel>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to {auth.emailChallenge?.email}.
          </p>
        </Field>

        <Field data-invalid={codeFieldState.invalid}>
          <InputOTP
            id="login-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            disabled={isVerifyingCode}
            aria-invalid={codeFieldState.invalid}
            maxLength={6}
            pattern={'^\\d+$'}
            value={codeValue ?? ''}
            onChange={(value) => {
              const code = value.replace(/\D/g, '').slice(0, 6);

              if (code.length < 6) {
                auth.codeForm.clearErrors('code');
              }

              auth.codeForm.setValue('code', code, {
                shouldDirty: true,
                shouldValidate: code.length === 6,
              });
            }}
            containerClassName="justify-center"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  aria-invalid={codeFieldState.invalid}
                  className="h-12 w-10 bg-background text-lg"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {codeFieldState.invalid ? <FieldError errors={[codeFieldState.error]} /> : null}
        </Field>

        {auth.codeForm.formState.errors.root?.message
          ? (
            <Field data-invalid>
              <FieldError>{auth.codeForm.formState.errors.root.message}</FieldError>
            </Field>
          )
          : null}

        <Button type="submit" disabled={isVerifyingCode || !isCodeComplete} className="h-11 w-full font-medium">
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
