import type { ReactNode } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@shared/components/ui/avatar';
import { cn } from '@shared/lib/utils';

export function PersonRowContent({
  avatar,
  email,
  label,
  labelClassName,
  labelContent,
  labelSuffix,
  leading,
  statusLabel,
  trailing,
}: {
  avatar?: string;
  email?: string;
  label: string;
  labelClassName?: string;
  labelContent?: ReactNode;
  labelSuffix?: ReactNode;
  leading?: ReactNode;
  statusLabel?: string;
  trailing?: ReactNode;
}) {
  return (
    <>
      {leading ?? <PersonAvatar avatar={avatar} label={label} />}

      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-sm font-medium text-foreground', labelClassName)}>
          {labelContent ?? label}
          {labelSuffix}
          {statusLabel
            ? (
              <span className="ml-1.5 rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {statusLabel}
              </span>
            )
            : null}
        </span>
        {email
          ? (
            <span className="block truncate text-[12px] font-medium text-muted-foreground">
              {email}
            </span>
          )
          : null}
      </span>

      {trailing}
    </>
  );
}

function PersonAvatar({
  avatar,
  label,
}: {
  avatar?: string;
  label: string;
}) {
  const initial = label.trim()[0]?.toUpperCase() ?? '?';

  return (
    <Avatar className="size-8 shrink-0 border bg-background">
      {avatar
        ? (
          <AvatarImage
            alt=""
            src={avatar}
          />
        )
        : null}
      <AvatarFallback className={cn('text-xs font-semibold', !avatar && 'bg-background')}>
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
