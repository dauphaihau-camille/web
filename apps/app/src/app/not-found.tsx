import Link from 'next/link';

import { Button } from '@shared/components/ui/button';

import { NotFoundCurrentUserFooter } from './_components/not-found-current-user-footer';

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex h-16 shrink-0 items-center px-6">
        <Link
          href="/workspace"
          className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight transition-opacity hover:opacity-70"
        >
          Camille
        </Link>
      </header>

      <section className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-normal">
              This page could not be found
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              You may not have access, or it might have been deleted or moved.
              Check the link and try again.
            </p>
          </div>

          <Button variant="outline" render={<Link href="/workspace" />}>
            Back to my content
          </Button>
        </div>
      </section>

      <NotFoundCurrentUserFooter />
    </main>
  );
}
