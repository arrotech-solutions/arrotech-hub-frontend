import { useState, useCallback, useRef } from 'react';
import { StreamEvent, ToolCall, SearchSource, ToolContextEvent } from '../types';
import { apiService } from '../services/api';

// ─── Activity Log Model ────────────────────────────────────────────────────
// Every streaming event becomes a sequential ActivityItem in a single array.
// The UI renders them top-to-bottom, producing a Claude Code-style timeline.

export type StreamPhase = 'idle' | 'thinking' | 'executing' | 'streaming' | 'done' | 'error';

export interface ActivityThinking {
  kind: 'thinking';
  text: string;            // Accumulated reasoning text
  isComplete: boolean;
  timestamp: string;
}

export interface ActivityToolStart {
  kind: 'tool_start';
  toolName: string;
  displayName: string;     // Human-readable name
  args: Record<string, any>;
  startedAt: number;       // Date.now() for elapsed calc
  platform?: string;
  platformIcon?: string;
  platformColor?: string;
  category?: string;
  reason?: string;
}

export interface ActivityToolResult {
  kind: 'tool_result';
  toolName: string;
  success: boolean;
  summary: string;
  elapsedMs: number;
  platform?: string;
  platformIcon?: string;
  platformColor?: string;
  category?: string;
}

export interface ActivitySearchSources {
  kind: 'search_sources';
  sources: SearchSource[];
}

export interface ActivityContentStart {
  kind: 'content_start';   // Marker: content streaming has begun
}

export type ActivityItem =
  | ActivityThinking
  | ActivityToolStart
  | ActivityToolResult
  | ActivitySearchSources
  | ActivityContentStart;

// ─── Streaming State ───────────────────────────────────────────────────────

export interface StreamingState {
  phase: StreamPhase;
  activityLog: ActivityItem[];
  content: string;
  reasoningContent: string;
  error: string | null;
  // Legacy compat: activeArtifact
  activeArtifact: any | null;
  sources: SearchSource[]; // Added this
  // Keep raw tool contexts for ToolInsightCard in historic messages
  toolContexts: Record<string, ToolContextEvent>;
  // Final metadata
  lastMessageId?: number;
  finalToolsCalled?: any[];
}

