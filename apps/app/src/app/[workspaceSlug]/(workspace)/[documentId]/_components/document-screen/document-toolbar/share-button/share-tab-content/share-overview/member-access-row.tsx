'use client';

import { ChevronDownIcon } from 'lucide-react';

import type { DocumentAccessGrantPermission } from '@/domains/document';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionMenuContent } from '../permission-menu-content';

export function MemberAccessRow({
  documentTitle,
  disabled = false,
  email,
  isCurrentUser,
  name,
  permission,
  permissionLabel,
  onPermissionChange,
  onRevoke,
}: {
  documentTitle?: string;
  disabled?: boolean;
  email: string;
  isCurrentUser: boolean;
  name: string;
  permission?: DocumentAccessGrantPermission;
  permissionLabel: string;
  onPermissionChange?: (permission: DocumentAccessGrantPermission) => void;
  onRevoke?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <InitialsAvatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {name}
          {isCurrentUser ? <span className="text-muted-foreground"> (You)</span> : null}
        </p>
        <p className="truncate text-[12px] text-muted-foreground">{email}</p>
      </div>
      {onPermissionChange
        ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={disabled}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              {permissionLabel}
              <ChevronDownIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-70 p-2">
              <PermissionMenuContent
                documentTitle={documentTitle}
                selectedPermission={permission ?? 'manage'}
                showCurrentAccess
                onChange={onPermissionChange}
                onRemove={onRevoke}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        )
        : (
          <span className="text-sm font-medium text-muted-foreground">
            {permissionLabel}
          </span>
        )}
    </div>
  );
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || name[0]?.toUpperCase() || '?';

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold text-muted-foreground">
      {initials}
    </div>
  );
}
