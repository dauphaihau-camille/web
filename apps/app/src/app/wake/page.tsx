import { LoadingIcon } from '@shared/components/loading-icon';
import { authRoutes, resolveWakeNextPath } from '@/domains/auth';
import { WakeClient } from './_components/wake-client';

type WakePageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function WakePage({ searchParams }: WakePageProps) {
  const resolvedSearchParams = await searchParams;
  const next = Array.isArray(resolvedSearchParams?.next)
    ? resolvedSearchParams.next[0]
    : resolvedSearchParams?.next;

  const nextPath = resolveWakeNextPath(next, authRoutes.login());

  return (
    <>
      <WakePageShell retryPath={authRoutes.wake(nextPath)} />
      <WakeClient nextPath={nextPath} />
    </>
  );
}

function WakePageShell({ retryPath }: { retryPath: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md p-8 text-center">
        <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-5">
          <LoadingIcon className="size-8" />
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Waking up Camille
            </h1>
            <p className="text-sm text-muted-foreground">
              The backend server is starting. This usually takes 20 to 60 seconds.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            We will continue automatically when it is ready.
          </p>
          <a
            href={retryPath}
            className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-semibold text-foreground"
          >
            Retry now
          </a>
        </div>
      </section>
    </main>
  );
}
