'use client';

import { ChevronDownIcon } from 'lucide-react';

import type { DocumentAccessGrantPermission } from '@/domains/document';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PersonRowContent } from '../person-row-content';
import { PermissionMenuContent } from '../permission-menu-content';

export function MemberAccessRow({
  accessSourceLabel,
  avatar,
  documentTitle,
  disabled = false,
  email,
  isCurrentUser,
  name,
  permission,
  permissionLabel,
  statusLabel,
  onPermissionChange,
  onRevoke,
}: {
  accessSourceLabel?: string;
  avatar?: string;
  documentTitle?: string;
  disabled?: boolean;
  email: string;
  isCurrentUser: boolean;
  name: string;
  permission?: DocumentAccessGrantPermission;
  permissionLabel: string;
  statusLabel?: string;
  onPermissionChange?: (permission: DocumentAccessGrantPermission) => void;
  onRevoke?: () => void;
}) {
  const accessControl = onPermissionChange
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
            accessSourceLabel={accessSourceLabel}
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
    );

  return (
    <div className="flex items-center gap-2.5">
      <PersonRowContent
        avatar={avatar}
        email={email}
        label={name}
        labelSuffix={isCurrentUser ? <span className="text-muted-foreground"> (You)</span> : null}
        statusLabel={statusLabel}
        trailing={accessControl}
      />
    </div>
  );
}
