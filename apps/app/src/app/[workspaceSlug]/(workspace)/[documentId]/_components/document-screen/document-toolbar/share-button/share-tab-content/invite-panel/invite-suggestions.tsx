import {
  ArrowUpLeftIcon,
  UserRoundPlusIcon,
} from 'lucide-react';
import { useState } from 'react';

import type {
  InviteSuggestion,
  InviteSuggestionGroups,
} from '../../_hooks/use-invite-composer';
import { cn } from '@shared/lib/utils';

export function InviteSuggestions({
  activeSuggestionId,
  inviteQuery,
  suggestions,
  onAddInvitee,
  onSuggestionPointerEnter,
}: {
  activeSuggestionId?: string;
  inviteQuery: string;
  suggestions: InviteSuggestionGroups;
  onAddInvitee: (invitee: InviteSuggestion) => void;
  onSuggestionPointerEnter: (invitee: InviteSuggestion) => void;
}) {
  const hasInviteQuery = Boolean(inviteQuery.trim());
  const hasWorkspaceSuggestions = suggestions.workspace.length > 0;
  const hasExternalSuggestions = suggestions.external.length > 0;

  return (
    <div className="-mx-2">
      {hasWorkspaceSuggestions
        ? (
          <section className="">
            <p className="mb-1 pl-2 text-sm font-semibold text-muted-foreground">
              {hasInviteQuery ? 'Not invited to document' : 'Suggested'}
            </p>
            {suggestions.workspace.map((member) => (
              <button
                key={member.id}
                type="button"
                aria-label={`${member.displayName ?? member.email} <${member.email}>`}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-1 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  member.id === activeSuggestionId && 'bg-muted',
                )}
                onClick={() => onAddInvitee(member)}
                onPointerEnter={() => onSuggestionPointerEnter(member)}
              >
                <WorkspaceAvatar
                  avatar={member.avatar}
                  email={member.email}
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {member.displayName ?? member.email}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </span>
                <ArrowUpLeftIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </section>
        )
        : null}

      {hasExternalSuggestions
        ? (
          <section className="mt-3">
            <p className="mb-1 pl-2 text-sm font-semibold text-muted-foreground">
              Invite by email
            </p>
            {suggestions.external.map((member) => (
              <button
                key={member.id}
                type="button"
                aria-label={member.email}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  member.id === activeSuggestionId && 'bg-muted',
                )}
                onClick={() => onAddInvitee(member)}
                onPointerEnter={() => onSuggestionPointerEnter(member)}
              >
                <UserRoundPlusIcon className="size-5 shrink-0 text-muted-foreground" />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">
                    &ldquo;{member.email}&rdquo;
                  </span>
                </span>
                <ArrowUpLeftIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </section>
        )
        : null}
    </div>
  );
}

function WorkspaceAvatar({
  avatar,
  email,
}: {
  avatar?: string;
  email: string;
}) {
  const [hasAvatarError, setHasAvatarError] = useState(false);

  if (avatar && !hasAvatarError) {
    return (
      <img
        alt=""
        className="size-8 shrink-0 rounded-full border bg-background object-cover"
        src={avatar}
        onError={() => setHasAvatarError(true)}
      />
    );
  }

  return <EmailInitial email={email} />;
}

function EmailInitial({ email }: { email: string }) {
  const initial = email.trim()[0]?.toUpperCase() ?? '?';

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-medium text-muted-foreground">
      {initial}
    </span>
  );
}
