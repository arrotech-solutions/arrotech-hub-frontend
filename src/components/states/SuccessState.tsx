import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

export interface SuccessStateProps {
  title?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
  /** Full-viewport centered layout (e.g. terminal success screens). */
  fullPage?: boolean;
  compact?: boolean;
}

/**
 * Terminal / multi-step success (state 10) — e.g. "reset link sent",
 * "order placed". For transient confirmations use `notify.success` instead.
 */
export function SuccessState({
  title = 'Success!',
  description,
  icon,
  action,
  secondaryAction,
  className,
  fullPage,
  compact,
}: SuccessStateProps) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        !fullPage && (compact ? 'py-8' : 'py-16'),
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 animate-pop-in">
        {icon ?? <CheckCircle2 className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-secondary-500 dark:text-secondary-400">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {action && <Button onClick={action.onClick}>{action.label}</Button>}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        {content}
      </div>
    );
  }
  return content;
}

export default SuccessState;
