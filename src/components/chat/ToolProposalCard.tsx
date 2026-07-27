import React, { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import apiService from '../../services/api';

interface ToolProposalCardProps {
  proposalId: string;
  summary: string;
  toolName?: string;
  isDarkMode?: boolean;
  onResolved?: (approved: boolean, result?: any) => void;
}

const ToolProposalCard: React.FC<ToolProposalCardProps> = ({
  proposalId,
  summary,
  toolName,
  isDarkMode = false,
  onResolved,
}) => {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'pending' | 'executed' | 'cancelled' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);

  const act = async (approve: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiService.confirmToolProposal(proposalId, approve);
      if (res.success) {
        setStatus(approve ? 'executed' : 'cancelled');
        onResolved?.(approve, res.result);
      } else {
        setStatus('error');
        setError((res as any).error || 'Failed to resolve proposal');
      }
    } catch (e: any) {
      setStatus('error');
      setError(e?.response?.data?.detail || e?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'executed') {
    return (
      <div className={`p-3 rounded-xl border text-sm ${isDarkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
        Approved and executed{toolName ? `: ${toolName}` : ''}.
      </div>
    );
  }
  if (status === 'cancelled') {
    return (
      <div className={`p-3 rounded-xl border text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
        Action cancelled.
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border space-y-3 ${isDarkMode ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200'}`}>
      <div>
        <p className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
          Confirmation required
        </p>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-amber-100' : 'text-amber-900'}`}>{summary}</p>
        {toolName && (
          <p className={`text-[11px] mt-1 opacity-70 font-mono`}>{toolName}</p>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => act(true)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => act(false)}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-gray-700 border border-gray-300'}`}
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ToolProposalCard;
