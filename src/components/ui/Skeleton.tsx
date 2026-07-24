import { cn } from '../../lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Convenience: render N stacked skeleton lines. */
  lines?: number;
}

/**
 * Content placeholder. Use for skeleton loading of known-shape content
 * (cards, list rows, text) instead of a bare spinner.
 */
export function Skeleton({ className, lines, ...props }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 animate-pulse rounded-md bg-secondary-200 dark:bg-secondary-800',
              i === lines - 1 && 'w-2/3',
              className
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-secondary-200 dark:bg-secondary-800',
        className
      )}
      {...props}
    />
  );
}

/** Preset: a simple card skeleton. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-secondary-200 p-5 dark:border-secondary-800',
        className
      )}
    >
      <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/** Preset: a grid of card skeletons. */
export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
