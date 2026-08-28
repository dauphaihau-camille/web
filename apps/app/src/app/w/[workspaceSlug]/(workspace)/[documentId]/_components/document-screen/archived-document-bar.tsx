'use client';

import { useState } from 'react';
import { RotateCcwIcon, Trash2Icon } from 'lucide-react';

import { PermanentlyDeleteDocumentDialog } from '@/domains/document/components/permanently-delete-document-dialog';
import { buttonVariants } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';

import { RelativeTimeText } from './document-toolbar/doc-operations/relative-time-text';

export function ArchivedDocumentBar({
  archivedAt,
  archivedByName,
  isDeleting,
  isRestoring,
  offsetTop = 0,
  onDelete,
  onRestore,
}: {
  archivedAt: string;
  archivedByName?: string;
  isDeleting: boolean;
  isRestoring: boolean;
  offsetTop?: number;
  onDelete: () => void;
  onRestore: () => void;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <div
        className="fixed inset-x-0 z-20 h-12 border-b border-white/15 bg-[#ff4d57]/90 px-5 text-white md:left-(--sidebar-width) md:right-[var(--workspace-right-rail-reserved-width,0rem)]"
        style={{ top: offsetTop }}
      >
        <div className="flex h-full items-center justify-center gap-3 text-center text-sm font-medium">
          <span className="truncate">
            <span className="font-semibold">
              {archivedByName ?? 'Someone'}
            </span>
            {' moved this document to Trash '}
            <RelativeTimeText fallback="recently" value={archivedAt} />
            {'. It will be permanently deleted in 30 days.'}
          </span>

          <button
            type="button"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-8 gap-1 border border-white bg-white px-3 text-[#ff4d57] hover:bg-white/90 hover:text-[#ff4d57]',
            )}
            disabled={isRestoring || isDeleting}
            onClick={onRestore}
          >
            <RotateCcwIcon className="size-4" />
            <span>{isRestoring ? 'Restoring...' : 'Restore'}</span>
          </button>

          <button
            type="button"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-8 gap-1 border border-white/85 bg-transparent px-3 text-white hover:border-white hover:bg-white/12 hover:text-white',
            )}
            disabled={isRestoring || isDeleting}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2Icon className="size-4" />
            <span>{isDeleting ? 'Deleting...' : 'Permanently delete'}</span>
          </button>
        </div>
      </div>

      <PermanentlyDeleteDocumentDialog
        isDeleting={isDeleting}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
          onDelete();
        }}
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      />
    </>
  );
}
