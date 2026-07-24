import { cn } from '../../lib/cn';
import { Spinner } from '../ui/Spinner';

export interface LoadingStateProps {
  label?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Section-level loading state (state 2). Centered spinner with an optional
 * label. For full-page loading use `PageLoader`.
 */
export function LoadingState({ label = 'Loading…', className, compact }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center',
        compact ? 'py-8' : 'py-16',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" />
      {label && (
        <p className="text-sm text-secondary-500 dark:text-secondary-400">{label}</p>
      )}
    </div>
  );
}

/** Full-viewport loader — the single replacement for the ad-hoc border spinners. */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingState label={label} />
    </div>
  );
}

export default LoadingState;
