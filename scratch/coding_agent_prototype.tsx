// In CodingAgent.tsx

// 1. New imports and state
import {
  // ...
  sendChatMessage, ChatMessage, ChatResponse
} from '../services/codingAgentApi';

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [pendingLLMMessages, setPendingLLMMessages] = useState<ChatMessage[]>([]); // To resume after approval

// 2. The LLM loop
  const processLLM = async (messages: ChatMessage[]) => {
    if (!session) return;
    setIsAgentThinking(true);
    try {
      const response = await sendChatMessage(session.session_id, messages);
      
      if (response.type === 'message' && response.content) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: response.content! }]);
      } else if (response.type === 'tool_calls' && response.calls) {
        const assistantMsg: ChatMessage = { 
          role: 'assistant', 
          content: '', 
          tool_calls: response.calls.map(c => ({
            id: c.id,
            type: 'function',
            function: { name: c.tool, arguments: JSON.stringify(c.args) }
          }))
        };
        
        setChatHistory(prev => [...prev, assistantMsg]);
        let nextMessages = [...messages, assistantMsg];
        let haltedForApproval = false;

        for (const call of response.calls) {
           const uiCallId = addToolCall(call.tool, call.args, 'running');
           try {
             const result = await executeTool(session.session_id, call.tool, call.args);
             if (result.requires_approval) {
               updateToolCall(uiCallId, { status: 'error', error: 'Waiting for approval', requires_approval: true, output: { _tool_call_id: call.id } });
               haltedForApproval = true;
               // Store the state so we can resume
               setPendingLLMMessages(nextMessages);
               break; 
             } else {
               updateToolCall(uiCallId, { status: result.success ? 'success' : 'error', output: result.output, error: result.error || undefined, duration_ms: result.duration_ms });
               nextMessages.push({
                 role: 'tool',
                 content: JSON.stringify(result.success ? result.output : { error: result.error }),
                 tool_call_id: call.id
               });
             }
           } catch (err: any) {
             updateToolCall(uiCallId, { status: 'error', error: err.message });
             nextMessages.push({
               role: 'tool',
               content: JSON.stringify({ error: err.message }),
               tool_call_id: call.id
             });
           }
        }

        if (!haltedForApproval) {
          setChatHistory(nextMessages);
          await processLLM(nextMessages); // Recurse
        }
      }
    } catch (err: any) {
      addToolCall('llm_error', {}, 'error', null, err.message);
    } finally {
      setIsAgentThinking(false);
    }
  };

// 3. handleChatSubmit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = chatInput.trim();
    if (!cmd || !session) return;
    setChatInput('');

    if (cmd.startsWith('/')) {
      // Keep slash commands for quick actions
      // ... existing slash command logic ...
      return;
    }

    const newMsg: ChatMessage = { role: 'user', content: cmd };
    const nextHistory = [...chatHistory, newMsg];
    setChatHistory(nextHistory);
    await processLLM(nextHistory);
  };

// 4. Update handleApproveTool
  const handleApproveTool = async (callId: string, toolName: string, args: Record<string, any>, llmToolCallId?: string) => {
    if (!session) return;
    updateToolCall(callId, { status: 'running', error: undefined, requires_approval: false });
    try {
      const result = await executeTool(session.session_id, toolName, args, true);
      updateToolCall(callId, {
        status: result.success ? 'success' : 'error',
        output: result.output,
        error: result.error || undefined,
        duration_ms: result.duration_ms,
        requires_approval: result.requires_approval
      });

      // Resume LLM if this was part of an LLM loop
      if (llmToolCallId && pendingLLMMessages.length > 0) {
        const toolMsg: ChatMessage = {
          role: 'tool',
          content: JSON.stringify(result.success ? result.output : { error: result.error }),
          tool_call_id: llmToolCallId
        };
        const nextMsgs = [...pendingLLMMessages, toolMsg];
        setPendingLLMMessages([]);
        setChatHistory(nextMsgs);
        await processLLM(nextMsgs);
      }

    } catch (err: any) {
      updateToolCall(callId, { status: 'error', error: err.message });
      // Resume with error
      if (llmToolCallId && pendingLLMMessages.length > 0) {
        const toolMsg: ChatMessage = {
          role: 'tool',
          content: JSON.stringify({ error: err.message }),
          tool_call_id: llmToolCallId
        };
        const nextMsgs = [...pendingLLMMessages, toolMsg];
        setPendingLLMMessages([]);
        setChatHistory(nextMsgs);
        await processLLM(nextMsgs);
      }
    }
  };

// 5. Render chatHistory
{chatHistory.map((msg, idx) => {
  if (msg.role === 'user') {
    return (
      <div key={`msg-${idx}`} className="flex justify-end mb-4">
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm max-w-[85%] text-sm shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  } else if (msg.role === 'assistant' && msg.content) {
    return (
      <div key={`msg-${idx}`} className="flex justify-start mb-4">
        <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm max-w-[85%] text-sm shadow-sm border border-slate-100 dark:border-slate-700">
          {msg.content}
        </div>
      </div>
    );
  }
  return null;
})}
