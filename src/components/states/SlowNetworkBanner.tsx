import { useEffect, useState } from 'react';
import { Wifi, X } from 'lucide-react';
import { useNetworkQuality } from '../../hooks/useNetworkQuality';

/**
 * Persistent-but-dismissable top banner for slow connections (state 5).
 *
 * Two signals feed it:
 *  1. Network Information API (`useNetworkQuality`) where supported.
 *  2. A fallback `network:slow` window event emitted by the axios timing
 *     interceptor in `services/api.ts` when request latency crosses a
 *     threshold (covers Safari/Firefox which lack the API).
 */
export function SlowNetworkBanner() {
  const quality = useNetworkQuality();
  const [latencySlow, setLatencySlow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onSlow = () => setLatencySlow(true);
    const onNormal = () => setLatencySlow(false);
    window.addEventListener('network:slow', onSlow);
    window.addEventListener('network:normal', onNormal);
    return () => {
      window.removeEventListener('network:slow', onSlow);
      window.removeEventListener('network:normal', onNormal);
    };
  }, []);

  const slow = quality.slow || latencySlow;

  // Reset the dismissal once conditions return to normal so it can show again.
  useEffect(() => {
    if (!slow) setDismissed(false);
  }, [slow]);

  if (!slow || dismissed) return null;

  return (
    <div className="flex w-full items-center justify-center gap-2 bg-accent-500 px-4 py-2 text-center text-sm font-semibold text-secondary-950">
      <Wifi className="h-4 w-4 flex-shrink-0" />
      <span>Your connection seems slow — some things may take longer to load.</span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-1 rounded p-0.5 hover:bg-secondary-900/10"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default SlowNetworkBanner;
