import Link from 'next/link';
import type { ReactNode } from 'react';

import { publicEnv } from '@/lib/public-env';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <header className="bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link
            href={publicEnv.marketingHost}
            className="text-xl font-bold tracking-tight transition-opacity hover:opacity-60"
          >
            Camille
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
