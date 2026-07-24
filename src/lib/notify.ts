import { toast as sonnerToast, type ExternalToast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { createElement } from 'react';
import { mapApiError } from './mapApiError';

/**
 * Single source of truth for all transient feedback (snackbars).
 *
 * Every screen should call `notify.*` instead of importing a toast library
 * directly. This means branding, icons, and future library swaps happen in
 * exactly one file.
 *
 * Doctrine (see docs/ui-states.md):
 *  - snackbar  → transient, non-blocking success/recoverable-error/background
 *  - inline    → form field validation (never a toast)
 *  - full page → empty / error / 404 / 403 / offline
 */

export interface NotifyOptions extends ExternalToast {
  /** Optional action button (e.g. Undo / Retry). */
  action?: { label: string; onClick: () => void };
}

const iconClass = 'h-5 w-5';

const icons = {
  success: () => createElement(CheckCircle2, { className: `${iconClass} text-emerald-500` }),
  error: () => createElement(XCircle, { className: `${iconClass} text-red-500` }),
  warning: () => createElement(AlertTriangle, { className: `${iconClass} text-accent-500` }),
  info: () => createElement(Info, { className: `${iconClass} text-primary-500` }),
  loading: () => createElement(Loader2, { className: `${iconClass} text-primary-500 animate-spin` }),
};

type Message = string;

function base(options?: NotifyOptions): ExternalToast {
  const { action, ...rest } = options || {};
  return {
    ...rest,
    ...(action
      ? { action: { label: action.label, onClick: action.onClick } }
      : {}),
  };
}

export const notify = {
  success(message: Message, options?: NotifyOptions) {
    return sonnerToast.success(message, { icon: icons.success(), ...base(options) });
  },

  error(message: Message, options?: NotifyOptions) {
    return sonnerToast.error(message, { icon: icons.error(), ...base(options) });
  },

  warning(message: Message, options?: NotifyOptions) {
    return sonnerToast.warning(message, { icon: icons.warning(), ...base(options) });
  },

  info(message: Message, options?: NotifyOptions) {
    return sonnerToast(message, { icon: icons.info(), ...base(options) });
  },

  loading(message: Message, options?: NotifyOptions) {
    return sonnerToast.loading(message, { icon: icons.loading(), ...base(options) });
  },

  /**
   * Normalize any thrown error into a friendly message and surface it as an
   * error snackbar. Prefer this in `catch` blocks over hand-rolling messages.
   */
  fromError(error: unknown, fallback?: string, options?: NotifyOptions) {
    return this.error(mapApiError(error, fallback), options);
  },

  /**
   * Update an existing toast by id (loading → success/error).
   * Mirrors the old `toast.loading(...)` then `toast.success({ id })` pattern.
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: Message;
      success: Message | ((data: T) => Message);
      error?: Message | ((error: unknown) => Message);
    },
    options?: NotifyOptions
  ) {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: (data: T) =>
        typeof messages.success === 'function'
          ? (messages.success as (d: T) => Message)(data)
          : messages.success,
      error: (err: unknown) => {
        if (!messages.error) return mapApiError(err);
        return typeof messages.error === 'function'
          ? (messages.error as (e: unknown) => Message)(err)
          : messages.error;
      },
      ...base(options),
    });
  },

  dismiss(id?: string | number) {
    return sonnerToast.dismiss(id);
  },
};

/**
 * Backwards-compatible `toast` shim.
 *
 * The app previously used `react-hot-toast`'s default `toast` export in ~40
 * files. This shim routes those call sites (`toast.success`, `toast.error`,
 * `toast.loading`, `toast.dismiss`, bare `toast()`) through the branded
 * `notify` wrapper, so migrating a file is a one-line import swap. New code
 * should import and use `notify` directly.
 */
function toastFn(message: Message, options?: NotifyOptions) {
  return sonnerToast(message, base(options));
}

export const toast = Object.assign(toastFn, {
  success: (m: Message, o?: NotifyOptions) => notify.success(m, o),
  error: (m: Message, o?: NotifyOptions) => notify.error(m, o),
  warning: (m: Message, o?: NotifyOptions) => notify.warning(m, o),
  info: (m: Message, o?: NotifyOptions) => notify.info(m, o),
  loading: (m: Message, o?: NotifyOptions) => notify.loading(m, o),
  dismiss: (id?: string | number) => notify.dismiss(id),
  promise: notify.promise.bind(notify),
});

export default toast;
