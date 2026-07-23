'use client';

import {
  CheckIcon,
  Trash2Icon,
} from 'lucide-react';

import type { DocumentAccessGrantPermission } from '@/domains/document';
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@shared/lib/utils';
import {
  getPermissionLabel,
  permissionOptions,
} from './share-permissions';

export function PermissionMenuContent({
  accessSourceLabel,
  documentTitle,
  removeLabel = 'Remove',
  selectedPermission,
  showCurrentAccess = false,
  showUserAccessLabel = true,
  onChange,
  onRemove,
}: {
  accessSourceLabel?: string;
  documentTitle?: string;
  removeLabel?: string;
  selectedPermission: DocumentAccessGrantPermission;
  showCurrentAccess?: boolean;
  showUserAccessLabel?: boolean;
  onChange: (permission: DocumentAccessGrantPermission) => void;
  onRemove?: () => void;
}) {
  return (
    <>
      {showCurrentAccess
        ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 pt-1 pb-2 text-[12.5px] font-semibold">
                Current access
              </DropdownMenuLabel>
              <div className="px-3 pb-3">
                <p className="text-sm font-medium text-popover-foreground">
                  {getPermissionLabel(selectedPermission)}
                </p>
                {documentTitle
                  ? (
                    <p className="text-xs font-medium text-muted-foreground">
                      via
                      {' '}
                      {accessSourceLabel ?? 'user access'}
                      {' '}
                      on
                      {' '}
                      <span className="font-semibold">{documentTitle}</span>
                    </p>
                  )
                  : null}
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="mx-3 my-1" />
          </>
        )
        : null}

      <DropdownMenuGroup>
        {showUserAccessLabel
          ? (
            <DropdownMenuLabel className="px-3 py-2 text-[12.5px] font-semibold">
              User access
            </DropdownMenuLabel>
          )
          : null}
        <div className="space-y-0.5">
          {permissionOptions.map((option) => {
            const isSelected = option.value === selectedPermission;

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  'items-start gap-3 px-3 py-1.5',
                  isSelected && 'bg-muted',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-5 text-popover-foreground">
                    {option.label}
                  </span>
                  {option.description
                    ? (
                      <span className="mt-0.5 block text-xs font-medium leading-4 text-muted-foreground">
                        {option.description}
                      </span>
                    )
                    : null}
                </span>
                {isSelected ? <CheckIcon className="mt-0.5 size-4" /> : null}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuGroup>

      {onRemove
        ? (
          <>
            <DropdownMenuSeparator className="mx-3 my-1" />
            <DropdownMenuItem
              onClick={onRemove}
              className="gap-2 px-3 py-1.5 text-sm font-medium"
            >
              <Trash2Icon className="size-4" />
              {removeLabel}
            </DropdownMenuItem>
          </>
        )
        : null}
    </>
  );
}
