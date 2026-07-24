import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * Full-page offline state (state 4) for when an entire view can't render
 * without the network. For the app-wide persistent hint use `OfflineBanner`.
 */
export function OfflinePage({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-400">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold text-secondary-900 dark:text-secondary-50">
        You’re offline
      </h1>
      <p className="mt-2 max-w-md text-sm text-secondary-500 dark:text-secondary-400">
        We can’t reach the internet right now. Check your connection and try
        again.
      </p>
      <Button
        className="mt-6"
        onClick={() => (onRetry ? onRetry() : window.location.reload())}
        leftIcon={<RefreshCw className="h-4 w-4" />}
      >
        Retry
      </Button>
    </div>
  );
}

export default OfflinePage;
