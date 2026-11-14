import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, Loader2, MessageCircle, RefreshCw, RotateCcw } from 'lucide-react';
import toast from '../lib/notify';
import { mapApiError } from '../lib/mapApiError';
import apiService from '../services/api';

const STATUSES = [
  'all',
  'requested',
  'pending_approval',
  'approved',
  'denied',
  'refund_pending',
  'refunded',
  'settled_offline',
  'failed',
] as const;

interface RefundAttempt {
  id?: string;
  method?: string;
  status?: string;
  amount?: string;
  mpesa_receipt?: string | null;
  error?: string | null;
}

interface CommerceReturnRow {
  id: string;
  external_return_id?: string;
  order_external_id?: string;
  customer_phone?: string;
  reason_code?: string;
  amount?: string;
  currency?: string;
  status?: string;
  auto_approved?: boolean;
  customer_message?: string;
  refund_attempts?: RefundAttempt[];
  created_at?: string;
}

function labelStatus(value?: string): string {
  return String(value || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function waMeLink(phone?: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

function money(amount?: string, currency?: string): string {
  if (amount == null || amount === '') return '—';
  return `${currency || 'KES'} ${amount}`;
}

function statusTone(value?: string): string {
  const key = String(value || '').toLowerCase();
  if (key === 'refunded' || key === 'settled_offline' || key === 'approved') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  }
  if (key === 'denied' || key === 'failed') {
    return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
  }
  if (key === 'pending_approval' || key === 'requested' || key === 'refund_pending') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  }
  return 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
}

function canDecide(status?: string): boolean {
  const key = String(status || '');
  return key === 'pending_approval' || key === 'requested';
}

function canSettle(status?: string): boolean {
  const key = String(status || '');
  return key === 'refund_pending' || key === 'approved' || key === 'failed';
}

const CommerceReturns: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderFilter = searchParams.get('order') || '';
  const [rows, setRows] = useState<CommerceReturnRow[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [settleNote, setSettleNote] = useState('');

  const visible = useMemo(() => {
    return rows.filter((row) => {
      if (orderFilter && row.order_external_id !== orderFilter) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      return true;
    });
  }, [rows, orderFilter, statusFilter]);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) || null,
    [rows, selectedId]
  );

  const replaceRow = (next: CommerceReturnRow) => {
    setRows((current) => current.map((row) => (row.id === next.id ? { ...row, ...next } : row)));
  };

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await apiService.listCommerceReturns();
      const next = (response?.data?.returns || []) as CommerceReturnRow[];
      setRows(next);
      setSelectedId((current) => (current && next.some((row) => row.id === current) ? current : ''));
    } catch (error) {
      toast.error(mapApiError(error, 'Could not load returns'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openReturn = async (id: string) => {
    setSelectedId(id);
    setDenyReason('');
    setSettleNote('');
    try {
      const response = await apiService.getCommerceReturn(id);
      if (response?.data) replaceRow(response.data as CommerceReturnRow);
    } catch (error) {
      toast.error(mapApiError(error, 'Could not load return'));
    }
  };

  const approve = async () => {
    if (!selected) return;
    setActing(true);
    try {
      const response = await apiService.approveCommerceReturn(selected.id);
      if (response?.data) replaceRow(response.data as CommerceReturnRow);
      toast.success('Return approved. Check the payout status before telling the customer it is refunded.');
    } catch (error) {
      toast.error(mapApiError(error, 'Could not approve return'));
    } finally {
      setActing(false);
    }
  };

  const deny = async () => {
    if (!selected) return;
    setActing(true);
    try {
      const response = await apiService.denyCommerceReturn(selected.id, denyReason.trim() || undefined);
      if (response?.data) replaceRow(response.data as CommerceReturnRow);
      toast.success('Return denied');
    } catch (error) {
      toast.error(mapApiError(error, 'Could not deny return'));
    } finally {
      setActing(false);
    }
  };

  const settle = async () => {
    if (!selected) return;
    setActing(true);
    try {
      const response = await apiService.settleCommerceReturnOffline(selected.id, settleNote.trim() || undefined);
      if (response?.data) replaceRow(response.data as CommerceReturnRow);
      toast.success('Marked settled offline. This is not an M-Pesa refund.');
    } catch (error) {
      toast.error(mapApiError(error, 'Could not settle return offline'));
    } finally {
      setActing(false);
    }
  };

  const whatsapp = waMeLink(selected?.customer_phone);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary-800 to-primary-500 flex items-center justify-center shadow-lg">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Returns</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Approve, deny, or settle a refund. Money is refunded only after payout succeeds.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <label className="text-sm font-semibold text-gray-700 dark:text-slate-200" htmlFor="return-status">
            Status
            <select
              id="return-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 sm:mt-0 sm:ml-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {labelStatus(status)}
                </option>
              ))}
            </select>
          </label>
          {orderFilter && (
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Showing returns for order <span className="font-mono">{orderFilter}</span>
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500 dark:text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading…
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className={`lg:col-span-2 ${selectedId ? 'hidden lg:block' : 'block'}`}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="hidden lg:grid grid-cols-4 gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">
                  <span>Order</span>
                  <span>Reason</span>
                  <span>Amount</span>
                  <span>Status</span>
                </div>
                {visible.length === 0 ? (
                  <div className="p-8 text-sm text-gray-500 dark:text-slate-400">
                    No returns in this view.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                    {visible.map((row) => {
                      const active = row.id === selectedId;
                      return (
                        <li key={row.id}>
                          <button
                            type="button"
                            onClick={() => void openReturn(row.id)}
                            aria-label={`${row.order_external_id || row.id} ${row.reason_code || ''} ${labelStatus(row.status)}`}
                            className={`w-full text-left px-3 py-4 lg:py-2.5 ${
                              active ? 'bg-blue-50/80 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/70'
                            }`}
                          >
                            <div className="lg:hidden">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {row.order_external_id || row.external_return_id}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                    {labelStatus(row.reason_code)} · {row.customer_phone}
                                  </p>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {money(row.amount, row.currency)}
                                </span>
                              </div>
                              <span className={`inline-flex mt-3 text-xs font-semibold px-2 py-1 rounded-full ${statusTone(row.status)}`}>
                                {labelStatus(row.status)}
                              </span>
                            </div>
                            <div className="hidden lg:grid grid-cols-4 gap-2 items-center text-sm">
                              <span className="font-semibold text-gray-900 dark:text-white truncate">
                                {row.order_external_id || '—'}
                              </span>
                              <span className="text-gray-600 dark:text-slate-300 truncate">{labelStatus(row.reason_code)}</span>
                              <span className="text-gray-900 dark:text-white">{money(row.amount, row.currency)}</span>
                              <span className={`justify-self-start text-xs font-semibold px-2 py-1 rounded-full ${statusTone(row.status)}`}>
                                {labelStatus(row.status)}
                              </span>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className={`lg:col-span-3 ${selectedId ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6">
                <button
                  type="button"
                  onClick={() => setSelectedId('')}
                  className="lg:hidden mb-4 text-sm font-semibold text-gray-600 dark:text-slate-300"
                >
                  ← Back to queue
                </button>
                {!selected ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Select a return to approve, deny, or mark it settled offline.
                  </p>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          {selected.order_external_id || selected.external_return_id}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {money(selected.amount, selected.currency)} · {labelStatus(selected.reason_code)}
                        </p>
                      </div>
                      {whatsapp && (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-3 py-2 text-sm font-semibold hover:bg-emerald-700"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusTone(selected.status)}`}>
                        {labelStatus(selected.status)}
                      </span>
                      {selected.auto_approved && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                          Auto-approved
                        </span>
                      )}
                      {selected.order_external_id && (
                        <Link
                          to={`/orders?order=${encodeURIComponent(selected.order_external_id)}`}
                          className="text-xs font-semibold px-2.5 py-1 text-primary-600 dark:text-primary-400"
                        >
                          View order
                        </Link>
                      )}
                    </div>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-gray-500 dark:text-slate-400">Customer phone</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">{selected.customer_phone || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 dark:text-slate-400">Return id</dt>
                        <dd className="font-mono text-xs text-gray-900 dark:text-white break-all">
                          {selected.external_return_id || selected.id}
                        </dd>
                      </div>
                    </dl>

                    {selected.customer_message && (
                      <p className="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap rounded-xl bg-gray-50 dark:bg-slate-800/60 px-3 py-2">
                        {selected.customer_message}
                      </p>
                    )}

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Payout attempts</h3>
                      {(selected.refund_attempts || []).length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-slate-400">No payout yet.</p>
                      ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-slate-800 rounded-xl border border-gray-100 dark:border-slate-800">
                          {(selected.refund_attempts || []).map((attempt) => (
                            <li key={attempt.id || `${attempt.method}-${attempt.status}`} className="px-3 py-2 text-sm">
                              <div className="flex justify-between gap-3">
                                <span className="text-gray-800 dark:text-slate-200">
                                  {labelStatus(attempt.method)} · {labelStatus(attempt.status)}
                                </span>
                                <span>{money(attempt.amount, selected.currency)}</span>
                              </div>
                              {attempt.mpesa_receipt && (
                                <p className="text-xs text-gray-500 mt-1">Receipt {attempt.mpesa_receipt}</p>
                              )}
                              {attempt.error && <p className="text-xs text-rose-600 mt-1">{attempt.error}</p>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {canDecide(selected.status) && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => void approve()}
                            className="rounded-xl bg-secondary-800 text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                          >
                            Approve return
                          </button>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => void deny()}
                            className="rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 px-3 py-2 text-sm font-semibold disabled:opacity-60"
                          >
                            Deny return
                          </button>
                        </div>
                        <label className="block text-sm text-gray-600 dark:text-slate-300" htmlFor="deny-reason">
                          Deny reason
                          <input
                            id="deny-reason"
                            value={denyReason}
                            onChange={(event) => setDenyReason(event.target.value)}
                            placeholder="Optional note for the audit"
                            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                          />
                        </label>
                      </div>
                    )}

                    {canSettle(selected.status) && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-slate-300">
                          Settling offline records that you paid the customer yourself. It does not mark the return refunded.
                        </p>
                        <label className="block text-sm text-gray-600 dark:text-slate-300" htmlFor="settle-note">
                          Settlement note
                          <input
                            id="settle-note"
                            value={settleNote}
                            onChange={(event) => setSettleNote(event.target.value)}
                            placeholder="Paid on till"
                            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => void settle()}
                          className="rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm font-semibold text-gray-800 dark:text-slate-100 disabled:opacity-60"
                        >
                          Mark settled offline
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommerceReturns;
