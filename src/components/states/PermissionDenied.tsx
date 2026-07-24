import React from 'react';
import { ShieldOff } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

export interface PermissionDeniedProps {
  title?: string;
  description?: React.ReactNode;
  /** Inline/section variant instead of full-page (state 7). */
  inline?: boolean;
  onBack?: () => void;
  className?: string;
}

/**
 * 403 / insufficient-permissions state (state 7). Full-page by default; pass
 * `inline` to gate a section within a page.
 */
export function PermissionDenied({
  title = 'Access restricted',
  description = "You don’t have permission to view this. If you think this is a mistake, contact your organization admin.",
  inline,
  onBack,
  className,
}: PermissionDeniedProps) {
  const body = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        inline ? 'py-12' : '',
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400">
        <ShieldOff className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold text-secondary-900 dark:text-secondary-50">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-sm text-secondary-500 dark:text-secondary-400">
        {description}
      </p>
      <Button
        variant="outline"
        className="mt-6"
        onClick={() => (onBack ? onBack() : (window.location.href = '/unified'))}
      >
        Back to dashboard
      </Button>
    </div>
  );

  if (inline) return body;
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      {body}
    </div>
  );
}

export default PermissionDenied;
