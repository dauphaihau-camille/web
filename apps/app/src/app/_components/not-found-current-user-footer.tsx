'use client';

import {
  Avatar,
  AvatarImage,
} from '@shared/components/ui/avatar';

import { useCurrentUserQuery } from '@/domains/auth/hooks/use-current-user-query';

export function NotFoundCurrentUserFooter() {
  const currentUserQuery = useCurrentUserQuery();
  const currentUser = currentUserQuery.data;

  if (!currentUser) {
    return null;
  }

  return (
    <footer className="flex h-20 shrink-0 items-center justify-center px-6 pb-4 text-sm text-muted-foreground">
      <div className="inline-flex min-w-0 items-center gap-2">
        {currentUser.avatar
          ? (
            <Avatar size="sm" className="border-transparent">
              <AvatarImage src={currentUser.avatar} alt="" />
            </Avatar>
          )
          : null}
        <span className="min-w-0">
          Logged in as{' '}
          <span className="font-semibold text-foreground">
            {currentUser.email}
          </span>
        </span>
      </div>
    </footer>
  );
}
