import {
  ArrowUpLeftIcon,
  UserRoundPlusIcon,
} from 'lucide-react';

import type { InviteSuggestion } from '../../_hooks/use-invite-composer';

export function InviteSuggestions({
  inviteQuery,
  suggestions,
  onAddInvitee,
}: {
  inviteQuery: string;
  suggestions: InviteSuggestion[];
  onAddInvitee: (invitee: InviteSuggestion) => void;
}) {
  const hasExternalSuggestions = suggestions.some((member) => member.source === 'external');
  const hasInviteQuery = Boolean(inviteQuery.trim());

  const label = getSuggestionsLabel({
    hasExternalSuggestions,
    hasInviteQuery,
  });

  return (
    <div className="-mx-2">
      <p className="text-sm font-semibold text-muted-foreground mb-1 pl-2">
        {label}
      </p>
      {suggestions.map((member) => (
        <button
          key={member.id}
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          onClick={() => onAddInvitee(member)}
        >
          {member.source === 'workspace'
            ? <EmailInitial email={member.email} />
            : <UserRoundPlusIcon className="size-5 shrink-0 text-muted-foreground" />}

          <span className="min-w-0 flex-1">
            {member.source === 'workspace'
              ? (
                <>
                  <span className="block truncate text-sm font-medium text-foreground">
                    {member.email}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </>
              )
              : (
                <span className="block truncate text-sm text-foreground">
                  &ldquo;{member.email}&rdquo;
                </span>
              )}
          </span>
          <ArrowUpLeftIcon className="size-4 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

function EmailInitial({ email }: { email: string }) {
  const initial = email.trim()[0]?.toUpperCase() ?? '?';

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-medium text-muted-foreground">
      {initial}
    </span>
  );
}

function getSuggestionsLabel({
  hasExternalSuggestions,
  hasInviteQuery,
}: {
  hasExternalSuggestions: boolean;
  hasInviteQuery: boolean;
}) {
  if (!hasInviteQuery) {
    return 'Suggested';
  }

  return hasExternalSuggestions
    ? 'Keep typing an email to invite'
    : 'Not invite to document';
}
