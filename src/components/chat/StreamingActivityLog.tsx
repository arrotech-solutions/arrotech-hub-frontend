import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Square,
  Zap,
  Search,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SearchSourceCards from './SearchSourceCards';
import { createMarkdownComponents } from './CodeBlock';
import {
  StreamingState,
  ActivityItem,
  ActivityThinking,
  ActivityToolStart,
  ActivityToolResult,
  ActivitySearchSources,
} from '../../hooks/useStreamingChat';

// ─── Platform Colors ───────────────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  purple: { accent: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  orange: { accent: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  blue:   { accent: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  green:  { accent: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  yellow: { accent: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  pink:   { accent: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/20' },
  gray:   { accent: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
};

// ─── Props ─────────────────────────────────────────────────────────────────

interface StreamingActivityLogProps {
  streamState: StreamingState;
  isDarkMode: boolean;
  onCancel: () => void;
  hideContent?: boolean;
  onViewSources?: (sources: any[]) => void;
}

// ─── Sub-Components ────────────────────────────────────────────────────────

const ThinkingBlock: React.FC<{
  item: ActivityThinking;
  isDarkMode: boolean;
  isLast: boolean;
}> = ({ item, isDarkMode, isLast }) => {
  const [isOpen, setIsOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-collapse when thinking completes and we're not the last item
  useEffect(() => {
    if (item.isComplete && !isLast) {
      const timer = setTimeout(() => setIsOpen(false), 600);
      return () => clearTimeout(timer);
    }
  }, [item.isComplete, isLast]);

  // Auto-scroll while streaming
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [item.text, isOpen]);

  return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-300 mb-3
      ${isDarkMode
        ? 'bg-gradient-to-br from-indigo-950/40 to-gray-900/60 border-indigo-500/20'
        : 'bg-gradient-to-br from-indigo-50/80 to-white border-indigo-200/50'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors
          ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-indigo-50/50'}`}
      >
        <div className="flex items-center space-x-2.5">
          <div className={`p-1 rounded-lg ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
            <Brain size={14} className={`${!item.isComplete ? 'text-indigo-400 animate-pulse' : 'text-indigo-500'}`} />
          </div>
          <span className={`text-xs font-semibold tracking-wide
            ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
            {!item.isComplete ? 'Thinking...' : 'Thought process'}
          </span>
          {item.isComplete && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
              ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-500'}`}>
              Complete
            </span>
          )}
        </div>
        {isOpen
          ? <ChevronDown size={14} className={isDarkMode ? 'text-indigo-500' : 'text-indigo-400'} />
          : <ChevronRight size={14} className={isDarkMode ? 'text-indigo-500' : 'text-indigo-400'} />
        }
      </button>

      <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[300px]' : 'max-h-0'}`}>
        <div
          ref={contentRef}
          className={`px-4 pb-3 pt-1 text-[13px] leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[260px] custom-scrollbar
            ${isDarkMode ? 'text-indigo-200/70' : 'text-indigo-800/70'}`}
        >
          {item.text}
          {!item.isComplete && (
            <span className="inline-block w-1.5 h-3.5 ml-0.5 -mb-0.5 bg-indigo-400 animate-pulse rounded-sm" />
          )}
        </div>
      </div>
    </div>
  );
};

