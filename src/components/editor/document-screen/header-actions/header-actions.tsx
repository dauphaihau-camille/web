'use client';

import {
  CopyIcon,
  EllipsisIcon,
  LinkIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Document } from '@/domains/document';
import { cn } from '@/lib/utils';

import { formatRelativeTime } from './header-actions.utils';
import { useHeaderActions } from './use-header-actions';

type HeaderActionsProps = {
  workspaceId: string;
  document: Document;
  isVisible?: boolean;
};

export function HeaderActions({
  workspaceId,
  document,
  isVisible = true,
}: HeaderActionsProps) {
  const {
    archiveCurrentDocument,
    copyLink,
    duplicateDocument,
    isArchiving,
    isDuplicating,
  } = useHeaderActions({
    workspaceId,
    document,
  });

  return (
    <div
      className={cn(
        'flex items-center transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex mr-2">
        <span>Edited {formatRelativeTime(document.updated_at)}</span>
      </div>
      <HeaderActionButton
        ariaLabel="Copy link"
        icon={<LinkIcon className="size-4" />}
        onClick={copyLink}
      />
      <HeaderActionButton
        ariaLabel="Favorite document"
        icon={<StarIcon className="size-4" />}
        disabled
      />
      <PageOperations
        isArchiving={isArchiving}
        isDuplicating={isDuplicating}
        updatedAt={document.updated_at}
        onArchive={archiveCurrentDocument}
        onCopyLink={copyLink}
        onDuplicate={duplicateDocument}
      />
    </div>
  );
}

function HeaderActionButton({
  ariaLabel,
  disabled = false,
  icon,
  onClick,
}: {
  ariaLabel: string;
  disabled?: boolean;
  icon: ReactNode;
  onClick?: () => void | Promise<void>;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      className={cn(
        'text-muted-foreground',
        disabled && 'pointer-events-none opacity-50',
      )}
      onClick={() => {
        void onClick?.();
      }}
    >
      {icon}
    </Button>
  );
}

function PageOperations({
  isArchiving,
  isDuplicating,
  updatedAt,
  onArchive,
  onCopyLink,
  onDuplicate,
}: {
  isArchiving: boolean;
  isDuplicating: boolean;
  updatedAt: string;
  onArchive: () => void;
  onCopyLink: () => void | Promise<void>;
  onDuplicate: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'text-muted-foreground',
        )}
      >
        <EllipsisIcon className="size-4" />
        <span className="sr-only">Open document actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-auto min-w-40"
      >
        <DropdownMenuItem
          variant="destructive"
          disabled={isArchiving}
          onClick={onArchive}
        >
          <Trash2Icon className="size-4" />
          <span>{isArchiving ? 'Moving to Trash...' : 'Move to Trash'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isDuplicating} onClick={onDuplicate}>
          <CopyIcon className="size-4" />
          <span>{isDuplicating ? 'Duplicating...' : 'Duplicate'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void onCopyLink()}>
          <LinkIcon className="size-4" />
          <span>Copy link</span>
          <DropdownMenuShortcut>{'\u21e7\u2318L'}</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">
            Last edited {formatRelativeTime(updatedAt)}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
