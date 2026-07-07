'use client';

import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { getAppLoginUrl, getAppSignupUrl } from '@/lib/app-url';
import { cn } from '@/lib/utils';

import { MarketingNavigationMenu } from './marketing-navigation-menu';

export function Navigate() {
  return (
    <div className="mx-auto flex h-16 items-center justify-between py-4">
      <Link href="/" className="text-xl font-bold hover:opacity-50">
        Camille
      </Link>

      <MarketingNavigationMenu />

      <div className="flex items-center gap-2">
        <Link
          href={getAppLoginUrl()}
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'sm' }),
            'px-2.5 text-[13px]',
          )}
        >
          Login
        </Link>
        <Link
          href={getAppSignupUrl()}
          className={cn(buttonVariants({ size: 'sm' }), 'px-2.5 text-[13px]')}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
