import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const inputVariants = cva(
  'w-full min-w-0 rounded-lg border border-input bg-transparent transition-colors outline-none file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      size: {
        default: 'h-8 px-2.5 py-1 text-base file:h-6 file:text-sm md:text-sm',
        xs: 'h-6 rounded-[min(var(--radius-md),10px)] px-2 text-xs file:h-4 file:text-xs',
        sm: 'h-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] file:h-5 file:text-xs',
        lg: 'h-9 px-2.5 text-base file:h-7 file:text-sm md:text-sm',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className, type, size = 'default', ...props 
  }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          inputVariants({ size }),
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';

export { Input, inputVariants };
