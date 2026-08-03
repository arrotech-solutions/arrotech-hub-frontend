import { useState, useCallback, useRef } from 'react';
import { StreamEvent, SearchSource, ToolContextEvent } from '../types';
import { apiService } from '../services/api';
import { streamStatusLabel } from '../components/chat/streamingUtils';

// ─── Activity Log Model ────────────────────────────────────────────────────

export type StreamPhase = 'idle' | 'thinking' | 'executing' | 'streaming' | 'done' | 'error';

export interface ActivityThinking {
  kind: 'thinking';
  text: string;
  isComplete: boolean;
  timestamp: string;
}

export interface ActivityToolStart {
  kind: 'tool_start';
  toolName: string;
  displayName: string;
  args: Record<string, any>;
  startedAt: number;
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
  pendingConfirmation?: boolean;
  proposalId?: string;
}

export interface ActivityProposal {
  kind: 'tool_propose';
  proposalId: string;
  toolName: string;
  summary: string;
  arguments?: Record<string, any>;
}

export interface ActivitySearchSources {
  kind: 'search_sources';
  sources: SearchSource[];
}

export interface ActivityContentStart {
  kind: 'content_start';
}

export type ActivityItem =
  | ActivityThinking
  | ActivityToolStart
  | ActivityToolResult
  | ActivityProposal
  | ActivitySearchSources
  | ActivityContentStart;

export interface StreamingState {
  phase: StreamPhase;
  activityLog: ActivityItem[];
  content: string;
  reasoningContent: string;
  error: string | null;
  activeArtifact: any | null;
  sources: SearchSource[];
  toolContexts: Record<string, ToolContextEvent>;
  lastMessageId?: number | string;
  finalToolsCalled?: any[];
  /** Human-readable status for the live chip (Thinking / Working / Writing). */
  statusLabel: string;
}

export type StreamSnapshot = StreamingState;

const INITIAL_STATE: StreamingState = {
  phase: 'idle',
  activityLog: [],
  content: '',
  reasoningContent: '',
  error: null,
  activeArtifact: null,
  sources: [],
  toolContexts: {},
  statusLabel: '',
};

function withStatus(state: StreamingState): StreamingState {
  return {
    ...state,
    statusLabel: streamStatusLabel(state.phase, state.activityLog.length),
  };
}

