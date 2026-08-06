import React from 'react';
import { Plus, MousePointerClick } from 'lucide-react';
import TemplateDropZones, { CanvasTemplateId } from './TemplateDropZones';

interface CanvasEmptyStateProps {
  onOpenLibrary: () => void;
  onSelectTemplate: (templateId: CanvasTemplateId) => void;
}

/**
 * Coach for a canvas that already has a Start trigger.
 * Anchored to the bottom so it never covers the trigger node.
 */
const CanvasEmptyState: React.FC<CanvasEmptyStateProps> = ({
  onOpenLibrary,
  onSelectTemplate,
}) => {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] flex justify-center px-4 pb-20 sm:pb-8 lg:pb-6">
      <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-secondary-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-secondary-700 dark:bg-secondary-950/95 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-left">
            <p className="text-sm font-bold text-secondary-900 dark:text-white">
              Your flow starts above
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Drag a tool onto the canvas, or open the library to add the next step.
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
              <MousePointerClick className="h-3 w-3" aria-hidden />
              Click Start to change the trigger
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLibrary}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-primary-500/20 transition hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add a step
          </button>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/5">
          <TemplateDropZones visible embedded onSelect={onSelectTemplate} />
        </div>
      </div>
    </div>
  );
};

export default CanvasEmptyState;
