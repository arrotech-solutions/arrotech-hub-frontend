import React, { useId } from 'react';
import { cn } from '../../lib/cn';
import { FieldError } from './FieldError';

export interface FormFieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  /**
   * Render-prop giving the control the wired ids for label/hint/error so the
   * field is accessible (aria-describedby / aria-invalid) with no boilerplate.
   */
  children: (props: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => React.ReactNode;
}

/**
 * Standard form field wrapper: label + control + hint + inline error, wired
 * for accessibility. Pairs with `Input` / `TextArea` / `Select`.
 */
export function FormField({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-secondary-700 dark:text-secondary-200"
        >
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-secondary-500 dark:text-secondary-400">
          {hint}
        </p>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export default FormField;
