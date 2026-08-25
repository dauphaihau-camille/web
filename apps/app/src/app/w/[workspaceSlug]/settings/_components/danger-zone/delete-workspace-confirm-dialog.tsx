'use client';

import { CircleAlert } from 'lucide-react';
import { useId, useState } from 'react';

import {
  AlertDialog,
  AlertDialogContent,
} from '@shared/components/ui/alert-dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';

import { ConfirmDialogMessage } from '../../../_components/confirm-dialog-message';

type DeleteWorkspaceConfirmDialogProps = {
  isDeleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  workspaceName: string;
};

export function DeleteWorkspaceConfirmDialog({
  isDeleting,
  onConfirm,
  onOpenChange,
  open,
  workspaceName,
}: DeleteWorkspaceConfirmDialogProps) {
  const inputId = useId();
  const [confirmationName, setConfirmationName] = useState('');
  const canConfirm = confirmationName.trim() === workspaceName;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setConfirmationName('');
    }

    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] gap-6 rounded-[24px] px-8 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:!max-w-[25rem]">
        <ConfirmDialogMessage
          description={
            <>
              This action cannot be undone. This will permanently delete the
              workspace, including all pages and files. Please type the name of
              the workspace to confirm.
            </>
          }
          icon={<CircleAlert className="size-9" strokeWidth={1.8} />}
          title="Delete this entire workspace permanently?"
        />

        <div className="grid gap-4">
          <label className="sr-only" htmlFor={inputId}>
            Workspace name
          </label>
          <Input
            id={inputId}
            autoComplete="off"
            autoFocus
            disabled={isDeleting}
            onChange={(event) => setConfirmationName(event.target.value)}
            placeholder={workspaceName}
            size="lg"
            value={confirmationName}
          />

          <Button
            disabled={!canConfirm || isDeleting}
            onClick={onConfirm}
            variant="destructive-solid"
            size="lg"
          >
            {isDeleting ? 'Deleting...' : 'Permanently delete workspace'}
          </Button>
          <Button
            className="text-muted-foreground hover:text-foreground"
            disabled={isDeleting}
            onClick={() => handleOpenChange(false)}
            variant="ghost"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
