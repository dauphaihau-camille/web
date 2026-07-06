'use client';

import { UserRoundXIcon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type LogoutConfirmDialogProps = {
  isPending: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
};

export function LogoutConfirmDialog({
  isPending,
  onConfirm,
  onOpenChange,
  open,
}: LogoutConfirmDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] gap-6 rounded-[24px] px-8 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:max-w-[34rem]">
        <AlertDialogHeader className="gap-4 text-center sm:place-items-center sm:text-center ju">
          <AlertDialogMedia className="mx-auto mb-0 flex size-10 items-center justify-center rounded-full bg-transparent text-foreground sm:row-auto">
            <div className="relative flex size-10 items-center justify-center">
              <UserRoundXIcon className="size-7" />
            </div>
          </AlertDialogMedia>
          <div className="space-y-3 text-center">
            <AlertDialogTitle className="font-sans text-[1.6rem] leading-tight font-bold tracking-[-0.03em] text-foreground sm:col-auto text-nowrap">
              Log out of your account?
            </AlertDialogTitle>
            <AlertDialogDescription className="mx-auto max-w-[24rem] text-[1rem] text-foreground/60">
              You will need to log back in to access your Notion workspaces.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

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
