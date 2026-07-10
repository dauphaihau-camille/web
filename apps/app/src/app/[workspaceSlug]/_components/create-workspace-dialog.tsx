'use client';

import { useState } from 'react';

import {
  Dialog,
  DialogContent,
} from '@shared/components/ui/dialog';

import {
  CreateWorkspaceForm,
  CreateWorkspaceRedirectDialog,
} from '@/domains/workspace/components';

type CreateWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  return (
    <>
      <CreateWorkspaceRedirectDialog open={isRedirecting} />

      <Dialog open={open && !isRedirecting} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <CreateWorkspaceForm
            hideFormWhileRedirecting
            onRedirectingChange={setIsRedirecting}
            variant="plain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
