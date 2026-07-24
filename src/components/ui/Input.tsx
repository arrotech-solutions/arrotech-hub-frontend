import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const inputBaseClass =
  'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-secondary-900 ' +
  'placeholder:text-secondary-400 shadow-sm transition-colors ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'dark:bg-secondary-900 dark:text-secondary-100 dark:placeholder:text-secondary-500';

export const inputBorderClass = (invalid?: boolean) =>
  invalid
    ? 'border-red-400 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
    : 'border-secondary-300 dark:border-secondary-700';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, leftIcon, rightIcon, ...props }, ref) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            aria-invalid={invalid || undefined}
            className={cn(
              inputBaseClass,
              inputBorderClass(invalid),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400">
              {rightIcon}
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(inputBaseClass, inputBorderClass(invalid), className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
