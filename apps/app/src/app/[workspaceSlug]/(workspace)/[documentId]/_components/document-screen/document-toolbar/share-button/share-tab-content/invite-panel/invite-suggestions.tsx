import {
  ArrowUpLeftIcon,
  UserRoundPlusIcon,
} from 'lucide-react';

import type { InviteSuggestion } from '../../_hooks/use-invite-composer';

export function InviteSuggestions({
  suggestions,
  onAddInvitee,
}: {
  suggestions: InviteSuggestion[];
  onAddInvitee: (invitee: InviteSuggestion) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-sm font-semibold text-muted-foreground">
        Keep typing an email to invite
      </p>
      {suggestions.map((member) => (
        <button
          key={member.id}
          type="button"
          className="flex h-8 w-full items-center gap-3 rounded-md px-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          onClick={() => onAddInvitee(member)}
        >
          <UserRoundPlusIcon className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">
            {member.displayName
              ? `${member.displayName} <${member.email}>`
              : member.email}
          </span>
          <ArrowUpLeftIcon className="size-4 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
