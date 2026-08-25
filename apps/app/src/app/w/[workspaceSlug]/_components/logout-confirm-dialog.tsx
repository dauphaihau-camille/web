'use client';

import { UserRoundXIcon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogContent,
} from '@shared/components/ui/alert-dialog';
import { Button } from '@shared/components/ui/button';

import { ConfirmDialogMessage } from './confirm-dialog-message';

type LogoutConfirmDialogProps = {
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function LogoutConfirmDialog({
  isPending,
  onConfirm,
  onOpenChange,
  open,
}: LogoutConfirmDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] gap-6 rounded-[24px] px-8 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:!max-w-[20rem]">
        <ConfirmDialogMessage
          icon={<UserRoundXIcon className="size-9" strokeWidth={1.8} />}
          mediaClassName="text-foreground dark:text-white"
          title="Log out of your account?"
          description="You will need to log back in to access your Notion workspaces."
        />

        <div className="grid gap-3">
          <Button
            size="lg"
            disabled={isPending}
            onClick={onConfirm}
            variant="destructive-solid"
          >
            {isPending ? 'Logging out...' : 'Log out'}
          </Button>
          <Button
            size="lg"
            disabled={isPending}
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
