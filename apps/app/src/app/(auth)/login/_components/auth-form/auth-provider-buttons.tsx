import { LockKeyholeIcon, MailIcon } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { Separator } from '@shared/components/ui/separator';

import { GitHubIcon, GoogleIcon } from './social-icons';
import type { LoginAuthMethod, UseLoginFormResult } from '../../_hooks/use-login-form';

type AuthProviderButtonsProps = {
  auth: UseLoginFormResult;
  setLoginAuthMethod: (method: LoginAuthMethod) => void;
  switchMethod: LoginAuthMethod;
};

export function AuthProviderButtons({ auth, setLoginAuthMethod, switchMethod }: AuthProviderButtonsProps) {
  const SwitchIcon = switchMethod === 'password' ? LockKeyholeIcon : MailIcon;
  const switchLabel = switchMethod === 'password' ? 'Password' : 'Email';

  return (
    <>
      <div className="flex items-center gap-3 py-1 text-xs tracking-[0.18em] text-muted-foreground">
        <Separator aria-hidden="true" className="flex-1" />
        <span className="shrink-0">or continue with</span>
        <Separator aria-hidden="true" className="flex-1" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 font-medium"
        onClick={() => auth.handleOAuthSignIn('google')}
      >
        <GoogleIcon className="size-4 shrink-0" />
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 font-medium"
        onClick={() => auth.handleOAuthSignIn('github')}
      >
        <GitHubIcon className="size-4 shrink-0 text-foreground" />
        GitHub
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 font-medium"
        onClick={() => setLoginAuthMethod(switchMethod)}
      >
        <SwitchIcon className="size-4 shrink-0" />
        {switchLabel}
      </Button>
    </>
  );
}
