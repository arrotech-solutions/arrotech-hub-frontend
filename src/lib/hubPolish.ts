/**
 * Shared Hub polish class tokens (Commerce Returns / Orders density).
 * Import in Products, WhatsApp Settings, and Library — no new CSS package.
 */

/** Section card shell — add padding/spacing at call site when needed. */
export const hubSection =
  'bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800';

/** Primary title inside a hub section. */
export const hubSectionHeader = 'text-lg font-bold text-gray-900 dark:text-white';

/** Form field label. */
export const hubFieldLabel = 'block text-sm font-semibold text-gray-700 dark:text-slate-200';

/** Modal overlay; stacks content at bottom on mobile, centered on sm+. */
export const hubModalBackdrop =
  'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4';

/** Modal panel — pair with max-w-* at call site for width. */
export const hubModalFrame =
  'bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-h-[90vh] shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden';

/** Primary action (approve, save, deploy). */
export const hubPrimaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-secondary-800 text-white px-3 py-2 text-sm font-semibold hover:bg-secondary-900 disabled:opacity-60 transition-colors';

/** Destructive or deny-style action. */
export const hubDangerBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 px-3 py-2 text-sm font-semibold hover:bg-rose-100 dark:hover:bg-rose-500/25 disabled:opacity-60 transition-colors';