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

  return <WakeClient nextPath={nextPath} retryPath={authRoutes.wake(nextPath)} />;
}
