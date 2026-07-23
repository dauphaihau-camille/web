'use client';

import { ChevronDownIcon } from 'lucide-react';

import type { DocumentAccessGrantPermission } from '@/domains/document';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getPermissionLabel,
} from '../../share-permissions';
import { PermissionMenuContent } from '../../permission-menu-content';

export function PermissionDropdown({
  disabled = false,
  permission,
  onChange,
}: {
  disabled?: boolean;
  permission: DocumentAccessGrantPermission;
  onChange: (permission: DocumentAccessGrantPermission) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className="inline-flex h-6 items-center gap-1 rounded px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        {getPermissionLabel(permission)}
        <ChevronDownIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-70 p-2">
        <PermissionMenuContent
          showUserAccessLabel={false}
          selectedPermission={permission}
          onChange={onChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
