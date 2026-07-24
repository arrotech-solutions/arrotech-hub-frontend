import React from 'react';
import { Inbox, SearchX } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
  /**
   * When provided, renders the "no search results" variant (state 6) with a
   * search-specific icon and message referencing the query.
   */
  query?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Covers state 1 (Empty) and, via the `query` prop, state 6 (No search
 * results). Full-section empty placeholder with optional CTA.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  query,
  className,
  compact,
}: EmptyStateProps) {
  const isSearch = query !== undefined;
  const resolvedIcon =
    icon ??
    (isSearch ? (
      <SearchX className="h-7 w-7" />
    ) : (
      <Inbox className="h-7 w-7" />
    ));
  const resolvedTitle =
    title ?? (isSearch ? 'No results found' : 'Nothing here yet');
  const resolvedDescription =
    description ??
    (isSearch
      ? query
        ? `We couldn’t find anything matching “${query}”. Try a different search.`
        : 'Try adjusting your search or filters.'
      : 'When there’s something to show, it’ll appear here.');

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8' : 'py-16',
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-400">
        {resolvedIcon}
      </div>
      <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100">
        {resolvedTitle}
      </h3>
      {resolvedDescription && (
        <p className="mt-1 max-w-sm text-sm text-secondary-500 dark:text-secondary-400">
          {resolvedDescription}
        </p>
      )}
      {action && (
        <Button className="mt-5" onClick={action.onClick} leftIcon={action.icon}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
