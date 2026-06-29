'use client';

import Link from 'next/link';

import { useCurrentUserQuery } from '@/domains/auth';

export function UserMenu() {
  const currentUserQuery = useCurrentUserQuery();

  if (currentUserQuery.isLoading) {
    return (
      <div className="rounded-full border px-3 py-1 text-sm text-muted-foreground">
        Loading session...
      </div>
    );
  }

  if (!currentUserQuery.data) {
    return (
      <Link
        href="/login"
        className="rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="rounded-full border px-3 py-1 text-sm text-muted-foreground">
      {currentUserQuery.data.email}
    </div>
  );
}
