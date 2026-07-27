import {
  ArrowUpLeftIcon,
  UserRoundPlusIcon,
} from 'lucide-react';

import type {
  InviteSuggestion,
  InviteSuggestionGroups,
} from '../../_hooks/use-invite-composer';
import { cn } from '@shared/lib/utils';
import { PersonRowContent } from '../person-row-content';

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
                <PersonRowContent
                  avatar={member.avatar}
                  label={member.displayName ?? member.email}
                  email={member.email}
                  trailing={<ArrowUpLeftIcon className="size-4 shrink-0 text-muted-foreground" />}
                />
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
                  'flex w-full items-center gap-1 rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  member.id === activeSuggestionId && 'bg-muted',
                )}
                onClick={() => onAddInvitee(member)}
                onPointerEnter={() => onSuggestionPointerEnter(member)}
              >
                <PersonRowContent
                  label={member.email}
                  labelClassName="font-normal"
                  labelContent={(
                    <>
                      &ldquo;{member.email}&rdquo;
                    </>
                  )}
                  leading={<UserRoundPlusIcon className="size-5 shrink-0 text-muted-foreground" />}
                  trailing={<ArrowUpLeftIcon className="size-4 shrink-0 text-muted-foreground" />}
                />
              </button>
            ))}
          </section>
        )
        : null}
    </div>
  );
}
