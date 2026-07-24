import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/**
 * Persistent top banner shown while the browser is offline (state 4). When
 * connectivity returns it flashes a brief "back online" confirmation, then
 * auto-hides.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      setShowBackOnline(false);
    } else if (wasOffline) {
      setShowBackOnline(true);
      const t = setTimeout(() => {
        setShowBackOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [online, wasOffline]);

  if (online && !showBackOnline) return null;

  if (!online) {
    return (
      <div className="w-full bg-secondary-900 px-4 py-2 text-center text-sm font-medium text-white border-b border-primary-500/30">
        <span className="inline-flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-accent-400" />
          You’re offline. We’ll reconnect automatically when your connection is back.
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white">
      <span className="inline-flex items-center gap-2">
        <Wifi className="h-4 w-4" />
        Back online.
      </span>
    </div>
  );
}

export default OfflineBanner;
