import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Loader2, Shield, ShoppingBag } from 'lucide-react';
import toast from '../lib/notify';
import { mapApiError } from '../lib/mapApiError';
import apiService from '../services/api';

const SELL_MODES = ['retail', 'food', 'clothing', 'grocery', 'pharmacy', 'custom'] as const;
const DELIVERY_METHODS = ['pickup', 'delivery', 'dine_in', 'shipping', 'digital'] as const;
const CANCEL_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
] as const;
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

type Weekday = (typeof WEEKDAYS)[number];

interface DayHours {
  open: string;
  close: string;
  is_open: boolean;
}

interface PolicyDraft {
  sell_modes: string[];
  delivery_methods: string[];
  reservations_enabled: boolean;
  away_message: string;
  return_window_days: number | '';
  return_reason_codes: string[];
  auto_approve_enabled: boolean;
  auto_approve_max_amount_kes: number | '';
  cancel_until_status: string;
  human_handoff_ttl_hours: number | '';
  commerce_rails_enabled: boolean;
}

const EMPTY_POLICY: PolicyDraft = {
  sell_modes: ['retail', 'food'],
  delivery_methods: ['delivery', 'pickup'],
  reservations_enabled: false,
  away_message: '',
  return_window_days: 7,
  return_reason_codes: ['damaged', 'wrong_item', 'not_as_described', 'changed_mind'],
  auto_approve_enabled: false,
  auto_approve_max_amount_kes: 0,
  cancel_until_status: 'preparing',
  human_handoff_ttl_hours: 24,
  commerce_rails_enabled: true,
};

function defaultDay(open: boolean): DayHours {
  return { open: '08:00', close: '18:00', is_open: open };
}

function defaultWeek(): Record<Weekday, DayHours> {
  return {
    monday: defaultDay(true),
    tuesday: defaultDay(true),
    wednesday: defaultDay(true),
    thursday: defaultDay(true),
    friday: defaultDay(true),
    saturday: defaultDay(false),
    sunday: defaultDay(false),
  };
}

function labelize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function weekFromApi(hours: unknown): { configured: boolean; days: Record<Weekday, DayHours> } {
  const days = defaultWeek();
  if (!hours || typeof hours !== 'object' || Array.isArray(hours)) {
    return { configured: false, days };
  }
  const record = hours as Record<string, { open?: string; close?: string }>;
  const keys = Object.keys(record);
  if (keys.length === 0) return { configured: false, days };
  WEEKDAYS.forEach((day) => {
    const window = record[day];
    if (window?.open && window?.close) {
      days[day] = { open: window.open, close: window.close, is_open: true };
    } else {
      days[day] = { ...days[day], is_open: false };
    }
  });
  return { configured: true, days };
}

function hoursPayload(configured: boolean, days: Record<Weekday, DayHours>): Record<string, { open: string; close: string }> {
  if (!configured) return {};
  const out: Record<string, { open: string; close: string }> = {};
  WEEKDAYS.forEach((day) => {
    if (days[day].is_open) out[day] = { open: days[day].open, close: days[day].close };
  });
  return out;
}

function draftFromApi(data: Record<string, any> | null | undefined): PolicyDraft {
  const source = data || {};
  return {
    sell_modes: Array.isArray(source.sell_modes) ? source.sell_modes.map(String) : EMPTY_POLICY.sell_modes,
    delivery_methods: Array.isArray(source.delivery_methods)
      ? source.delivery_methods.map(String)
      : EMPTY_POLICY.delivery_methods,
    reservations_enabled: Boolean(source.reservations_enabled),
    away_message: source.away_message == null ? '' : String(source.away_message),
    return_window_days: Number(source.return_window_days ?? EMPTY_POLICY.return_window_days),
    return_reason_codes: Array.isArray(source.return_reason_codes)
      ? source.return_reason_codes.map(String)
      : EMPTY_POLICY.return_reason_codes,
    auto_approve_enabled: Boolean(source.auto_approve_enabled),
    auto_approve_max_amount_kes: Number(source.auto_approve_max_amount_kes ?? 0),
    cancel_until_status: String(source.cancel_until_status || 'preparing'),
    human_handoff_ttl_hours: Number(source.human_handoff_ttl_hours ?? 24),
    commerce_rails_enabled: source.commerce_rails_enabled !== false,
  };
}

