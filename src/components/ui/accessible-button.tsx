'use client';

import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { useKeyboardNavigation } from '@/lib/accessibility';
import { cn } from '@/lib/utils';

// Import the button variants to get the type
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export interface AccessibleButtonProps extends ButtonProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-haspopup'?: boolean;
  role?: string;
  onKeyboardEnter?: () => void;
  onKeyboardSpace?: () => void;
  onKeyboardEscape?: () => void;
  announcement?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    onClick,
    disabled,
    className,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-pressed': ariaPressed,
    'aria-haspopup': ariaHasPopup,
    role,
    onKeyboardEnter,
    onKeyboardSpace,
    onKeyboardEscape,
    announcement,
    ...props
  }, ref) => {
    const { handleKeyDown } = useKeyboardNavigation(
      onKeyboardEnter || (() => {
        // Create a synthetic event for keyboard navigation
        const event = new MouseEvent('click') as any;
        onClick?.(event);
      }),
      onKeyboardSpace || (() => {
        // Create a synthetic event for keyboard navigation
        const event = new MouseEvent('click') as any;
        onClick?.(event);
      }),
      onKeyboardEscape
    );

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onClick?.(event);
    };

    return (
      <>
        <Button
          ref={ref}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            // Focus styles for better visibility
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            // High contrast mode support
            'forced-colors:outline forced-colors:outline-3 forced-colors:outline-[ButtonBorder]',
            className
          )}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-expanded={ariaExpanded}
          aria-pressed={ariaPressed}
          aria-haspopup={ariaHasPopup}
          aria-disabled={disabled}
          role={role}
          {...props}
        >
          {children}
        </Button>
        
        {announcement && (
          <div aria-live="polite" className="sr-only">
            {announcement}
          </div>
        )}
      </>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';