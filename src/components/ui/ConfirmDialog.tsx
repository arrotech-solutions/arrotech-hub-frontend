import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, Trash2, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '../../lib/cn';

export type DialogTone = 'danger' | 'warning' | 'default' | 'info' | 'success';

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  /** User must type this exact value to enable the confirm action. */
  requireText?: string;
  requireTextLabel?: string;
  /** Show a free-form text field (used by `prompt`). */
  input?: {
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    required?: boolean;
  };
  /** Hide cancel — single acknowledgment button (`alert`). */
  acknowledgeOnly?: boolean;
}

type Resolver =
  | { kind: 'confirm'; resolve: (value: boolean) => void }
  | { kind: 'prompt'; resolve: (value: string | null) => void }
  | { kind: 'alert'; resolve: () => void };

interface DialogState {
  options: ConfirmOptions;
  resolver: Resolver;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: ConfirmOptions) => Promise<string | null>;
  alert: (options: ConfirmOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const toneStyles: Record<
  DialogTone,
  { iconWrap: string; icon: React.ReactNode; confirmVariant: 'danger' | 'primary' | 'accent' | 'secondary' }
> = {
  danger: {
    iconWrap: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    icon: <Trash2 className="h-5 w-5" aria-hidden />,
    confirmVariant: 'danger',
  },
  warning: {
    iconWrap: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    icon: <AlertTriangle className="h-5 w-5" aria-hidden />,
    confirmVariant: 'accent',
  },
  info: {
    iconWrap: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
    icon: <Info className="h-5 w-5" aria-hidden />,
    confirmVariant: 'primary',
  },
  success: {
    iconWrap: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    icon: <CheckCircle2 className="h-5 w-5" aria-hidden />,
    confirmVariant: 'primary',
  },
  default: {
    iconWrap: 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
    icon: <Info className="h-5 w-5" aria-hidden />,
    confirmVariant: 'primary',
  },
};

function ConfirmDialogSurface({
  options,
  onCancel,
  onConfirm,
}: {
  options: ConfirmOptions;
  onCancel: () => void;
  onConfirm: (inputValue: string) => void;
}) {
  const titleId = useId();
  const descId = useId();
  const tone = options.tone ?? (options.requireText ? 'danger' : 'default');
  const style = toneStyles[tone];
  const [typed, setTyped] = useState('');
  const [inputValue, setInputValue] = useState(options.input?.defaultValue ?? '');
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const requireOk = options.requireText
    ? typed.trim() === options.requireText
    : true;
  const inputOk = options.input?.required ? inputValue.trim().length > 0 : true;
  const canConfirm = requireOk && inputOk;

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    const t = window.setTimeout(() => {
      if (options.requireText || options.input) inputRef.current?.focus();
      else confirmRef.current?.focus();
    }, 40);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(t);
    };
  }, [options.requireText, options.input]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const submit = () => {
    if (!canConfirm) return;
    onConfirm(inputValue);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10000] flex items-end justify-center p-0 sm:items-center sm:p-4',
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !options.requireText) onCancel();
      }}
    >
      <div
        className={cn(
          'absolute inset-0 bg-secondary-950/50 backdrop-blur-[6px]',
          'transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={options.description ? descId : undefined}
        className={cn(
          'relative z-10 w-full max-w-md outline-none',
          'rounded-t-3xl sm:rounded-2xl',
          'border border-secondary-200/80 bg-white shadow-2xl',
          'dark:border-secondary-700 dark:bg-secondary-900',
          'ring-1 ring-black/5 dark:ring-white/5',
          'transition-all duration-200 ease-out',
          visible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-4 scale-[0.98] opacity-0 sm:translate-y-2'
        )}
      >
        <div className="flex justify-center pt-3 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-secondary-200 dark:bg-secondary-700" />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pb-0 pt-4 sm:px-6 sm:pt-6">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
              style.iconWrap
            )}
          >
            {style.icon}
          </div>
          {!options.acknowledgeOnly && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl p-2 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-700 dark:hover:bg-secondary-800 dark:hover:text-secondary-200"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="space-y-4 px-5 py-4 sm:px-6 sm:pb-6">
          <div>
            <h2
              id={titleId}
              className="text-lg font-bold tracking-tight text-secondary-900 dark:text-secondary-50"
            >
              {options.title}
            </h2>
            {options.description && (
              <div
                id={descId}
                className="mt-1.5 text-sm leading-relaxed text-secondary-500 dark:text-secondary-400"
              >
                {options.description}
              </div>
            )}
          </div>

          {options.requireText && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                {options.requireTextLabel || (
                  <>
                    Type{' '}
                    <span className="font-mono text-secondary-800 dark:text-secondary-200">
                      {options.requireText}
                    </span>{' '}
                    to confirm
                  </>
                )}
              </label>
              <Input
                ref={inputRef}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={options.requireText}
                autoComplete="off"
                spellCheck={false}
                className="font-mono tracking-wide"
                invalid={typed.length > 0 && !requireOk}
              />
            </div>
          )}

          {options.input && !options.requireText && (
            <div className="space-y-2">
              {options.input.label && (
                <label className="block text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                  {options.input.label}
                </label>
              )}
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={options.input.placeholder}
                autoComplete="off"
              />
            </div>
          )}

          <div
            className={cn(
              'flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end',
              options.acknowledgeOnly && 'sm:justify-stretch'
            )}
          >
            {!options.acknowledgeOnly && (
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={onCancel}
              >
                {options.cancelLabel || 'Cancel'}
              </Button>
            )}
            <Button
              ref={confirmRef}
              type="button"
              variant={style.confirmVariant}
              className={cn('w-full sm:w-auto', options.acknowledgeOnly && 'w-full')}
              disabled={!canConfirm}
              onClick={submit}
            >
              {options.confirmLabel ||
                (options.acknowledgeOnly
                  ? 'Got it'
                  : tone === 'danger'
                    ? 'Delete'
                    : 'Confirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const close = useCallback(() => setDialog(null), []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        options,
        resolver: { kind: 'confirm', resolve },
      });
    });
  }, []);

  const prompt = useCallback((options: ConfirmOptions) => {
    return new Promise<string | null>((resolve) => {
      setDialog({
        options: {
          ...options,
          input: options.input ?? { placeholder: 'Enter a value' },
        },
        resolver: { kind: 'prompt', resolve },
      });
    });
  }, []);

  const alertFn = useCallback((options: ConfirmOptions) => {
    return new Promise<void>((resolve) => {
      setDialog({
        options: {
          tone: options.tone ?? 'info',
          confirmLabel: options.confirmLabel ?? 'Got it',
          ...options,
          acknowledgeOnly: true,
        },
        resolver: { kind: 'alert', resolve },
      });
    });
  }, []);

  const value = useMemo(
    () => ({ confirm, prompt, alert: alertFn }),
    [confirm, prompt, alertFn]
  );

  const handleCancel = useCallback(() => {
    if (!dialog) return;
    const { resolver } = dialog;
    close();
    if (resolver.kind === 'confirm') resolver.resolve(false);
    else if (resolver.kind === 'prompt') resolver.resolve(null);
    else resolver.resolve();
  }, [dialog, close]);

  const handleConfirm = useCallback(
    (inputValue: string) => {
      if (!dialog) return;
      const { resolver } = dialog;
      close();
      if (resolver.kind === 'confirm') resolver.resolve(true);
      else if (resolver.kind === 'prompt') resolver.resolve(inputValue);
      else resolver.resolve();
    },
    [dialog, close]
  );

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {dialog && (
        <ConfirmDialogSurface
          options={dialog.options}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
}
