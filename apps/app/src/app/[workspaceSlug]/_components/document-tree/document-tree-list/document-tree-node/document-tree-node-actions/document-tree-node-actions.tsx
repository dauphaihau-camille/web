'use client';

import { useState } from 'react';
import {
  CopyIcon,
  EllipsisIcon,
  LinkIcon,
  PlusIcon,
  StarOffIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import { LoadingIcon } from '@shared/components/loading-icon';
import { buttonVariants } from '@shared/components/ui/button';
import type { DocumentNavigationNode } from '@/domains/document';
import { cn } from '@shared/lib/utils';

import { useDocumentTreeNodeActions } from './use-document-tree-node-actions';

type DocumentTreeNodeActionsProps = {
  mode?: 'full' | 'readOnly';
  document: DocumentNavigationNode;
  isActive: boolean;
  workspaceSlug: string;
};

export function DocumentTreeNodeActions({
  mode = 'full',
  document,
  isActive,
  workspaceSlug,
}: DocumentTreeNodeActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    archiveDocumentMutation,
    createSubdocumentMutation,
    duplicateDocumentMutation,
    favoriteMutation,
    handleArchive,
    handleCopyLink,
    handleCreateSubdocument,
    handleDuplicate,
    handleToggleFavorite,
    isFavorite,
  } = useDocumentTreeNodeActions({
    document,
    isActive,
    workspaceSlug,
  });

  const canMutate = mode === 'full';
  const isBusy = createSubdocumentMutation.isPending;

  const createSubdocumentButton = (
    <button
      type="button"
      aria-label="Create subdocument"
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
        'size-5 rounded-sm bg-transparent text-sidebar-foreground/70 hover:!bg-sidebar-accent-foreground/5 hover:text-sidebar-accent-foreground',
      )}
      disabled={isBusy}
      onClick={handleCreateSubdocument}
    >
      {isBusy
        ? <LoadingIcon className="size-4" />
        : <PlusIcon className="size-4" />}
    </button>
  );

  return (
    <div
      className={cn(
        'absolute inset-y-0 right-1 z-20 flex items-center gap-0.5 rounded pr-0.5 pl-1 opacity-0 transition-opacity group-hover/menu-sub-item:opacity-100',
        isMenuOpen && 'opacity-100',
      )}
    >
      {canMutate
        ? (
          <Tooltip>
            <TooltipTrigger delay={0} render={createSubdocumentButton} />
            <TooltipContent side="bottom">Add a document inside</TooltipContent>
          </Tooltip>
        )
        : null}

      <DropdownMenu onOpenChange={setIsMenuOpen}>
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={
              <DropdownMenuTrigger
                className={cn(
                  'flex size-5 items-center justify-center rounded-sm bg-transparent text-sidebar-foreground/70 outline-hidden transition-colors hover:bg-sidebar-accent-foreground/10 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring aria-expanded:bg-sidebar-accent-foreground/10 aria-expanded:text-sidebar-accent-foreground',
                )}
              >
                <EllipsisIcon className="size-4" />
                <span className="sr-only">Open document actions</span>
              </DropdownMenuTrigger>
            }
          />
          <TooltipContent side="bottom">
            {canMutate ? 'Delete, duplicate, and more...' : 'Copy link and favorite'}
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          side="right"
          sideOffset={8}
          className="w-auto min-w-48"
        >
          {canMutate
            ? (
              <DropdownMenuItem
                disabled={duplicateDocumentMutation.isPending}
                onClick={handleDuplicate}
              >
                <CopyIcon className="size-4" />
                <span>
                  {duplicateDocumentMutation.isPending
                    ? 'Duplicating...'
                    : 'Duplicate'}
                </span>
              </DropdownMenuItem>
            )
            : null}

          <DropdownMenuItem onClick={() => void handleCopyLink()}>
            <LinkIcon className="size-4" />
            <span>Copy link</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={favoriteMutation.isPending}
            onClick={handleToggleFavorite}
          >
            {isFavorite
              ? (
                <StarOffIcon className="size-4" />
              )
              : (
                <StarIcon className="size-4" />
              )}
            <span>
              {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </span>
          </DropdownMenuItem>

          {canMutate
            ? (
              <>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  className="!text-foreground focus:bg-accent focus:!text-destructive dark:focus:bg-accent [&_svg]:!text-muted-foreground focus:[&_svg]:!text-destructive data-disabled:[&_svg]:!text-muted-foreground"
                  disabled={archiveDocumentMutation.isPending}
                  onClick={handleArchive}
                >
                  <Trash2Icon className="size-4" />
                  <span>
                    {archiveDocumentMutation.isPending
                      ? 'Moving to Trash...'
                      : 'Move to Trash'}
                  </span>
                </DropdownMenuItem>
              </>
            )
            : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
