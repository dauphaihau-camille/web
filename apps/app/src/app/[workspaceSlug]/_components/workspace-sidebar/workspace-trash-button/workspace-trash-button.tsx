'use client';

import Link from 'next/link';
import {
  FileIcon,
  FileTextIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react';

import { PermanentlyDeleteDocumentDialog } from '@/domains/document/components/permanently-delete-document-dialog';
import { LoadingIcon } from '@shared/components/loading-icon';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/components/ui/popover';
import { ScrollFade } from '@shared/components/ui/scroll-fade';
import { cn } from '@shared/lib/utils';
import { workspaceRoutes } from '@shared/domains/workspace';
import { SidebarMenuButton } from '@/components/ui/sidebar';

import { useWorkspaceTrash } from './_hooks/use-workspace-trash';

export function WorkspaceTrashButton({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const {
    busyDocumentId,
    handleConfirmDelete,
    handleDeleteDialogOpenChange,
    handleOpenChange,
    handlePopoverLinkClick,
    handleRestoreDocument,
    handleSearchChange,
    isDeleteDialogOpen,
    isDeletingSelectedDocument,
    isLoading,
    isOpen,
    items,
    openDeleteDialog,
    permanentlyDeleteMutation,
    restoreMutation,
    searchQueryValue,
    searchValue,
  } = useWorkspaceTrash({ workspaceSlug });

  return (
    <>
      <Popover
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        <PopoverTrigger
          render={
            <SidebarMenuButton tooltip="Trash" isActive={isOpen}>
              <Trash2Icon />
              <span>Trash</span>
            </SidebarMenuButton>
          }
        >
          <Trash2Icon />
          <span>Trash</span>
        </PopoverTrigger>

        <PopoverContent
          side="right"
          align="start"
          sideOffset={12}
          className="min-h-100 w-90 gap-3 rounded-2xl border border-sidebar-border bg-sidebar p-3 text-sidebar-foreground shadow-xl"
        >
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => {
                handleSearchChange(event.target.value);
              }}
              placeholder="Search archived documents..."
              className="bg-sidebar-accent/40 pl-9"
            />
          </div>

          <ScrollFade
            direction="y"
            fadeColor="var(--sidebar)"
            className="max-h-80 space-y-1 overflow-y-auto pr-2"
          >
            {isLoading
              ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Loading...
                </p>
              )
              : null}

            {!isLoading && items.length === 0
              ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  {searchQueryValue
                    ? 'No archived documents found.'
                    : 'Trash is empty.'}
                </p>
              )
              : null}

            {items.map((document) => {
              const isRestoring =
                restoreMutation.isPending
                && restoreMutation.variables?.documentId === document.id;
              const isDeleting =
                permanentlyDeleteMutation.isPending
                && permanentlyDeleteMutation.variables?.documentId === document.id;
              const isBusy = busyDocumentId === document.id;

              return (
                <div
                  key={document.id}
                  className="flex items-start gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <TrashDocumentIcon hasContent={document.has_content} />
                  <Link
                    href={workspaceRoutes.document(
                      workspaceSlug,
                      document.public_id,
                      document.title,
                    )}
                    className="min-w-0 flex-1"
                    onClick={handlePopoverLinkClick}
                  >
                    <div className="truncate text-[15px] font-semibold text-foreground">
                      {document.title}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {formatBreadcrumbPath(document.breadcrumb_path)}
                    </div>
                  </Link>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="mt-0.5 size-7 shrink-0 rounded-sm text-sidebar-foreground/70 hover:!bg-sidebar-accent-foreground/10 hover:text-sidebar-accent-foreground"
                    aria-label={`Restore ${document.title}`}
                    disabled={isBusy}
                    onClick={() => {
                      handleRestoreDocument({
                        documentId: document.id,
                        version: document.version,
                      });
                    }}
                  >
                    {isRestoring
                      ? (
                        <LoadingIcon className="size-4" />
                      )
                      : (
                        <RotateCcwIcon className="size-4" />
                      )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className={cn(
                      'mt-0.5 size-7 shrink-0 rounded-sm text-sidebar-foreground/70 hover:!bg-sidebar-accent-foreground/10',
                    )}
                    aria-label={`Permanently delete ${document.title}`}
                    disabled={isBusy}
                    onClick={() => {
                      openDeleteDialog({
                        id: document.id,
                        title: document.title,
                        version: document.version,
                      });
                    }}
                  >
                    {isDeleting
                      ? (
                        <LoadingIcon className="size-4" />
                      )
                      : (
                        <Trash2Icon className="size-4" />
                      )}
                  </Button>
                </div>
              );
            })}
          </ScrollFade>
        </PopoverContent>
      </Popover>

      <PermanentlyDeleteDocumentDialog
        isDeleting={isDeletingSelectedDocument}
        onConfirm={handleConfirmDelete}
        onOpenChange={handleDeleteDialogOpenChange}
        open={isDeleteDialogOpen}
      />
    </>
  );
}

function TrashDocumentIcon({ hasContent }: { hasContent: boolean }) {
  const Icon = hasContent ? FileTextIcon : FileIcon;

  return <Icon className="mt-0.5 size-4 shrink-0 text-sidebar-foreground/60" />;
}

function formatBreadcrumbPath(path: string[]) {
  if (path.length === 0) {
    return 'Private';
  }

  if (path.length <= 2) {
    return path.join(' / ');
  }

  return `${path[0]} / ... / ${path[path.length - 1]}`;
}
