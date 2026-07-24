import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface FieldErrorProps {
  message?: string | null;
  id?: string;
  className?: string;
}

/**
 * Inline, accessible field-level error. This is the ONLY correct way to show
 * form validation errors — never a toast for field-level validation.
 */
export function FieldError({ message, id, className }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className={cn(
        'mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400',
        className
      )}
    >
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export default FieldError;
