'use client';

import { CreateWorkspaceForm } from '@/app/(app)/workspace/_components/create-workspace-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CreateWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Set up a new workspace and jump into it immediately.
          </DialogDescription>
        </DialogHeader>
        <CreateWorkspaceForm variant="plain" onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
