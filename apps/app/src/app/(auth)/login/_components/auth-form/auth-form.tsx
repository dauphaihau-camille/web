'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import LoadingFullPage from '@shared/components/loading-full-page';
import { Button } from '@shared/components/ui/button';
import { AuthFormShell } from '../../../_components/auth-form-shell';

import { EmailCodeChallengeForm } from './email-code-challenge-form';
import { EmailCodeLoginForm } from './email-code-login-form';
import { PasswordLoginForm } from './password-login-form';
import { authRoutes } from '@/domains/auth';
import { useLoginForm, type LoginAuthMethod } from '../../_hooks/use-login-form';

const authCopy = {
  title: 'Log in',
  alternateCtaLabel: 'Sign up',
  alternateCtaText: 'New user?',
} as const;

export function AuthForm() {
  const searchParams = useSearchParams();
  const [loginAuthMethod, setLoginAuthMethod] = useState<LoginAuthMethod>('email-code');
  const redirectTo = searchParams.get('redirectTo') ?? searchParams.get('from');
  const alternateHref = authRoutes.signup(redirectTo);

  const auth = useLoginForm();

  if (auth.isOAuthRedirecting || auth.isVerifyRedirecting) {
    return <LoadingFullPage overlay />;
  }

  return (
    <AuthFormShell title={authCopy.title}>
      <div className="grid gap-6">
        {auth.emailChallenge
          ? <EmailCodeChallengeForm auth={auth} />
          : loginAuthMethod === 'password'
            ? (
              <PasswordLoginForm
                auth={auth}
                redirectTo={redirectTo}
                setLoginAuthMethod={setLoginAuthMethod}
              />
            )
            : (
              <EmailCodeLoginForm
                auth={auth}
                setLoginAuthMethod={setLoginAuthMethod}
              />
            )}

        <p className="text-center text-sm text-muted-foreground">
          {authCopy.alternateCtaText}{' '}
          <Button
            variant="link"
            className="h-auto px-0 py-0 font-semibold"
            render={<Link href={alternateHref} />}
          >
            {authCopy.alternateCtaLabel}
          </Button>
        </p>
      </div>
    </AuthFormShell>
  );
}
