import { useEffect } from 'react';
import {
  CopyIcon,
  EllipsisIcon,
  LinkIcon,
  Trash2Icon,
} from 'lucide-react';

import {
  COPY_LINK_EVENT,
  DUPLICATE_DOCUMENT_EVENT,
} from '@/app/(app)/[workspaceSlug]/_components/workspace-shortcuts-provider';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { formatRelativeTime } from './header-actions.utils';

type PageOperationsProps = {
  isArchiving: boolean;
  isDuplicating: boolean;
  updatedAt: string;
  onArchive: () => void;
  onCopyLink: () => void | Promise<void>;
  onDuplicate: () => void;
};

export function PageOperations({
  isArchiving,
  isDuplicating,
  updatedAt,
  onArchive,
  onCopyLink,
  onDuplicate,
}: PageOperationsProps) {
  useEffect(() => {
    const handleDuplicateDocument = () => {
      if (isDuplicating) {
        return;
      }

      onDuplicate();
    };

    window.addEventListener(DUPLICATE_DOCUMENT_EVENT, handleDuplicateDocument);

    return () => {
      window.removeEventListener(DUPLICATE_DOCUMENT_EVENT, handleDuplicateDocument);
    };
  }, [isDuplicating, onDuplicate]);

  useEffect(() => {
    const handleCopyLink = () => {
      void onCopyLink();
    };

    window.addEventListener(COPY_LINK_EVENT, handleCopyLink);

    return () => {
      window.removeEventListener(COPY_LINK_EVENT, handleCopyLink);
    };
  }, [onCopyLink]);

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
        className="w-auto min-w-48"
      >
        <DropdownMenuItem disabled={isDuplicating} onClick={onDuplicate}>
          <CopyIcon className="size-4" />
          <span>{isDuplicating ? 'Duplicating...' : 'Duplicate'}</span>
          <DropdownMenuShortcut>{'\u2318D'}</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void onCopyLink()}>
          <LinkIcon className="size-4" />
          <span>Copy link</span>
          <DropdownMenuShortcut>{'\u21e7\u2318L'}</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="!text-foreground focus:bg-accent focus:!text-destructive dark:focus:bg-accent [&_svg]:!text-muted-foreground focus:[&_svg]:!text-destructive data-disabled:[&_svg]:!text-muted-foreground"
          disabled={isArchiving}
          onClick={onArchive}
        >
          <Trash2Icon className="size-4" />
          <span>
            {isArchiving ? 'Moving to Trash...' : 'Move to Trash'}
          </span>
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
