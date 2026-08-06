import React from 'react';
import { MessageCircle, Send } from 'lucide-react';

export type CanvasTemplateId = 'whatsapp_ordering' | 'telegram_ordering';

interface TemplateDropZonesProps {
  visible: boolean;
  onSelect: (templateId: CanvasTemplateId) => void;
  /** When true, render inline (inside empty coach) instead of absolute overlay */
  embedded?: boolean;
}

/** Empty-canvas skeletons for WhatsApp / Telegram ordering flows. */
const TemplateDropZones: React.FC<TemplateDropZonesProps> = ({
  visible,
  onSelect,
  embedded = false,
}) => {
  if (!visible) return null;

  const body = (
    <>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Or start from a skeleton
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSelect('whatsapp_ordering')}
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-left text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          WhatsApp ordering
        </button>
        <button
          type="button"
          onClick={() => onSelect('telegram_ordering')}
          className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2.5 text-left text-xs font-bold text-sky-800 transition hover:bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
        >
          <Send className="h-4 w-4 shrink-0" />
          Telegram ordering
        </button>
      </div>
    </>
  );

  if (embedded) {
    return <div className="pointer-events-auto">{body}</div>;
  }

  return (
    <div className="pointer-events-none absolute bottom-24 left-1/2 z-[6] flex w-full max-w-md -translate-x-1/2 flex-col px-4 sm:bottom-28">
      <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg dark:border-secondary-700 dark:bg-secondary-950/95">
        {body}
      </div>
    </div>
  );
};

export function skeletonStepsFor(templateId: CanvasTemplateId) {
  if (templateId === 'telegram_ordering') {
    return [
      { tool: 'conversational_agent', description: 'Handle Telegram order conversation' },
      { tool: 'condition_router', description: 'Route confirmed vs cancelled orders' },
      { tool: 'telegram_send_message', description: 'Send order confirmation' },
    ];
  }
  return [
    { tool: 'conversational_agent', description: 'Handle WhatsApp order conversation' },
    { tool: 'condition_router', description: 'Route confirmed vs cancelled orders' },
    { tool: 'whatsapp_send_message', description: 'Send order confirmation' },
  ];
}

export default TemplateDropZones;
