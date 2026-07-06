'use client';

import { useState } from 'react';

import {
  CreateWorkspaceForm,
  CreateWorkspaceRedirectDialog,
} from '@/domains/workspace/components';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
