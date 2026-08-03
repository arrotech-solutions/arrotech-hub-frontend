import React from 'react';
import { Check, Loader2, Plug } from 'lucide-react';

interface AppConnectRowProps {
  name: string;
  hint: string;
  connected: boolean;
  connecting?: boolean;
  onConnect: () => void;
  logo?: React.ReactNode;
}

const AppConnectRow: React.FC<AppConnectRowProps> = ({
  name,
  hint,
  connected,
  connecting,
  onConnect,
  logo,
}) => {
  return (
    <div className="flex flex-col xs:flex-row sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
          {logo || <Plug className="w-5 h-5 text-secondary-300" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{name}</p>
          <p className="text-xs text-secondary-400 truncate">{hint}</p>
        </div>
      </div>
      {connected ? (
        <span className="inline-flex items-center justify-center gap-1.5 self-stretch sm:self-auto min-h-[44px] px-4 rounded-xl text-sm font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
          <Check className="w-4 h-4" /> Connected
        </span>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          disabled={connecting}
          className="inline-flex items-center justify-center gap-2 self-stretch sm:self-auto min-h-[44px] px-4 rounded-xl text-sm font-semibold text-white bg-primary-500/90 hover:bg-primary-500 disabled:opacity-50 transition-colors"
        >
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Connect
        </button>
      )}
    </div>
  );
};

export default AppConnectRow;
