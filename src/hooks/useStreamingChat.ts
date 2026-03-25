import { useState, useCallback, useRef } from 'react';
import { StreamEvent, ToolCall, SearchSource } from '../types';
import { apiService } from '../services/api';

export interface ThinkingStep {
  text: string;
  isComplete: boolean;
  timestamp: string;
}

export interface StreamingState {
  isStreaming: boolean;
  content: string;
  reasoningContent: string;
  activeArtifact: any | null;
  thinkingSteps: ThinkingStep[];
  activeTools: ToolCall[];
  searchSources: SearchSource[];
  error: string | null;
}

export function useStreamingChat() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    content: '',
    reasoningContent: '',
    activeArtifact: null,
    thinkingSteps: [],
    activeTools: [],
    searchSources: [],
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const resetState = useCallback(() => {
    setState({
      isStreaming: false,
      content: '',
      reasoningContent: '',
      activeArtifact: null,
      thinkingSteps: [],
      activeTools: [],
      searchSources: [],
      error: null,
    });
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setState(prev => ({ ...prev, isStreaming: false }));
    }
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
    
    // Reset state for new message
    resetState();
    setState(prev => ({ ...prev, isStreaming: true }));

    abortControllerRef.current = new AbortController();

    try {
      await apiService.sendMessageStream(
        conversationId,
        { 
          content, 
          provider,
          use_reasoning: useReasoning,
          use_search: useSearch 
        },
        (event: StreamEvent) => {
          setState(prev => {
            const newState = { ...prev };

            switch (event.type) {
              case 'thinking':
                // Mark previous step complete, add new one
                const newSteps = [...prev.thinkingSteps];
                if (newSteps.length > 0) {
                  newSteps[newSteps.length - 1].isComplete = true;
                }
                newSteps.push({
                  text: event.content || '',
                  isComplete: false,
                  timestamp: event.timestamp || new Date().toISOString()
                });
                newState.thinkingSteps = newSteps;
                break;

              case 'tool_start':
                newState.activeTools = [
                  ...prev.activeTools,
                  {
                    id: `tool_${Date.now()}_${Math.random()}`,
                    name: event.tool || '',
                    arguments: event.args || {}
                  }
                ];
                // Also add a thinking step for visual feedback
                const toolSteps = [...newState.thinkingSteps];
                if (toolSteps.length > 0) {
                  toolSteps[toolSteps.length - 1].isComplete = true;
                }
                toolSteps.push({
                  text: `Executing ${event.tool}...`,
                  isComplete: false,
                  timestamp: new Date().toISOString()
                });
                newState.thinkingSteps = toolSteps;
                break;

              case 'tool_result':
                newState.activeTools = prev.activeTools.map(tool => {
                  if (tool.name === event.tool && !tool.result) {
                    return {
                      ...tool,
                      success: event.success,
                      result: { summary: event.summary }
                    };
                  }
                  return tool;
                });
                break;

              case 'reasoning_delta':
                // Update reasoning text directly when streamed from the model
                newState.reasoningContent += (event.delta || '');
                break;

              case 'search_sources':
                // Populate search sources for DeepSeek-style source cards
                if (event.sources && event.sources.length > 0) {
                  newState.searchSources = [...prev.searchSources, ...event.sources];
                }
                break;

              case 'content_delta':
              case 'content':
                // Mark all thinking as complete once content starts flowing
                if (newState.thinkingSteps.length > 0) {
                  newState.thinkingSteps[newState.thinkingSteps.length - 1].isComplete = true;
                }
                if (event.type === 'content_delta') {
                  newState.content += event.delta;
                } else if (event.type === 'content') {
                  newState.content = event.content || '';
                }
                break;

              case 'error':
                newState.error = event.error || 'An error occurred during streaming';
                newState.isStreaming = false;
                break;

              case 'message_saved':
              case 'done':
                if (event.type === 'message_saved' && onSuccess) {
                  onSuccess(event.message_id);
                }
                
                if (event.type === 'done') {
                  // Final polish of state
                  if (newState.thinkingSteps.length > 0) {
                    newState.thinkingSteps[newState.thinkingSteps.length - 1].isComplete = true;
                  }
                  newState.isStreaming = false;
                }
                break;
            }

            return newState;
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
          isStreaming: false,
          error: err.message || 'Failed to connect to chat stream'
        }));
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [cancelStream, resetState]);

  return {
    ...state,
    sendStreamingMessage,
    cancelStream,
    resetState
  };
}