const fieldClass =
  'w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500';

const CommercePolicy: React.FC = () => {
  const [draft, setDraft] = useState<PolicyDraft>(EMPTY_POLICY);
  const [hoursOn, setHoursOn] = useState(false);
  const [days, setDays] = useState<Record<Weekday, DayHours>>(defaultWeek);
  const [reasonDraft, setReasonDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [formError, setFormError] = useState('');

  const applyHours = useCallback((hours: unknown) => {
    const parsed = weekFromApi(hours);
    setHoursOn(parsed.configured);
    setDays(parsed.days);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getCommercePolicy();
      const data = response?.data || {};
      setDraft(draftFromApi(data));
      applyHours(data.business_hours);
    } catch (error) {
      toast.error(mapApiError(error, 'Could not load commerce policy'));
    } finally {
      setLoading(false);
    }
  }, [applyHours]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleList = (key: 'sell_modes' | 'delivery_methods', value: string) => {
    setDraft((current) => {
      const has = current[key].includes(value);
      const next = has ? current[key].filter((item) => item !== value) : [...current[key], value];
      return { ...current, [key]: next };
    });
  };

  const addReason = () => {
    const code = reasonDraft.trim();
    if (!code) return;
    setDraft((current) => {
      if (current.return_reason_codes.includes(code)) return current;
      return { ...current, return_reason_codes: [...current.return_reason_codes, code] };
    });
    setReasonDraft('');
  };

  const copyWhatsAppHours = async () => {
    setCopying(true);
    try {
      const response = await apiService.getWhatsAppBusinessProfile();
      const profile = response?.data || {};
      applyHours(profile.business_hours);
      if (profile.away_message) {
        setDraft((current) => ({ ...current, away_message: String(profile.away_message) }));
      }
      const parsed = weekFromApi(profile.business_hours);
      toast.success(
        parsed.configured
          ? 'Copied WhatsApp profile hours into this form. Save policy to use them for ordering.'
          : 'WhatsApp profile has no hours yet. Ordering stays open until you set hours here and save.'
      );
    } catch (error) {
      toast.error(mapApiError(error, 'Could not read WhatsApp profile hours'));
    } finally {
      setCopying(false);
    }
  };

  const openDayCount = useMemo(
    () => WEEKDAYS.filter((day) => days[day].is_open).length,
    [days]
  );

  const save = async () => {
    setFormError('');
    if (draft.sell_modes.length === 0) {
      setFormError('Choose at least one sell mode.');
      return;
    }
    if (draft.delivery_methods.length === 0) {
      setFormError('Choose at least one fulfillment method.');
      return;
    }
    if (draft.return_reason_codes.length === 0) {
      setFormError('Add at least one return reason.');
      return;
    }
    const windowDays = Number(draft.return_window_days);
    const cap = Number(draft.auto_approve_max_amount_kes);
    const handoffHours = Number(draft.human_handoff_ttl_hours);
    if (!Number.isFinite(windowDays) || windowDays < 0) {
      setFormError('Return window must be zero or more days.');
      return;
    }
    if (!Number.isFinite(cap) || cap < 0) {
      setFormError('Auto-approve cap must be zero or more.');
      return;
    }
    if (!Number.isInteger(handoffHours) || handoffHours < 1) {
      setFormError('Handoff pause must be at least 1 hour.');
      return;
    }
    if (hoursOn && openDayCount === 0) {
      setFormError('Open at least one day, or turn ordering hours off so the shop stays open.');
      return;
    }

    const payload = {
      sell_modes: draft.sell_modes,
      delivery_methods: draft.delivery_methods,
      reservations_enabled: draft.reservations_enabled,
      business_hours: hoursPayload(hoursOn, days),
      away_message: draft.away_message,
      return_window_days: windowDays,
      return_reason_codes: draft.return_reason_codes,
      auto_approve_enabled: draft.auto_approve_enabled,
      auto_approve_max_amount_kes: cap,
      cancel_until_status: draft.cancel_until_status,
      human_handoff_ttl_hours: handoffHours,
      commerce_rails_enabled: draft.commerce_rails_enabled,
    };

    setSaving(true);
    try {
      const response = await apiService.updateCommercePolicy(payload);
      if (response?.data) {
        setDraft(draftFromApi(response.data));
        applyHours(response.data.business_hours);
      }
      toast.success('Commerce policy saved');
    } catch (error) {
      toast.error(mapApiError(error, 'Could not save commerce policy'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-28">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary-800 to-primary-500 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Commerce policy</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Sell modes, ordering hours, returns, and when a refund can move without you.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500 dark:text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading policy…
          </div>
        ) : (
          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-4 h-4 text-primary-500" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">What you sell</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                Customers can only use the modes and fulfillment options you leave on.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {SELL_MODES.map((mode) => (
                  <label key={mode} className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={draft.sell_modes.includes(mode)}
                      onChange={() => toggleList('sell_modes', mode)}
                    />
                    {labelize(mode)}
                  </label>
                ))}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Fulfillment</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DELIVERY_METHODS.map((method) => (
                  <label key={method} className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={draft.delivery_methods.includes(method)}
                      onChange={() => toggleList('delivery_methods', method)}
                    />
                    {labelize(method)}
                  </label>
                ))}
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={draft.reservations_enabled}
                  onChange={(event) => setDraft({ ...draft, reservations_enabled: event.target.checked })}
                />
                Allow reservations
              </label>
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-primary-500" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Ordering hours</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
                Commerce policy is the source of truth for WhatsApp ordering. An empty week means the shop stays open.
                WhatsApp profile hours still drive auto-replies, so keep the two in sync.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <Link to="/whatsapp" className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                  Open WhatsApp profile hours
                </Link>
                <button
                  type="button"
                  onClick={() => void copyWhatsAppHours()}
                  disabled={copying}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 disabled:opacity-60"
                >
                  {copying ? 'Copying…' : 'Copy WhatsApp profile hours'}
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-slate-200 mb-4">
                <input
                  type="checkbox"
                  checked={hoursOn}
                  onChange={(event) => setHoursOn(event.target.checked)}
                />
                Set ordering hours
              </label>
              {!hoursOn ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Hours are not configured. Ordering stays open around the clock.
                </p>
              ) : (
                <div className="space-y-3">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="w-28 text-sm font-semibold text-gray-800 dark:text-slate-200">{labelize(day)}</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          aria-label={`${labelize(day)} open`}
                          value={days[day].open}
                          disabled={!days[day].is_open}
                          onChange={(event) =>
                            setDays({ ...days, [day]: { ...days[day], open: event.target.value } })
                          }
                          className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm disabled:opacity-40"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                          type="time"
                          aria-label={`${labelize(day)} close`}
                          value={days[day].close}
                          disabled={!days[day].is_open}
                          onChange={(event) =>
                            setDays({ ...days, [day]: { ...days[day], close: event.target.value } })
                          }
                          className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm disabled:opacity-40"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={days[day].is_open}
                          onChange={(event) =>
                            setDays({ ...days, [day]: { ...days[day], is_open: event.target.checked } })
                          }
                        />
                        Open
                      </label>
                    </div>
                  ))}
                </div>
              )}
              <label className="block mt-5 text-sm font-semibold text-gray-800 dark:text-slate-200" htmlFor="away-message">
                Away message
              </label>
              <textarea
                id="away-message"
                rows={3}
                value={draft.away_message}
                onChange={(event) => setDraft({ ...draft, away_message: event.target.value })}
                placeholder="Shop is away until morning."
                className={`${fieldClass} mt-1.5`}
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">
                Sent on WhatsApp when ordering hours say the shop is closed. Nairobi time.
              </p>
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Returns and refunds</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                Auto-approve stays off until you set a cap. Anything above it waits in the returns queue.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-sm font-semibold text-gray-800 dark:text-slate-200" htmlFor="return-window">
                  Return window (days)
                  <input
                    id="return-window"
                    type="number"
                    min={0}
                    value={draft.return_window_days}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        return_window_days: event.target.value === '' ? '' : Number(event.target.value),
                      })
                    }
                    className={`${fieldClass} mt-1.5 font-normal`}
                  />
                </label>
                <label className="block text-sm font-semibold text-gray-800 dark:text-slate-200" htmlFor="cancel-until">
                  Customers can cancel until
                  <select
                    id="cancel-until"
                    value={draft.cancel_until_status}
                    onChange={(event) => setDraft({ ...draft, cancel_until_status: event.target.value })}
                    className={`${fieldClass} mt-1.5 font-normal`}
                  >
                    {CANCEL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {labelize(status)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-2">Return reasons</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {draft.return_reason_codes.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          return_reason_codes: draft.return_reason_codes.filter((item) => item !== code),
                        })
                      }
                      className="rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-slate-200"
                    >
                      {code} ×
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    aria-label="New return reason"
                    value={reasonDraft}
                    onChange={(event) => setReasonDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addReason();
                      }
                    }}
                    placeholder="damaged"
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    onClick={addReason}
                    className="rounded-xl bg-secondary-800 text-white px-3 py-2 text-sm font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={draft.auto_approve_enabled}
                    onChange={(event) => setDraft({ ...draft, auto_approve_enabled: event.target.checked })}
                  />
                  Auto-approve returns at or under the cap
                </label>
                <label className="block text-sm font-semibold text-gray-800 dark:text-slate-200" htmlFor="auto-cap">
                  Auto-approve cap (KES)
                  <input
                    id="auto-cap"
                    type="number"
                    min={0}
                    disabled={!draft.auto_approve_enabled}
                    value={draft.auto_approve_max_amount_kes}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        auto_approve_max_amount_kes: event.target.value === '' ? '' : Number(event.target.value),
                      })
                    }
                    className={`${fieldClass} mt-1.5 font-normal disabled:opacity-50`}
                  />
                </label>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Rails and handoff</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                Rails keep prices, stock, and refunds on merchant rules. Handoff pauses the bot after a person takes the chat.
              </p>
              <label className="flex items-start gap-2 text-sm text-gray-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={draft.commerce_rails_enabled}
                  onChange={(event) => setDraft({ ...draft, commerce_rails_enabled: event.target.checked })}
                />
                <span>
                  <span className="font-semibold">Commerce rails enabled</span>
                  <span className="block text-gray-500 dark:text-slate-400 font-normal">
                    Leave this on so ordering uses catalog prices and this policy.
                  </span>
                </span>
              </label>
              <label className="block mt-4 text-sm font-semibold text-gray-800 dark:text-slate-200 max-w-xs" htmlFor="handoff-ttl">
                Human handoff pause (hours)
                <input
                  id="handoff-ttl"
                  type="number"
                  min={1}
                  value={draft.human_handoff_ttl_hours}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      human_handoff_ttl_hours: event.target.value === '' ? '' : Number(event.target.value),
                    })
                  }
                  className={`${fieldClass} mt-1.5 font-normal`}
                />
              </label>
            </section>

            {formError && (
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300" role="alert">
                {formError}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-20 border-t border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-end">
          <button
            type="button"
            onClick={() => void save()}
            disabled={loading || saving}
            className="rounded-xl bg-secondary-800 text-white px-4 py-2.5 text-sm font-semibold hover:bg-secondary-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save policy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommercePolicy;
