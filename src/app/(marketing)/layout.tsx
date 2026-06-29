import type { ReactNode } from 'react';

import { Navigate } from './_components/navigate';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
      <header className="w-full bg-white">
        <Navigate />
      </header>
      <main className="pb-20">{children}</main>
    </div>
  );
}
