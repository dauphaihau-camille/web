'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';
import { useCurrentUserQuery } from '@/domains/auth';
import { cn } from '@/lib/utils';
import { CreateWorkspaceForm } from './_components/create-workspace-form';
import { useMyWorkspacesQuery } from '@/domains/workspace';

export default function WorkspaceEntryPage() {
  const router = useRouter();
  const currentUserQuery = useCurrentUserQuery();
  const myWorkspacesQuery = useMyWorkspacesQuery();
  const firstWorkspace = myWorkspacesQuery.data?.[0];
  const isResolvingSession = currentUserQuery.isLoading || currentUserQuery.isFetching;
  const isResolvingWorkspaces = myWorkspacesQuery.isLoading || myWorkspacesQuery.isFetching;

  useEffect(() => {
    if (isResolvingSession || isResolvingWorkspaces) {
      return;
    }

    if (!currentUserQuery.data) {
      router.replace('/login?redirectTo=%2Fworkspace');
      return;
    }

    if (firstWorkspace) {
      router.replace(`/${firstWorkspace.slug}`);
    }
  }, [
    currentUserQuery.data,
    isResolvingSession,
    firstWorkspace,
    isResolvingWorkspaces,
    router,
  ]);

  if (isResolvingSession || (currentUserQuery.data && isResolvingWorkspaces)) {
    return (
      <section className="rounded-2xl border p-6">
        <p className="text-sm text-muted-foreground">Opening your workspace...</p>
      </section>
    );
  }

  if (!currentUserQuery.data) {
    return (
      <section className="rounded-2xl border p-6">
        <p className="text-sm font-medium">Sign in required</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Camille opens workspaces from your authenticated API session.
        </p>
        <Link
          href="/login?redirectTo=%2Fworkspace"
          className={cn(buttonVariants(), 'mt-4')}
        >
          Go to login
        </Link>
      </section>
    );
  }

  if (firstWorkspace) {
    return (
      <section className="rounded-2xl border p-6">
        <p className="text-sm text-muted-foreground">Redirecting to {firstWorkspace.name}...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Create your first workspace</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Your account is active, but there is no workspace to open yet. Create one here to make
          the workspace slug route your default destination after login.
        </p>
      </div>
      <CreateWorkspaceForm />
    </section>
  );
}
