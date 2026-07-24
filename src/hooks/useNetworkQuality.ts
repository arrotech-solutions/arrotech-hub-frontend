import { useEffect, useState } from 'react';

interface NetworkInformationLike {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  saveData?: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

export interface NetworkQuality {
  /** True when the connection is slow (slow-2g/2g) or data-saver is on. */
  slow: boolean;
  effectiveType?: string;
  saveData?: boolean;
  /** Whether the Network Information API is available in this browser. */
  supported: boolean;
}

function readConnection(): NetworkInformationLike | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection
  );
}

/**
 * Reports slow-network conditions via the Network Information API
 * (state 5). Falls back to `supported: false` where the API is unavailable
 * (Safari/Firefox); in that case the app relies on the axios timing signal.
 */
export function useNetworkQuality(): NetworkQuality {
  const [quality, setQuality] = useState<NetworkQuality>(() => {
    const conn = readConnection();
    if (!conn) return { slow: false, supported: false };
    const effectiveType = conn.effectiveType;
    return {
      supported: true,
      effectiveType,
      saveData: conn.saveData,
      slow:
        effectiveType === 'slow-2g' ||
        effectiveType === '2g' ||
        !!conn.saveData,
    };
  });

  useEffect(() => {
    const conn = readConnection();
    if (!conn || !conn.addEventListener) return;
    const update = () => {
      setQuality({
        supported: true,
        effectiveType: conn.effectiveType,
        saveData: conn.saveData,
        slow:
          conn.effectiveType === 'slow-2g' ||
          conn.effectiveType === '2g' ||
          !!conn.saveData,
      });
    };
    conn.addEventListener('change', update);
    return () => conn.removeEventListener?.('change', update);
  }, []);

  return quality;
}

export default useNetworkQuality;
