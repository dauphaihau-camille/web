'use client';

import { PlusIcon } from 'lucide-react';

import { LoadingIcon } from '@shared/components/loading-icon';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';

type CreateDocumentButtonProps = {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  iconClassName?: string;
  isPending?: boolean;
  onClick: () => void;
};

export function CreateDocumentButton({
  ariaLabel,
  className,
  disabled,
  iconClassName,
  isPending = false,
  onClick,
}: CreateDocumentButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={cn(
        'size-5 rounded-sm bg-transparent text-sidebar-foreground/70 hover:!bg-sidebar-accent-foreground/5 hover:text-sidebar-accent-foreground',
        className,
      )}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      {isPending
        ? (
          <LoadingIcon className={cn('size-4', iconClassName)} />
        )
        : (
          <PlusIcon className={cn('size-4', iconClassName)} />
        )}
    </Button>
  );
}
