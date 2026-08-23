import { useEffect, useState } from 'react';
import { LogIn, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * Session-expired modal (state 8). Listens for the `auth:session-expired`
 * window event dispatched by the axios interceptor when a token refresh fails,
 * so the user gets a clear prompt instead of an abrupt redirect.
 */
export function SessionExpiredModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, []);

  if (!open) return null;

  const goToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-secondary-100 dark:border-secondary-700 dark:bg-secondary-900 ring-1 ring-primary-500/10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-secondary-900 dark:bg-accent-500/15 dark:text-accent-400">
          <Clock className="h-6 w-6" />
        </div>
        <h2
          id="session-expired-title"
          className="text-lg font-bold text-secondary-900 dark:text-secondary-50"
        >
          Your session expired
        </h2>
        <p className="mt-1.5 text-sm text-secondary-500 dark:text-secondary-400">
          For your security, you’ve been signed out due to inactivity. Please
          sign in again to continue.
        </p>
        <Button
          fullWidth
          className="mt-6"
          onClick={goToLogin}
          leftIcon={<LogIn className="h-4 w-4" />}
        >
          Sign in again
        </Button>
      </div>
    </div>
  );
}

export default SessionExpiredModal;
