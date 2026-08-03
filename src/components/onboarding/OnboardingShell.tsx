import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface OnboardingShellProps {
  stepIndex: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  brandFirst?: boolean;
}

const OnboardingShell: React.FC<OnboardingShellProps> = ({
  stepIndex,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  continueLoading = false,
  secondaryAction,
  brandFirst = false,
}) => {
  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-surface-gradient-dark text-white relative overflow-hidden">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-accent-400/10 blur-3xl" />
      </div>

      <header className="relative z-10 px-4 sm:px-6 pt-5 sm:pt-8 pb-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="shrink-0 p-2.5 rounded-xl text-secondary-300 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-11" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide uppercase text-primary-300 truncate">
                Arrotech Hub
              </p>
              {!brandFirst && (
                <p className="text-xs text-secondary-400 mt-0.5">
                  Step {stepIndex + 1} of {totalSteps}
                </p>
              )}
            </div>
          </div>
          <div className="text-xs text-secondary-400 tabular-nums hidden sm:block">
            ~3 min
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-4">
          <div
            className="h-1.5 rounded-full bg-white/10 overflow-hidden"
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label="Onboarding progress"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400 transition-all duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col px-4 sm:px-6 pb-28 sm:pb-10">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <div
            key={stepIndex}
            className="animate-fade-in motion-reduce:animate-none"
          >
            <h1
              className={`font-bold tracking-tight text-white leading-tight ${
                brandFirst
                  ? 'text-3xl sm:text-4xl mt-6 sm:mt-10'
                  : 'text-2xl sm:text-3xl mt-4 sm:mt-6'
              }`}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 sm:mt-3 text-sm sm:text-base text-secondary-400 max-w-xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <div className="mt-6 sm:mt-8 flex-1">{children}</div>

          {/* Desktop / tablet footer */}
          {(onContinue || secondaryAction) && (
            <div className="hidden sm:flex items-center justify-between gap-4 mt-10 pt-4 border-t border-white/10">
              {secondaryAction ? (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className="text-sm font-medium text-secondary-400 hover:text-white transition-colors px-2 py-2"
                >
                  {secondaryAction.label}
                </button>
              ) : (
                <span />
              )}
              {onContinue && (
                <button
                  type="button"
                  onClick={onContinue}
                  disabled={continueDisabled || continueLoading}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-8 rounded-2xl font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-brand disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {continueLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {continueLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile sticky CTA */}
      {(onContinue || secondaryAction) && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-20 border-t border-white/10 bg-secondary-950/90 backdrop-blur-xl px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="w-full mb-2 text-sm font-medium text-secondary-400 hover:text-white py-2"
            >
              {secondaryAction.label}
            </button>
          )}
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              disabled={continueDisabled || continueLoading}
              className="w-full min-h-[48px] rounded-2xl font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {continueLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {continueLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OnboardingShell;
