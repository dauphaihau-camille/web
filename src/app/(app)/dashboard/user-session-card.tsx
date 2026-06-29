'use client';

import Link from 'next/link';

import { useCurrentUserQuery } from '@/domains/auth';
import { useMyWorkspacesQuery } from '@/domains/workspace';

export function UserSessionCard() {
  const currentUserQuery = useCurrentUserQuery();
  const myWorkspacesQuery = useMyWorkspacesQuery();
  const firstWorkspace = myWorkspacesQuery.data?.[0];

  if (currentUserQuery.isLoading) {
    return (
      <div className="rounded-2xl border p-5">
        <p className="text-sm text-muted-foreground">Checking API session...</p>
      </div>
    );
  }

  if (!currentUserQuery.data) {
    return (
      <div className="rounded-2xl border p-5">
        <p className="text-sm font-medium">No active session</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in against the API first, then this shell will load workspace data over the same
          cookie-based session.
        </p>
        <Link href="/login" className="mt-4 inline-flex text-sm font-medium underline underline-offset-4">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-5">
      <p className="text-sm font-medium">Authenticated API session</p>
      <p className="mt-2 text-sm text-muted-foreground">{currentUserQuery.data.email}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Workspace discovery uses <span className="font-mono">GET /me/workspaces</span>.
      </p>
      {firstWorkspace
        ? (
          <Link
            href={`/workspace/${firstWorkspace.id}`}
            className="mt-4 inline-flex text-sm font-medium underline underline-offset-4"
          >
            Open {firstWorkspace.name}
          </Link>
        )
        : null}
    </div>
  );
}
