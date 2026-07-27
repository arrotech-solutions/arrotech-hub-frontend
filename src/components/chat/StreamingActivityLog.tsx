import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Square,
  Zap,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SearchSourceCards from './SearchSourceCards';
import ToolProposalCard from './ToolProposalCard';
import { createMarkdownComponents } from './CodeBlock';
import { stabilizeStreamingMarkdown, isNearBottom } from './streamingUtils';
import {
  StreamingState,
  ActivityItem,
  ActivityThinking,
  ActivityToolStart,
  ActivityToolResult,
} from '../../hooks/useStreamingChat';

const PLATFORM_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  purple: { accent: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  orange: { accent: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  blue: { accent: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  green: { accent: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  yellow: { accent: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  pink: { accent: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  gray: { accent: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
};

interface StreamingActivityLogProps {
  streamState: StreamingState;
  isDarkMode: boolean;
  onCancel: () => void;
  /** When true, content is already painted as a MessageItem — avoid duplicate text. */
  hideContent?: boolean;
  /** When true, activity timeline is already on the MessageItem — avoid duplicate tools. */
  hideActivity?: boolean;
  onViewSources?: (sources: any[]) => void;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

const ThinkingBlock: React.FC<{
  item: ActivityThinking;
  isDarkMode: boolean;
  isLast: boolean;
}> = ({ item, isDarkMode, isLast }) => {
  const [isOpen, setIsOpen] = useState(!item.isComplete);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item.isComplete && !isLast) {
      const timer = setTimeout(() => setIsOpen(false), 450);
      return () => clearTimeout(timer);
    }
    if (!item.isComplete) setIsOpen(true);
  }, [item.isComplete, isLast]);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [item.text, isOpen]);

  return (
    <div className="relative pl-5 mb-2">
      <div
        className={`absolute left-[5px] top-2 w-2 h-2 rounded-full ring-2
          ${!item.isComplete
            ? 'bg-indigo-400 ring-indigo-400/30 animate-pulse'
            : isDarkMode
              ? 'bg-indigo-500/60 ring-indigo-500/20'
              : 'bg-indigo-400 ring-indigo-200'
          }`}
      />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 py-1 text-left rounded-lg transition-colors
          ${isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'}`}
      >
        <Brain
          size={13}
          className={!item.isComplete ? 'text-indigo-400 animate-pulse' : isDarkMode ? 'text-indigo-400/70' : 'text-indigo-500'}
        />
        <span className={`text-[11px] font-medium tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {!item.isComplete ? 'Thinking' : 'Thought process'}
        </span>
        {isOpen
          ? <ChevronDown size={12} className="opacity-40" />
          : <ChevronRight size={12} className="opacity-40" />
        }
      </button>

      <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div
          ref={contentRef}
          className={`mt-1 pl-0.5 text-[12px] leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-56 custom-scrollbar
            ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
        >
          {item.text || (!item.isComplete ? '…' : '')}
          {!item.isComplete && (
            <span className="inline-block w-1 h-3 ml-0.5 align-middle bg-indigo-400/80 animate-pulse rounded-sm" />
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

  const [liveElapsed, setLiveElapsed] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setLiveElapsed(Date.now() - item.startedAt), 200);
    return () => clearInterval(interval);
  }, [isRunning, item.startedAt]);

  const hasArgs = item.args && Object.keys(item.args).length > 0;

  return (
    <div className="relative pl-5 mb-1.5">
      <div
        className={`absolute left-[5px] top-2.5 w-2 h-2 rounded-full
          ${isRunning
            ? 'bg-amber-400 animate-pulse'
            : isSuccess
              ? 'bg-emerald-500'
              : 'bg-red-400'
          }`}
      />
      <div
        className={`rounded-lg border px-3 py-2 transition-colors duration-200
          ${isDarkMode
            ? `bg-gray-900/40 ${isRunning ? 'border-gray-700/60' : 'border-gray-800'}`
            : `bg-white/70 ${isRunning ? 'border-gray-200' : 'border-gray-100'}`
          }`}
      >
        <div
          className={`flex items-center gap-2.5 ${hasArgs ? 'cursor-pointer' : ''}`}
          onClick={() => hasArgs && setShowArgs(!showArgs)}
        >
          <div className={`flex items-center justify-center w-6 h-6 rounded-md border flex-shrink-0 ${colors.bg} ${colors.border}`}>
            {item.platformIcon
              ? <span className="text-xs leading-none">{item.platformIcon}</span>
              : <Zap size={11} className={colors.accent} />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {item.displayName}
              </span>
              {item.platform && item.platform !== 'Built-in' && (
                <span className={`text-[10px] ${colors.accent}`}>{item.platform}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isRunning ? (
                <>
                  <Loader2 size={10} className="text-amber-400 animate-spin" />
                  <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Running{liveElapsed > 800 ? ` · ${(liveElapsed / 1000).toFixed(1)}s` : '…'}
                  </span>
                </>
              ) : (
                <>
                  {isSuccess
                    ? <CheckCircle2 size={10} className="text-emerald-500" />
                    : <XCircle size={10} className="text-red-400" />
                  }
                  <span className={`text-[10px] truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {result?.summary || (isSuccess ? 'Done' : 'Failed')}
                    {elapsed && <span className="opacity-60"> · {elapsed}</span>}
                  </span>
                </>
              )}
            </div>
            {item.reason && isRunning && (
              <p className={`text-[10px] mt-0.5 truncate ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                {item.reason}
              </p>
            )}
          </div>

          {hasArgs && (
            showArgs
              ? <ChevronDown size={12} className="opacity-40 flex-shrink-0" />
              : <ChevronRight size={12} className="opacity-40 flex-shrink-0" />
          )}
        </div>

        {showArgs && hasArgs && (
          <pre className={`mt-2 pt-2 border-t text-[10px] font-mono overflow-x-auto max-h-28 custom-scrollbar
            ${isDarkMode ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-500'}`}>
            {JSON.stringify(item.args, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

const StreamingActivityLog: React.FC<StreamingActivityLogProps> = ({
  streamState,
  isDarkMode,
  onCancel,
  hideContent = false,
  hideActivity = false,
  onViewSources,
  scrollContainerRef,
}) => {
  const { phase, activityLog, content, statusLabel } = streamState;
  const contentEndRef = useRef<HTMLDivElement>(null);
  const userPinnedRef = useRef(true);
  const markdownComponents = useMemo(() => createMarkdownComponents(isDarkMode), [isDarkMode]);
  const stableContent = useMemo(
    () => (phase === 'streaming' ? stabilizeStreamingMarkdown(content) : content),
    [content, phase],
  );

  // Track whether user is following the stream (near bottom)
  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el) return;
    const onScroll = () => {
      userPinnedRef.current = isNearBottom(el, 140);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollContainerRef]);

  useEffect(() => {
    if (!userPinnedRef.current) return;
    const el = scrollContainerRef?.current;
    if (el && isNearBottom(el, 180)) {
      contentEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    } else if (!scrollContainerRef?.current) {
      contentEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [content.length, activityLog.length, phase, scrollContainerRef]);

  const toolPairs = new Map<string, { start: ActivityToolStart; result?: ActivityToolResult }>();
  const renderItems: ActivityItem[] = [];
  const pairedResults = new Set<number>();

  activityLog.forEach((item, idx) => {
    if (item.kind === 'tool_start') {
      const pair: { start: ActivityToolStart; result?: ActivityToolResult } = { start: item };
      for (let j = idx + 1; j < activityLog.length; j++) {
        if (
          activityLog[j].kind === 'tool_result' &&
          (activityLog[j] as ActivityToolResult).toolName === item.toolName &&
          !pairedResults.has(j)
        ) {
          pair.result = activityLog[j] as ActivityToolResult;
          pairedResults.add(j);
          break;
        }
      }
      toolPairs.set(`${item.toolName}_${idx}`, pair);
    }
  });

  activityLog.forEach((item, idx) => {
    if (item.kind === 'tool_result' && pairedResults.has(idx)) return;
    renderItems.push(item);
  });

  const isContentStreaming = phase === 'streaming';
  const showStopButton = phase === 'thinking' || phase === 'executing' || phase === 'streaming';
  const showStatusChip = phase !== 'idle' && phase !== 'done' && phase !== 'error';

  let toolStartCount = 0;

  if (hideContent && hideActivity) {
    return null;
  }

  return (
    <div className="w-full mb-6">
      {/* Live status chip — Claude-style */}
      {showStatusChip && (
        <div className="flex items-center gap-2 mb-3 ml-11">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
            ${isDarkMode
              ? 'bg-gray-800/80 text-gray-300 border border-gray-700/60'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {phase === 'streaming' ? (
              <Sparkles size={11} className="text-indigo-400" />
            ) : (
              <Loader2 size={11} className="animate-spin text-indigo-400" />
            )}
            <span>{statusLabel || 'Working…'}</span>
          </div>
        </div>
      )}

      {/* Activity timeline with left rail */}
      {!hideActivity && (
        <div className="ml-11 relative">
          {renderItems.some((i) => i.kind !== 'content_start') && (
            <div
              className={`absolute left-[8px] top-2 bottom-2 w-px
                ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
              aria-hidden
            />
          )}

          <div className="space-y-0">
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
                    (p) => p.start.toolName === item.toolName && p.start.startedAt === item.startedAt
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

                case 'tool_propose':
                  return (
                    <div key={`propose_${idx}`} className="relative pl-5 mb-3">
                      <div className="absolute left-[5px] top-4 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
                      <ToolProposalCard
                        proposalId={item.proposalId}
                        summary={item.summary}
                        toolName={item.toolName}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  );

                case 'search_sources':
                  return (
                    <div key={`sources_${idx}`} className="pl-5 mb-3">
                      <SearchSourceCards
                        sources={item.sources}
                        isDarkMode={isDarkMode}
                        onViewSources={onViewSources}
                      />
                    </div>
                  );

                case 'content_start':
                  return null;

                case 'tool_result':
                  return (
                    <div
                      key={`result_${idx}`}
                      className={`relative pl-5 flex items-center gap-2 py-1 text-[11px]
                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                    >
                      <div className={`absolute left-[5px] top-2 w-2 h-2 rounded-full ${item.success ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      {item.success ? <CheckCircle2 size={10} className="text-emerald-500" /> : <XCircle size={10} className="text-red-400" />}
                      <span className="truncate">{item.summary}</span>
                      {item.elapsedMs > 0 && (
                        <span className="opacity-50 flex-shrink-0">· {(item.elapsedMs / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      )}

      {/* Streaming response — matches MessageItem assistant bubble for seamless handoff */}
      {content && !hideContent && (
        <div className="flex items-start mt-3 max-w-[85%] lg:max-w-[75%]">
          <div className="shrink-0 w-8 h-8 mr-3 rounded-lg flex items-center justify-center shadow-lg bg-gradient-to-br from-primary-400 to-accent-400 relative">
            <Zap size={14} className="text-white relative z-10" />
            {phase === 'streaming' && (
              <span className="absolute inset-0 rounded-lg bg-white/15 animate-pulse" />
            )}
          </div>

          <div
            className={`flex-1 relative px-5 py-3.5 rounded-2xl transition-shadow duration-300
              ${isDarkMode
                ? 'bg-gray-800/80 text-gray-200 border border-gray-700/50'
                : 'bg-white text-gray-800 border border-gray-100 shadow-sm'
              }`}
          >
            <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : 'prose-gray'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {stableContent || ''}
              </ReactMarkdown>
            </div>

            {phase === 'streaming' && (
              <span
                className="inline-block w-[2px] h-[1.05em] ml-0.5 -mb-0.5 align-text-bottom bg-indigo-500 animate-pulse rounded-[1px]"
                aria-hidden
              />
            )}
          </div>
        </div>
      )}

      {/* Initial idle pulse */}
      {activityLog.length === 0 && !content && phase === 'thinking' && (
        <div className="ml-11 flex items-center gap-3 py-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
          </div>
          <span className={`text-[12px] font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {statusLabel || 'Starting…'}
          </span>
        </div>
      )}

      {streamState.error && (
        <div
          className={`ml-11 mt-3 px-4 py-3 rounded-xl border text-sm
            ${isDarkMode
              ? 'bg-red-500/10 border-red-500/20 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <XCircle size={14} />
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1 text-xs opacity-80">{streamState.error}</p>
        </div>
      )}

      {showStopButton && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={onCancel}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-semibold transition-all
              hover:scale-[1.02] active:scale-[0.98]
              ${isDarkMode
                ? 'bg-gray-900/80 border-gray-700 text-gray-300 hover:bg-gray-800'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'
              }`}
          >
            <Square size={10} className="fill-current" />
            Stop generating
          </button>
        </div>
      )}

      <div ref={contentEndRef} />
    </div>
  );
};

export default StreamingActivityLog;
