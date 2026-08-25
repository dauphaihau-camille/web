import type { ReactNode } from 'react';

import {
  AlertDialogDescription,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { cn } from '@shared/lib/utils';

type ConfirmDialogMessageProps = {
  description: ReactNode;
  icon: ReactNode;
  mediaClassName?: string;
  title: ReactNode;
};

export function ConfirmDialogMessage({
  description,
  icon,
  mediaClassName,
  title,
}: ConfirmDialogMessageProps) {
  return (
    <div className="space-y-2 text-center sm:place-items-center">
      <AlertDialogMedia
        className={cn(
          'mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-transparent text-destructive',
          mediaClassName,
        )}
      >
        {icon}
      </AlertDialogMedia>

      <AlertDialogTitle>{title}</AlertDialogTitle>

      <AlertDialogDescription>{description}</AlertDialogDescription>
    </div>
  );
}
