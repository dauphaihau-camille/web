'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@shared/components/ui/button';

type PermanentlyDeleteDocumentDialogProps = {
  isDeleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function PermanentlyDeleteDocumentDialog({
  isDeleting,
  onConfirm,
  onOpenChange,
  open,
}: PermanentlyDeleteDocumentDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-[24px] px-8 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:max-w-[34rem]">
        <div className="space-y-3 text-center">
          <AlertDialogTitle className="font-sans text-[1.2rem] leading-tight font-semibold tracking-[-0.03em] text-foreground">
            Are you sure you want to permanently delete this document?
          </AlertDialogTitle>
        </div>

        <div className="grid gap-3">
          <Button
            size="lg"
            disabled={isDeleting}
            onClick={onConfirm}
            variant="destructive-solid"
          >
            {isDeleting ? 'Deleting...' : 'Permanently delete'}
          </Button>
          <Button
            size="lg"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
