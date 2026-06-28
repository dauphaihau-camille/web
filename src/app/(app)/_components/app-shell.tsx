import type { ReactNode } from 'react';

import { AppSidebar } from './app-sidebar';
import { AppTopbar } from './app-topbar';
import { Footer } from './layout/footer';
import { Header } from './layout/header';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-muted/30">
      <Header />
      <div className="mx-auto grid min-h-[calc(100svh-8rem)] max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <AppSidebar />
        <div className="flex min-w-0 flex-col gap-4">
          <AppTopbar />
          <main className="min-w-0 rounded-xl border bg-background p-6 shadow-sm">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
