"use client";

import { LoadingIcon } from "../../../components/loading-icon";
import { Dialog, DialogContent } from "../../../components/ui/dialog";

type CreateWorkspaceRedirectDialogProps = {
  open: boolean;
};

export function CreateWorkspaceRedirectDialog({
  open,
}: CreateWorkspaceRedirectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="w-auto max-w-max gap-0 bg-transparent p-0 ring-0 shadow-none"
        showCloseButton={false}
      >
        <div className="flex items-center justify-center">
          <div
            aria-busy="true"
            aria-live="polite"
            className="flex items-center gap-3 rounded-xl bg-popover px-4 py-3 text-sm font-medium text-foreground ring-1 ring-foreground/10"
          >
            <LoadingIcon className="size-5" />
            <span>taking you to your workspace...</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
