import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ValidationStripProps {
  issues: string[];
  onClose?: () => void;
  onFocusIssue?: () => void;
}

const ValidationStrip: React.FC<ValidationStripProps> = ({ issues, onClose, onFocusIssue }) => {
  if (!issues.length) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex max-w-xl -translate-x-1/2 items-start gap-3 rounded-2xl border border-accent-300 bg-accent-50 px-4 py-3 shadow-lg dark:border-accent-500/40 dark:bg-secondary-900/95"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-700 dark:text-accent-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-accent-900 dark:text-accent-200">
          {issues.length} issue{issues.length === 1 ? '' : 's'} before save
        </p>
        <ul className="mt-1 max-h-24 space-y-0.5 overflow-y-auto text-[11px] text-accent-800 dark:text-accent-300/90">
          {issues.slice(0, 6).map((issue) => (
            <li key={issue}>• {issue}</li>
          ))}
        </ul>
        {onFocusIssue && (
          <button
            type="button"
            onClick={onFocusIssue}
            className="mt-2 text-[11px] font-bold text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
          >
            Review nodes
          </button>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Dismiss validation"
          onClick={onClose}
          className="rounded-lg p-1 text-accent-700 hover:bg-accent-100 dark:text-accent-300 dark:hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default ValidationStrip;
