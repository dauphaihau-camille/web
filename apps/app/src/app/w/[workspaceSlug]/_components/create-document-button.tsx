'use client';

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
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
} & Omit<
  ComponentPropsWithoutRef<typeof Button>,
  'aria-label' | 'children' | 'className' | 'disabled' | 'onClick'
>;

export const CreateDocumentButton = forwardRef<
  HTMLButtonElement,
  CreateDocumentButtonProps
>(function CreateDocumentButtonImpl({
  ariaLabel,
  className,
  disabled,
  iconClassName,
  isPending = false,
  onClick,
  ...props
}, ref) {
  return (
    <Button
      ref={ref}
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
      {...props}
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
});
