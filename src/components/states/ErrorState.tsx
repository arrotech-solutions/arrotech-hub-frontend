import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

export interface ErrorStateProps {
  title?: string;
  description?: React.ReactNode;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Inline / section-level error (state 3) with an optional Retry. Use when a
 * portion of a page fails to load. For full render crashes see `ErrorBoundary`.
 */
export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  className,
  compact,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8' : 'py-16',
        className
      )}
      role="alert"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-secondary-500 dark:text-secondary-400">
        {description || 'We couldn’t load this section. Please try again.'}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          className="mt-5"
          onClick={onRetry}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
