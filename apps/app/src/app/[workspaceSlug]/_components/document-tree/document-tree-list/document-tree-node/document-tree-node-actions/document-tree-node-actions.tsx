'use client';

import { useState } from 'react';
import {
  CopyIcon,
  EllipsisIcon,
  LinkIcon,
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
import type { DocumentNavigationNode } from '@/domains/document';
import { cn } from '@shared/lib/utils';

import { useDocumentTreeNodeActions } from './use-document-tree-node-actions';
import { CreateDocumentButton } from '@/app/[workspaceSlug]/_components/create-document-button';

type DocumentTreeNodeActionsProps = {
  document: DocumentNavigationNode;
  isActive: boolean;
  workspaceSlug: string;
};

export function DocumentTreeNodeActions({
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

  const isBusy = createSubdocumentMutation.isPending;

  const createSubdocumentButton = (
    <CreateDocumentButton
      ariaLabel="Create subdocument"
      disabled={isBusy}
      onClick={handleCreateSubdocument}
      isPending={isBusy}
    />
  );

  return (
    <div
      className={cn(
        'absolute inset-y-0 right-1 z-20 flex items-center gap-0.5 rounded pr-0.5 pl-1 opacity-0 transition-opacity group-hover/menu-sub-item:opacity-100',
        isMenuOpen && 'opacity-100',
      )}
    >
      <Tooltip>
        <TooltipTrigger render={createSubdocumentButton} />
        <TooltipContent side="bottom">Add a document inside</TooltipContent>
      </Tooltip>

      <DropdownMenu onOpenChange={setIsMenuOpen}>
        <Tooltip>
          <TooltipTrigger
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
            Delete, duplicate, and more...
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          side="right"
          sideOffset={8}
          className="w-auto min-w-48"
        >
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
