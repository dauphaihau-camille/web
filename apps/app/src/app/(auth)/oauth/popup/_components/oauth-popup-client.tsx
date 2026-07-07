'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

const OAUTH_POPUP_MESSAGE_TYPE = 'camille:oauth-complete';

type OAuthPopupClientProps = {
  loginPath: string;
  redirectTarget: string;
};

export function OAuthPopupClient({
  loginPath,
  redirectTarget,
}: OAuthPopupClientProps) {

  useEffect(() => {
    if (!window.opener || window.opener.closed) {
      window.location.replace(redirectTarget);
      return;
    }

    window.opener.postMessage(
      {
        type: OAUTH_POPUP_MESSAGE_TYPE,
      },
      window.location.origin,
    );
    window.close();
  }, [redirectTarget]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Sign-in complete</h1>
          <p className="text-sm text-muted-foreground">
            You can close this window if it does not close automatically.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button render={<Link href={redirectTarget} />}>Continue</Button>
          <Button variant="outline" render={<Link href={loginPath} />}>
            Back to login
          </Button>
        </div>
      </div>
    </main>
  );
}