function applyStreamEvent(
  prev: StreamingState,
  event: StreamEvent,
  toolStartTimes: Record<string, number>,
  contentStartedRef: { current: boolean },
  onSuccess?: (messageId?: number | string) => void,
): StreamingState {
  const next: StreamingState = { ...prev };
  const log = [...prev.activityLog];

  switch (event.type) {
    case 'thinking': {
      next.phase = 'thinking';
      const lastThinking = log.length > 0 && log[log.length - 1].kind === 'thinking'
        ? (log[log.length - 1] as ActivityThinking)
        : null;

      if (lastThinking) {
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

    case 'reasoning_delta': {
      next.phase = 'thinking';
      next.reasoningContent = prev.reasoningContent + (event.delta || '');

      const lastItem = log.length > 0 ? log[log.length - 1] : null;
      if (lastItem && lastItem.kind === 'thinking') {
        log[log.length - 1] = {
          ...(lastItem as ActivityThinking),
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

    case 'tool_start': {
      next.phase = 'executing';
      const toolName = event.tool || '';
      const startTime = Date.now();
      toolStartTimes[toolName] = startTime;

      const lastTh =
        log.length > 0 && log[log.length - 1].kind === 'thinking'
          ? (log[log.length - 1] as ActivityThinking)
          : null;
      if (lastTh && !lastTh.isComplete) {
        log[log.length - 1] = { ...lastTh, isComplete: true };
      }

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

    case 'tool.propose': {
      log.push({
        kind: 'tool_propose',
        proposalId: event.proposal_id || '',
        toolName: event.tool || '',
        summary: event.summary || 'Confirm this action',
        arguments: event.arguments || {},
      });
      break;
    }

    case 'tool_result': {
      const toolName = event.tool || '';
      const startTime = toolStartTimes[toolName] || Date.now();
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
        pendingConfirmation: Boolean(event.pending_confirmation),
        proposalId: event.proposal_id,
      });
      break;
    }

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

    case 'content_delta':
    case 'content': {
      if (!contentStartedRef.current) {
        contentStartedRef.current = true;
        next.phase = 'streaming';

        for (let i = log.length - 1; i >= 0; i--) {
          if (log[i].kind === 'thinking' && !(log[i] as ActivityThinking).isComplete) {
            log[i] = { ...(log[i] as ActivityThinking), isComplete: true };
            break;
          }
        }

        log.push({ kind: 'content_start' });
      } else if (next.phase !== 'done' && next.phase !== 'error') {
        next.phase = 'streaming';
      }

      if (event.type === 'content_delta') {
        next.content = prev.content + (event.delta || '');
      } else {
        const full = event.content || '';
        if (!prev.content || full.length >= prev.content.length) {
          next.content = full;
        }
      }
      break;
    }

    case 'error': {
      next.error = event.error || 'An error occurred during streaming';
      next.phase = 'error';
      break;
    }

    case 'message_saved': {
      next.lastMessageId = event.message_id;
      if (onSuccess) onSuccess(event.message_id);
      break;
    }

    case 'done': {
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
  return withStatus(next);
}

function isHighFrequencyEvent(type: string): boolean {
  return type === 'content_delta' || type === 'reasoning_delta' || type === 'thinking';
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useStreamingChat() {
  const [state, setState] = useState<StreamingState>({ ...INITIAL_STATE });
  const abortControllerRef = useRef<AbortController | null>(null);
  const toolStartTimes = useRef<Record<string, number>>({});
  const snapshotRef = useRef<StreamingState>({ ...INITIAL_STATE });
  const rafRef = useRef<number | null>(null);
  const paintScheduledRef = useRef(false);

  const cancelScheduledPaint = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    paintScheduledRef.current = false;
  }, []);

  const paintNow = useCallback(() => {
    cancelScheduledPaint();
    setState({ ...snapshotRef.current });
  }, [cancelScheduledPaint]);

  const schedulePaint = useCallback(() => {
    if (paintScheduledRef.current) return;
    paintScheduledRef.current = true;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      paintScheduledRef.current = false;
      setState({ ...snapshotRef.current });
    });
  }, []);

  const resetState = useCallback(() => {
    cancelScheduledPaint();
    snapshotRef.current = { ...INITIAL_STATE };
    setState({ ...INITIAL_STATE });
    toolStartTimes.current = {};
  }, [cancelScheduledPaint]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      snapshotRef.current = withStatus({
        ...snapshotRef.current,
        phase: 'error',
        error: 'Request cancelled',
      });
      paintNow();
    }
  }, [paintNow]);

  const flushStreamState = useCallback(() => {
    cancelScheduledPaint();
    snapshotRef.current = { ...INITIAL_STATE };
    setState({ ...INITIAL_STATE });
    toolStartTimes.current = {};
  }, [cancelScheduledPaint]);

  const sendStreamingMessage = useCallback(async (
    conversationId: number | string,
    content: string,
    provider?: string,
    useReasoning?: boolean,
    useSearch?: boolean,
    onSuccess?: (messageId?: number | string) => void
  ): Promise<StreamSnapshot> => {
    cancelStream();
    cancelScheduledPaint();

    toolStartTimes.current = {};
    const initial = withStatus({
      ...INITIAL_STATE,
      phase: 'thinking',
    });
    snapshotRef.current = initial;
    setState(initial);

    abortControllerRef.current = new AbortController();
    const contentStartedRef = { current: false };

    const currentTime = new Date().toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      await apiService.sendMessageStream(
        conversationId as any,
        {
          content,
          provider,
          use_reasoning: useReasoning,
          use_search: useSearch,
          current_time: currentTime,
          timezone: timezone,
        },
        (event: StreamEvent) => {
          const next = applyStreamEvent(
            snapshotRef.current,
            event,
            toolStartTimes.current,
            contentStartedRef,
            onSuccess,
          );
          snapshotRef.current = next;

          // Tools / propose / done: paint immediately.
          // Token deltas: coalesce to one React commit per animation frame (~60fps).
          if (isHighFrequencyEvent(event.type)) {
            schedulePaint();
          } else {
            paintNow();
          }
        },
        abortControllerRef.current.signal
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream cancelled by user');
      } else {
        console.error('Stream error:', err);
        const errored = withStatus({
          ...snapshotRef.current,
          phase: 'error',
          error: err.message || 'Failed to connect to chat stream',
        });
        snapshotRef.current = errored;
        paintNow();
      }
    } finally {
      abortControllerRef.current = null;
      // Ensure final frame is painted before returning snapshot
      cancelScheduledPaint();
      setState({ ...snapshotRef.current });
    }

    return { ...snapshotRef.current };
  }, [cancelStream, cancelScheduledPaint, schedulePaint, paintNow]);

  const isStreaming = state.phase !== 'idle' && state.phase !== 'error';
  const isDone = state.phase === 'done';

  return {
    streamState: state,
    isStreaming,
    isDone,
    content: state.content,
    reasoningContent: state.reasoningContent,
    activeArtifact: state.activeArtifact,
    sources: state.sources,
    error: state.error,
    sendStreamingMessage,
    cancelStream,
    resetState,
    flushStreamState,
    getStreamSnapshot: () => snapshotRef.current,
  };
}