const ToolStartRow: React.FC<{
  item: ActivityToolStart;
  result?: ActivityToolResult;
  isDarkMode: boolean;
}> = ({ item, result, isDarkMode }) => {
  const [showArgs, setShowArgs] = useState(false);
  const colors = PLATFORM_COLORS[item.platformColor || 'gray'] || PLATFORM_COLORS.gray;
  const isRunning = !result;
  const isSuccess = result?.success !== false;
  const elapsed = result ? `${(result.elapsedMs / 1000).toFixed(1)}s` : null;

  // Calculate live elapsed time while running
  const [liveElapsed, setLiveElapsed] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setLiveElapsed(Date.now() - item.startedAt);
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, item.startedAt]);

  const hasArgs = item.args && Object.keys(item.args).length > 0;

  return (
    <div className={`mb-2 rounded-xl border transition-all duration-300
      ${isDarkMode
        ? `bg-gray-800/40 ${isRunning ? 'border-gray-700/50' : (isSuccess ? colors.border : 'border-red-500/20')}`
        : `bg-white/80 ${isRunning ? 'border-gray-200' : (isSuccess ? 'border-gray-100' : 'border-red-200')} shadow-sm`
      }`}
    >
      <div
        className={`flex items-center px-3.5 py-2.5 ${hasArgs ? 'cursor-pointer' : ''}`}
        onClick={() => hasArgs && setShowArgs(!showArgs)}
      >
        {/* Icon */}
        <div className={`flex items-center justify-center w-7 h-7 rounded-lg border mr-3 flex-shrink-0
          ${colors.bg} ${colors.border}`}>
          {item.platformIcon
            ? <span className="text-sm">{item.platformIcon}</span>
            : <Zap size={13} className={colors.accent} />
          }
        </div>

        {/* Tool info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {item.displayName}
            </span>
            {item.platform && item.platform !== 'Built-in' && (
              <span className={`text-[10px] font-medium ${colors.accent}`}>
                {item.platform}
              </span>
            )}
          </div>

          {/* Status line */}
          <div className="flex items-center space-x-2 mt-0.5">
            {isRunning ? (
              <>
                <Loader2 size={10} className="text-indigo-400 animate-spin" />
                <span className={`text-[10px] font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Running... {liveElapsed > 1000 ? `${(liveElapsed / 1000).toFixed(1)}s` : ''}
                </span>
              </>
            ) : (
              <>
                {isSuccess
                  ? <CheckCircle2 size={10} className="text-emerald-500" />
                  : <XCircle size={10} className="text-red-400" />
                }
                <span className={`text-[10px] font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {result?.summary || (isSuccess ? 'Success' : 'Failed')}
                  {elapsed && <span className="ml-1 opacity-60">· {elapsed}</span>}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Expand arrow */}
        {hasArgs && (
          <div className="ml-2">
            {showArgs
              ? <ChevronDown size={12} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
              : <ChevronRight size={12} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
            }
          </div>
        )}
      </div>

      {/* Expanded arguments */}
      {showArgs && hasArgs && (
        <div className={`border-t px-4 py-2.5 ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
          <pre className={`text-[10px] leading-relaxed font-mono overflow-x-auto max-h-32 custom-scrollbar
            ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {JSON.stringify(item.args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

const StreamingActivityLog: React.FC<StreamingActivityLogProps> = ({
  streamState,
  isDarkMode,
  onCancel,
  hideContent = false,
  onViewSources,
}) => {
  const { phase, activityLog, content } = streamState;
  const contentEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when content updates
  useEffect(() => {
    if (contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [content, activityLog.length]);

  // Build tool start→result pairs for rendering
  const toolPairs = new Map<string, { start: ActivityToolStart; result?: ActivityToolResult }>();
  const renderItems: ActivityItem[] = [];
  // Track which tool_results have been paired
  const pairedResults = new Set<number>();

  // First pass: find tool results for each tool start
  activityLog.forEach((item, idx) => {
    if (item.kind === 'tool_start') {
      const key = `${item.toolName}_${idx}`;
      const pair: { start: ActivityToolStart; result?: ActivityToolResult } = { start: item };
      // Find matching result after this start
      for (let j = idx + 1; j < activityLog.length; j++) {
        if (activityLog[j].kind === 'tool_result' && (activityLog[j] as ActivityToolResult).toolName === item.toolName && !pairedResults.has(j)) {
          pair.result = activityLog[j] as ActivityToolResult;
          pairedResults.add(j);
          break;
        }
      }
      toolPairs.set(key, pair);
    }
  });

  // Second pass: build render list (skip standalone tool_results that were paired)
  activityLog.forEach((item, idx) => {
    if (item.kind === 'tool_result' && pairedResults.has(idx)) return;
    renderItems.push(item);
  });

  const isContentStreaming = phase === 'streaming' || (phase === 'done' && content);
  const showStopButton = phase === 'thinking' || phase === 'executing' || phase === 'streaming';

  // Counter for tool_start items to build unique keys
  let toolStartCount = 0;

  return (
    <div className="w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Activity Timeline */}
      <div className="ml-11 space-y-0">
        {renderItems.map((item, idx) => {
          const isLast = idx === renderItems.length - 1 && !isContentStreaming;

          switch (item.kind) {
            case 'thinking':
              return (
                <ThinkingBlock
                  key={`thinking_${idx}`}
                  item={item}
                  isDarkMode={isDarkMode}
                  isLast={isLast && !isContentStreaming}
                />
              );

            case 'tool_start': {
              const key = `${item.toolName}_${toolStartCount}`;
              toolStartCount++;
              const pair = Array.from(toolPairs.values()).find(
                p => p.start.toolName === item.toolName && p.start.startedAt === item.startedAt
              );
              return (
                <ToolStartRow
                  key={`tool_${key}`}
                  item={item}
                  result={pair?.result}
                  isDarkMode={isDarkMode}
                />
              );
            }

            case 'search_sources':
              return (
                <div key={`sources_${idx}`} className="mb-3">
                  <SearchSourceCards 
                    sources={item.sources} 
                    isDarkMode={isDarkMode} 
                    onViewSources={onViewSources}
                  />
                </div>
              );

            case 'content_start':
              // Visual separator: content begins
              return null;

            case 'tool_result':
              // Standalone result (not paired) — render as a minimal status line
              return (
                <div key={`result_${idx}`} className={`flex items-center space-x-2 py-1.5 px-3 mb-1 rounded-lg text-xs
                  ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {item.success ? <CheckCircle2 size={10} className="text-emerald-500" /> : <XCircle size={10} className="text-red-400" />}
                  <span>{item.summary}</span>
                  {item.elapsedMs > 0 && <span className="opacity-50">· {(item.elapsedMs / 1000).toFixed(1)}s</span>}
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Streaming Content */}
      {content && !hideContent && (
        <div className="flex items-start space-x-3 mt-2">
          <div className="w-8 h-8 mt-1 bg-gradient-to-br from-primary-500 to-secondary-900 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg relative">
            <Zap size={14} className="text-white relative z-10" />
            {phase === 'streaming' && (
              <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse" />
            )}
          </div>

          <div className={`flex-1 px-5 py-3.5 rounded-2xl border shadow-sm prose prose-sm max-w-none transition-all duration-300
            ${isDarkMode
              ? 'bg-gray-800/90 border-gray-700/50 text-gray-200 prose-invert'
              : 'bg-white border-gray-100 text-gray-800'
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={createMarkdownComponents(isDarkMode)}
            >
              {content}
            </ReactMarkdown>

            {/* Blinking cursor */}
            {phase === 'streaming' && (
              <span className="inline-block w-2 h-4 ml-0.5 -mb-0.5 bg-indigo-500 animate-pulse rounded-sm" />
            )}
          </div>
        </div>
      )}

      {/* Initial loading state (before any activity arrives) */}
      {activityLog.length === 0 && !content && phase === 'thinking' && (
        <div className="ml-11 flex items-center space-x-3 py-3">
          <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
            <Loader2 size={16} className="text-indigo-500 animate-spin" />
          </div>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Processing...
          </span>
        </div>
      )}

      {/* Error display */}
      {streamState.error && (
        <div className={`ml-11 mt-3 px-4 py-3 rounded-xl border text-sm
          ${isDarkMode
            ? 'bg-red-500/10 border-red-500/20 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <XCircle size={14} />
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1 text-xs opacity-80">{streamState.error}</p>
        </div>
      )}

      {/* Stop Button */}
      {showStopButton && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onCancel}
            className={`flex items-center space-x-2 px-5 py-2 rounded-full border transition-all duration-200
              hover:scale-[1.03] active:scale-[0.97]
              ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
              }`}
          >
            <Square size={12} className="fill-current" />
            <span className="text-xs font-semibold">Stop generating</span>
          </button>
        </div>
      )}

      <div ref={contentEndRef} />
    </div>
  );
};

export default StreamingActivityLog;
