import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Zap, Play, Clock, Webhook, MousePointer, GripVertical,
  Link2, Link2Off, Bot, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';
import { TOOL_CATEGORIES, CATEGORY_TW } from '../shared/toolCategories';
import { WorkflowNodeData } from '../canvas/types';

const TRIGGER_ICONS: Record<string, any> = {
  manual: MousePointer,
  scheduled: Clock,
  webhook: Webhook,
  event: Play,
};

const WorkflowNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const {
    label,
    toolName,
    category,
    description,
    stepNumber,
    isConfigured,
    isTrigger,
    triggerType,
    isCondition,
    connectionStatus,
    connectionLabel,
    executionStatus,
    isAgentAware,
    channelBadge,
  } = nodeData;

  if (isTrigger) {
    const TriggerIcon = TRIGGER_ICONS[triggerType || 'manual'] || Play;
    return (
      <div
        className={`relative cursor-pointer transition-transform duration-200 ${selected ? 'scale-[1.03]' : ''}`}
        aria-label={`Trigger: ${triggerType || 'manual'}`}
      >
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !border-2 !border-white !bg-primary-500 !-bottom-1.5"
        />
        <div
          className={`min-w-[200px] rounded-2xl bg-secondary-900 px-5 py-4 text-white shadow-lg transition-shadow duration-200 ${
            selected ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-transparent' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/15 bg-white/10 p-2">
              <TriggerIcon className="h-5 w-5 text-primary-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Trigger</p>
              <p className="text-sm font-bold capitalize">{triggerType || 'Manual'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const catMeta = TOOL_CATEGORIES[category] || TOOL_CATEGORIES.General;
  const tw = CATEGORY_TW[category] || CATEGORY_TW.General;
  const IconComponent = catMeta.icon || Zap;

  const execRing =
    executionStatus === 'running'
      ? 'ring-2 ring-sky-400 ring-offset-2'
      : executionStatus === 'success'
        ? 'ring-2 ring-emerald-400 ring-offset-2'
        : executionStatus === 'failed'
          ? 'ring-2 ring-red-400 ring-offset-2'
          : selected
            ? 'ring-2 ring-primary-500 ring-offset-2'
            : '';

  return (
    <div
      className={`relative cursor-pointer transition-transform duration-200 ${selected ? 'scale-[1.02]' : 'hover:-translate-y-0.5'}`}
      aria-label={`Step ${stepNumber}: ${label}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-secondary-700 !-top-1.5"
      />

      {isCondition ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Bottom}
            style={{ left: '30%' }}
            className="!h-3 !w-3 !border-2 !border-white !bg-emerald-500"
          />
          <Handle
            type="source"
            id="false"
            position={Position.Bottom}
            style={{ left: '70%' }}
            className="!h-3 !w-3 !border-2 !border-white !bg-red-500"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !border-2 !border-white !bg-secondary-700 !-bottom-1.5"
        />
      )}

      <div
        className={`min-w-[240px] max-w-[300px] rounded-2xl border-2 bg-white dark:bg-secondary-950 ${tw.border} shadow-md transition-shadow duration-200 ${execRing}`}
      >
        <div className="flex items-center justify-between rounded-t-xl border-b border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-white/5 dark:bg-secondary-900/60">
          <div className="flex items-center gap-2">
            <GripVertical className="h-3.5 w-3.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {isCondition ? 'Router' : `Step ${stepNumber}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {executionStatus === 'running' && <Loader2 className="h-3 w-3 animate-spin text-sky-500" aria-label="Running" />}
            {executionStatus === 'success' && <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-label="Succeeded" />}
            {executionStatus === 'failed' && <XCircle className="h-3 w-3 text-red-500" aria-label="Failed" />}
            <div
              className={`h-2 w-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'animate-pulse bg-accent-500'}`}
              title={isConfigured ? 'Configured' : 'Needs configuration'}
            />
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="mb-2 flex items-start gap-3">
            <div className={`rounded-xl border p-2.5 ${tw.bg} ${tw.border}`}>
              {isAgentAware ? (
                <Bot className={`h-5 w-5 ${tw.text}`} />
              ) : (
                <IconComponent className={`h-5 w-5 ${tw.text}`} />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="truncate text-sm font-bold leading-tight text-secondary-900 dark:text-white">{label}</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">{toolName}</p>
            </div>
          </div>
          {description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
          )}
          {isCondition && (
            <div className="mt-2 flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <span className="text-emerald-600">True</span>
              <span className="text-red-500">False</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-white/5 dark:bg-secondary-900/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[9.5px] font-black uppercase tracking-widest ${tw.text}`}>{category}</span>
            {channelBadge && (
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                {channelBadge}
              </span>
            )}
            {connectionStatus === 'connected' && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Link2 className="h-2.5 w-2.5" />
                {connectionLabel || 'Connected'}
              </span>
            )}
            {connectionStatus === 'needs_connect' && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-accent-50 px-1.5 py-0.5 text-[9px] font-bold text-accent-800 dark:bg-accent-500/15 dark:text-accent-300">
                <Link2Off className="h-2.5 w-2.5" />
                Needs connect
              </span>
            )}
          </div>
          <span
            className={`rounded-md px-2 py-0.5 text-[9.5px] font-bold ${
              isConfigured
                ? 'border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'border border-accent-200 bg-accent-100 text-accent-800 dark:border-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
            }`}
          >
            {isConfigured ? 'Ready' : 'Configure'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default memo(WorkflowNodeComponent);
export type { WorkflowNodeData } from '../canvas/types';
