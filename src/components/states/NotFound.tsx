import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * 404 page — replaces the silent catch-all redirect so users understand the
 * route doesn't exist and can navigate deliberately.
 */
export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-500 dark:bg-primary-500/10 dark:text-primary-400">
        <Compass className="h-8 w-8" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
        404
      </p>
      <h1 className="mt-1 text-2xl font-bold text-secondary-900 dark:text-secondary-50">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-secondary-500 dark:text-secondary-400">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => navigate('/unified')}>Go to dashboard</Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
