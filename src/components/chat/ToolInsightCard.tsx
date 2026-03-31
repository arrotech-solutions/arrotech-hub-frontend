import React, { useState } from 'react';
import {
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Plug,
  ArrowRight,
} from 'lucide-react';
import { ToolCall, ToolContextEvent } from '../../types';

// Platform color mapping
const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'border-orange-500/20',
    icon: 'text-orange-400',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
  },
  green: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400',
  },
  yellow: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
  },
  pink: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-500',
    border: 'border-pink-500/20',
    icon: 'text-pink-400',
  },
  coral: {
    bg: 'bg-red-400/10',
    text: 'text-red-400',
    border: 'border-red-400/20',
    icon: 'text-red-300',
  },
  gray: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-500',
    border: 'border-gray-500/20',
    icon: 'text-gray-400',
  },
};

interface ToolInsightCardProps {
  tool: ToolCall;
  context?: ToolContextEvent | any;
  isDarkMode: boolean;
  mode: 'simple' | 'detailed';
  children?: React.ReactNode;
}

const ToolInsightCard: React.FC<ToolInsightCardProps> = ({
  tool,
  context,
  isDarkMode,
  mode,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isSuccess = tool.success !== false && !tool.result?.error;
  const platformColor = context?.platform_color || 'gray';
  const colors = PLATFORM_COLORS[platformColor] || PLATFORM_COLORS.gray;
  const platformIcon = context?.platform_icon || '⚡';
  const platformName = context?.platform || 'Built-in';
  const category = context?.category || 'general';
  const reason = context?.reason || `Executed ${tool.name.replace(/_/g, ' ')}`;
  const summary = tool.result?.summary || `Executed ${tool.name.replace(/_/g, ' ')}`;
  const connectionStatus = context?.connection_status || 'built-in';

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 group ${
        isDarkMode
          ? `bg-gray-800/50 ${isSuccess ? colors.border : 'border-red-500/30'}`
          : `bg-white ${isSuccess ? 'border-gray-100' : 'border-red-200'} shadow-sm`
      }`}
    >
      {/* Header - Always visible */}
      <div
        className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Platform badge */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-xl border ${colors.bg} ${colors.border} flex-shrink-0`}
          >
            <span className="text-sm">{platformIcon}</span>
          </div>

          <div className="min-w-0">
            {/* Summary line */}
            <p
              className={`text-xs font-semibold truncate ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}
            >
              {summary}
            </p>

            {/* Platform & status */}
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-[10px] font-medium ${colors.text}`}
              >
                {platformName}
              </span>
              <span className={`text-[10px] ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
              <span
                className={`text-[10px] font-medium ${
                  isSuccess ? 'text-emerald-500' : 'text-red-400'
                }`}
              >
                {isSuccess ? 'Success' : 'Failed'}
              </span>
              {connectionStatus === 'active' && (
                <>
                  <span className={`text-[10px] ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-500">
                    <Plug size={8} />
                    Connected
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expand/collapse + status icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isSuccess ? (
            <CheckCircle2 size={14} className="text-emerald-500" />
          ) : (
            <XCircle size={14} className="text-red-400" />
          )}
          {isExpanded ? (
            <ChevronUp size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
          ) : (
            <ChevronDown size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          className={`border-t px-4 py-3 space-y-3 ${
            isDarkMode ? 'border-gray-700/50' : 'border-gray-100'
          }`}
        >
          {/* Why this tool was selected */}
          {mode === 'detailed' && reason && (
            <div
              className={`flex items-start gap-2 p-2.5 rounded-xl ${
                isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/80'
              }`}
            >
              <ArrowRight size={12} className={`mt-0.5 ${colors.text} flex-shrink-0`} />
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  Why this tool
                </p>
                <p
                  className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {reason}
                </p>
              </div>
            </div>
          )}

          {/* Arguments */}
          {mode === 'detailed' && tool.arguments && Object.keys(tool.arguments).length > 0 && (
            <div>
              <p
                className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                Parameters
              </p>
              <div
                className={`grid grid-cols-2 gap-1.5 p-2 rounded-xl ${
                  isDarkMode ? 'bg-gray-900/40' : 'bg-gray-50/60'
                }`}
              >
                {Object.entries(tool.arguments).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="px-1.5 py-1">
                    <p
                      className={`text-[9px] font-bold uppercase tracking-widest ${
                        isDarkMode ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p
                      className={`text-[11px] font-medium truncate ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON (detailed mode only) */}
          {mode === 'detailed' && tool.result && (
            <details className="group/raw">
              <summary
                className={`text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:underline transition-all ${
                  isDarkMode
                    ? 'text-gray-600 hover:text-gray-400'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                View Raw Response
              </summary>
              <pre
                className={`mt-2 p-3 text-[10px] rounded-xl overflow-x-auto max-h-40 ${
                  isDarkMode
                    ? 'bg-gray-900 text-indigo-400'
                    : 'bg-gray-50 text-indigo-600 border border-gray-100'
                }`}
              >
                {JSON.stringify(tool.result, null, 2)}
              </pre>
            </details>
          )}

          {/* Children / Specific Visualizations */}
          {children && (
            <div className="mt-2">
              {children}
            </div>
          )}

          {/* Category badge */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {category.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolInsightCard;