const INITIAL_STATE: StreamingState = {
  phase: 'idle',
  activityLog: [],
  content: '',
  reasoningContent: '',
  error: null,
  activeArtifact: null,
  sources: [], // Added this
  toolContexts: {},
};

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useStreamingChat() {
  const [state, setState] = useState<StreamingState>({ ...INITIAL_STATE });
  const abortControllerRef = useRef<AbortController | null>(null);
  // Track tool start times for elapsed-time calculation
  const toolStartTimes = useRef<Record<string, number>>({});

  const resetState = useCallback(() => {
    setState({ ...INITIAL_STATE });
    toolStartTimes.current = {};
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setState(prev => ({ ...prev, phase: 'done' }));
    }
  }, []);

  /**
   * Flush streaming state. Called by Chat.tsx after server messages are loaded
   * so the streamed content doesn't flash away before the real message appears.
   */
  const flushStreamState = useCallback(() => {
    setState({ ...INITIAL_STATE });
    toolStartTimes.current = {};
  }, []);

  const sendStreamingMessage = useCallback(async (
    conversationId: number,
    content: string,
    provider?: string,
    useReasoning?: boolean,
    useSearch?: boolean,
    onSuccess?: (messageId?: number) => void
  ) => {
    // Cancel any existing stream
    cancelStream();

    // Reset for new message
    toolStartTimes.current = {};
    setState({
      ...INITIAL_STATE,
      phase: 'thinking',
    });

    abortControllerRef.current = new AbortController();
    let contentStarted = false;

    // Get current local time and timezone
    const currentTime = new Date().toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      await apiService.sendMessageStream(
        conversationId,
        {
          content,
          provider,
          use_reasoning: useReasoning,
          use_search: useSearch,
          current_time: currentTime,
          timezone: timezone,
        },
        (event: StreamEvent) => {
          setState(prev => {
            const next = { ...prev };
            const log = [...prev.activityLog];

            switch (event.type) {
              // ── Thinking ──────────────────────────────────────────
              case 'thinking': {
                next.phase = 'thinking';
                // Find existing thinking item or create new
                const lastThinking = log.length > 0 && log[log.length - 1].kind === 'thinking'
                  ? log[log.length - 1] as ActivityThinking
                  : null;

                if (lastThinking) {
                  // Append to existing thinking block
                  log[log.length - 1] = {
                    ...lastThinking,
                    text: lastThinking.text + (event.content || ''),
                  };
                } else {
                  log.push({
                    kind: 'thinking',
                    text: event.content || '',
                    isComplete: false,
                    timestamp: event.timestamp || new Date().toISOString(),
                  });
                }
                break;
              }

              // ── Reasoning Delta (streamed reasoning from model) ───
              case 'reasoning_delta': {
                next.phase = 'thinking';
                next.reasoningContent = prev.reasoningContent + (event.delta || '');

                // Also update thinking activity item for the timeline
                const lastItem = log.length > 0 ? log[log.length - 1] : null;
                if (lastItem && lastItem.kind === 'thinking') {
                  log[log.length - 1] = {
                    ...lastItem as ActivityThinking,
                    text: (lastItem as ActivityThinking).text + (event.delta || ''),
                  };
                } else {
                  log.push({
                    kind: 'thinking',
                    text: event.delta || '',
                    isComplete: false,
                    timestamp: new Date().toISOString(),
                  });
                }
                break;
              }

              // ── Tool Context (why this tool was chosen) ───────────
              case 'tool_context': {
                const toolName = event.tool || '';
                next.toolContexts = {
                  ...prev.toolContexts,
                  [toolName]: {
                    tool: toolName,
                    platform: event.platform || 'Built-in',
                    platform_icon: event.platform_icon || '⚡',
                    platform_color: event.platform_color || 'gray',
                    category: event.category || 'general',
                    connection_status: event.connection_status || 'built-in',
                    reason: event.reason || `Using ${toolName}`,
                  },
                };
                break;
              }

              // ── Tool Start ────────────────────────────────────────
              case 'tool_start': {
                next.phase = 'executing';
                const toolName = event.tool || '';
                const startTime = Date.now();
                toolStartTimes.current[toolName] = startTime;

                // Close any open thinking block
                const lastTh = log.length > 0 && log[log.length - 1].kind === 'thinking'
                  ? log[log.length - 1] as ActivityThinking
                  : null;
                if (lastTh && !lastTh.isComplete) {
                  log[log.length - 1] = { ...lastTh, isComplete: true };
                }

                // Get context for this tool if available
                const ctx = next.toolContexts[toolName];

                log.push({
                  kind: 'tool_start',
                  toolName,
                  displayName: toolName.replace(/_/g, ' '),
                  args: event.args || {},
                  startedAt: startTime,
                  platform: ctx?.platform,
                  platformIcon: ctx?.platform_icon,
                  platformColor: ctx?.platform_color,
                  category: ctx?.category,
                  reason: ctx?.reason,
                });
                break;
              }

              // ── Tool Result ───────────────────────────────────────
              case 'tool_result': {
                const toolName = event.tool || '';
                const startTime = toolStartTimes.current[toolName] || Date.now();
                const elapsed = Date.now() - startTime;

                const ctx = next.toolContexts[toolName];

                log.push({
                  kind: 'tool_result',
                  toolName,
                  success: event.success !== false,
                  summary: event.summary || `Completed ${toolName.replace(/_/g, ' ')}`,
                  elapsedMs: elapsed,
                  platform: ctx?.platform || event.platform,
                  platformIcon: ctx?.platform_icon || event.platform_icon,
                  platformColor: ctx?.platform_color || event.platform_color,
                  category: ctx?.category || event.category,
                });
                break;
              }

              // ── Search Sources ────────────────────────────────────
              case 'search_sources': {
                if (event.sources && event.sources.length > 0) {
                  next.sources = event.sources;
                  log.push({
                    kind: 'search_sources',
                    sources: event.sources,
                  });
                }
                break;
              }

              // ── Content ───────────────────────────────────────────
              case 'content_delta':
              case 'content': {
                // Mark start of content streaming
                if (!contentStarted) {
                  contentStarted = true;
                  next.phase = 'streaming';

                  // Close any open thinking block
                  for (let i = log.length - 1; i >= 0; i--) {
                    if (log[i].kind === 'thinking' && !(log[i] as ActivityThinking).isComplete) {
                      log[i] = { ...(log[i] as ActivityThinking), isComplete: true };
                      break;
                    }
                  }

                  log.push({ kind: 'content_start' });
                }

                if (event.type === 'content_delta') {
                  next.content = prev.content + (event.delta || '');
                } else {
                  next.content = event.content || '';
                }
                break;
              }

              // ── Error ─────────────────────────────────────────────
              case 'error': {
                next.error = event.error || 'An error occurred during streaming';
                next.phase = 'error';
                break;
              }

              // ── Done / Message Saved ──────────────────────────────
              case 'message_saved': {
                next.lastMessageId = event.message_id;
                if (onSuccess) onSuccess(event.message_id);
                break;
              }

              case 'done': {
                // Close any open thinking blocks
                for (let i = 0; i < log.length; i++) {
                  if (log[i].kind === 'thinking' && !(log[i] as ActivityThinking).isComplete) {
                    log[i] = { ...(log[i] as ActivityThinking), isComplete: true };
                  }
                }
                next.finalToolsCalled = event.tools_called;
                next.phase = 'done';
                break;
              }
            }

            next.activityLog = log;
            return next;
          });
        },
        abortControllerRef.current.signal
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream cancelled by user');
      } else {
        console.error('Stream error:', err);
        setState(prev => ({
          ...prev,
          phase: 'error',
          error: err.message || 'Failed to connect to chat stream',
        }));
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [cancelStream]);

  // ─── Computed booleans for backward compat ──────────────────────────────
  // isStreaming remains true until the state is explicitly flushed to 'idle'.
  // This prevents flickering during the transition from ghost state to real message state.
  const isStreaming = state.phase !== 'idle' && state.phase !== 'error';
  const isDone = state.phase === 'done';

  return {
    // Core state
    streamState: state,
    // Computed
    isStreaming,
    isDone,
    // Legacy compat (direct access)
    content: state.content,
    reasoningContent: state.reasoningContent,
    activeArtifact: state.activeArtifact,
    sources: state.sources,
    error: state.error,
    // Actions
    sendStreamingMessage,
    cancelStream,
    resetState,
    flushStreamState,
  };
}
