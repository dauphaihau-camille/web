'use client';

import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full border bg-background',
  {
    variants: {
      size: {
        default: 'size-8',
        sm: 'size-6',
        lg: 'size-10',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

function Avatar({
  className,
  size = 'default',
  ...props
}: AvatarPrimitive.Root.Props & VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(avatarVariants({ size, className }))}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function AvatarBadge({
  className,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        'absolute right-0 bottom-0 size-2 rounded-full border border-background bg-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group"
      className={cn('flex items-center -space-x-2', className)}
      {...props}
    />
  );
}

function AvatarGroupCount({
  className,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-group-count"
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted px-1 text-[11px] font-semibold text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  avatarVariants,
};
