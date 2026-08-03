import React from 'react';
import { Check, type LucideIcon } from 'lucide-react';

interface ChoiceTileProps {
  title: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  accent?: string;
}

export const ChoiceTile: React.FC<ChoiceTileProps> = ({
  title,
  description,
  icon: Icon,
  selected,
  onSelect,
  accent = 'from-primary-500 to-primary-600',
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group text-left w-full rounded-2xl p-4 sm:p-5 border-2 transition-all duration-200 min-h-[44px] motion-reduce:transition-none ${
        selected
          ? 'bg-primary-500/15 border-primary-500/60 shadow-brand scale-[1.01]'
          : 'bg-white/5 border-white/10 hover:border-primary-500/30 hover:bg-white/[0.07]'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-brand`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">
              {title}
            </h3>
            <span
              className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                selected
                  ? 'bg-primary-500 border-primary-400'
                  : 'border-white/25 bg-transparent'
              }`}
            >
              {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </span>
          </div>
          <p className="mt-1 text-sm text-secondary-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
};

interface ChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const SelectChip: React.FC<ChipProps> = ({
  label,
  selected,
  onToggle,
  disabled,
}) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    aria-pressed={selected}
    className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all min-h-[40px] disabled:opacity-40 ${
      selected
        ? 'bg-primary-500/20 border-primary-500/50 text-primary-200'
        : 'bg-white/5 border-white/10 text-secondary-300 hover:border-white/25'
    }`}
  >
    {label}
  </button>
);
