import { useState } from 'react';

import { XIcon } from 'lucide-react';

import type { SelectedInvitee } from '../../../_hooks/use-invite-composer';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@shared/components/ui/avatar';
import { InputGroupButton } from '@shared/components/ui/input-group';
import { cn } from '@shared/lib/utils';

export function InviteeBadge({
  invitee,
  onRemove,
}: {
  invitee: SelectedInvitee;
  onRemove: () => void;
}) {
  const isWorkspaceInvitee = invitee.source === 'workspace';
  const label = invitee.displayName ?? invitee.email;

  if (isWorkspaceInvitee) {
    return (
      <InviteePill
        avatar={invitee.avatar}
        label={label}
        tone="workspace"
        onRemove={onRemove}
      />
    );
  }

  return (
    <InviteePill
      label={invitee.email}
      tone="email"
      onRemove={onRemove}
    />
  );
}

function InviteePill({
  avatar,
  label,
  tone,
  onRemove,
}: {
  avatar?: string;
  label: string;
  tone: 'email' | 'workspace';
  onRemove: () => void;
}) {
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const initial = getInitial(label);

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium',
        tone === 'workspace'
          ? 'bg-muted text-foreground dark:bg-muted/70'
          : 'bg-amber-100 text-amber-950 dark:bg-amber-400/20 dark:text-amber-100',
      )}
    >
      {tone === 'workspace'
        ? (
          <Avatar className="size-5 shrink-0">
            {avatar && !hasAvatarError
              ? <AvatarImage alt="" src={avatar} onError={() => setHasAvatarError(true)} />
              : null}
            <AvatarFallback className={cn('text-[10px]', !avatar && 'bg-background')}>
              {initial}
            </AvatarFallback>
          </Avatar>
        )
        : null}
      <span className="truncate">{label}</span>
      <InputGroupButton
        size="icon-xs"
        variant="ghost"
        aria-label={`Remove ${label}`}
        className={cn(
          'size-5',
          tone === 'workspace'
            ? 'text-muted-foreground hover:bg-background/60'
            : 'text-amber-950/70 hover:bg-amber-200/70 dark:text-amber-100/80 dark:hover:bg-amber-300/20',
        )}
        onClick={onRemove}
      >
        <XIcon className="size-3.5" />
      </InputGroupButton>
    </span>
  );
}

function getInitial(label: string) {
  return label.trim()[0]?.toUpperCase() ?? '?';
}
