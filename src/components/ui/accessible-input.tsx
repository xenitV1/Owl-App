'use client';

import React, { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useKeyboardNavigation } from '@/lib/accessibility';
import { cn } from '@/lib/utils';

type InputProps = React.ComponentProps<'input'>;

export interface AccessibleInputProps extends Omit<InputProps, 'aria-describedby'> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  'aria-describedby'?: string;
  onValidation?: (value: string) => string | null;
  announcement?: string;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    label,
    error,
    helperText,
    required = false,
    id,
    onValidation,
    announcement,
    value,
    onChange,
    onBlur,
    className,
    ...props
  }, ref) => {
    const [internalError, setInternalError] = useState<string | null>(null);
    const [isTouched, setIsTouched] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const { handleKeyDown } = useKeyboardNavigation();

    const displayError = error || internalError;
    const hasError = !!displayError;

    const validate = (value: string) => {
      if (onValidation) {
        return onValidation(value);
      }
      return null;
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      
      if (onChange) {
        onChange(event);
      }

      if (isTouched) {
        const validationError = validate(newValue);
        setInternalError(validationError);
      }
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsTouched(true);
      
      const validationError = validate(event.target.value);
      setInternalError(validationError);

      if (onBlur) {
        onBlur(event);
      }
    };

    const getDescribedBy = (): string | undefined => {
      const describedBy: string[] = [];
      if (hasError) describedBy.push(errorId);
      if (helperText) describedBy.push(helperId);
      return describedBy.length > 0 ? describedBy.join(' ') : undefined;
    };

    return (
      <div className="space-y-2">
        <Label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            hasError && 'text-destructive'
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
        </Label>

        <Input
          ref={ref}
          id={inputId}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          required={required}
          aria-invalid={hasError}
          aria-describedby={getDescribedBy()}
          aria-required={required}
          className={cn(
            // Focus styles for better visibility
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            // Error state
            hasError && 'border-destructive focus:ring-destructive',
            // High contrast mode support
            'forced-colors:outline forced-colors:outline-3 forced-colors:outline-[FieldBorder]',
            className
          )}
          {...props}
        />

        {helperText && !hasError && (
          <div id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </div>
        )}

        {hasError && (
          <div
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-sm text-destructive font-medium"
          >
            {displayError}
          </div>
        )}

        {announcement && (
          <div aria-live="polite" className="sr-only">
            {announcement}
          </div>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';