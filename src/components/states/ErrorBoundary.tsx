import React from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback renderer; defaults to the full-page `ErrorFallback`. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time crashes anywhere below it so the whole app never shows a
 * blank white screen (state 3, full-page variant).
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) return this.props.fallback(error, this.reset);
      return <ErrorFallback error={error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

export function ErrorFallback({
  error,
  reset,
}: {
  error?: Error;
  reset?: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
        <AlertOctagon className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold text-secondary-900 dark:text-secondary-50">
        Something broke on our end
      </h1>
      <p className="mt-2 max-w-md text-sm text-secondary-500 dark:text-secondary-400">
        An unexpected error occurred while rendering this page. You can try
        reloading, or head back to your dashboard.
      </p>
      {import.meta.env.DEV && error && (
        <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-secondary-100 p-3 text-left text-xs text-red-600 dark:bg-secondary-800 dark:text-red-400">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex items-center gap-3">
        <Button
          onClick={() => {
            reset?.();
            window.location.reload();
          }}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Reload page
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = '/unified';
          }}
          leftIcon={<Home className="h-4 w-4" />}
        >
          Go home
        </Button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
