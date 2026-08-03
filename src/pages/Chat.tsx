import React, { useEffect, useRef, useState } from 'react';
import toast from '../lib/notify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { Conversation, ExtractedToolCall, LLMProviderResponse, Message } from '../types';
import WorkflowBuilderModal from '../components/WorkflowBuilderModal';
import AgentCreatorModal from '../components/AgentCreatorModal';

// Icons
import { Activity } from 'lucide-react';

// New Modular Components
import ChatSidebar from '../components/chat/ChatSidebar';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import ArtifactPanel from '../components/chat/ArtifactPanel';
import SourcesPanel from '../components/chat/SourcesPanel';
import CapabilityExplorer from '../components/chat/CapabilityExplorer';
import { useSubscription } from '../hooks/useSubscription';
import { useStreamingChat } from '../hooks/useStreamingChat';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { SearchSource } from '../types';

// TypeScript declarations for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const Chat: React.FC = () => {
  useAuth();
  const { usage, limits, tier, refreshUsage } = useSubscription();
  const navigate = useNavigate();

  // -- State --
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<LLMProviderResponse | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('ollama');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [messageVersions, setMessageVersions] = useState<{ [key: number]: Message[] }>({});
  const [currentVersion, setCurrentVersion] = useState<{ [key: number]: number }>({});

  const {
    streamState,
    isStreaming,
    content: streamingContent,
    activeArtifact,
    sources: streamingSources,
    error: streamError,
    sendStreamingMessage,
    cancelStream,
    flushStreamState,
  } = useStreamingChat();

  const [activeSources, setActiveSources] = useState<SearchSource[] | null>(null);
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);

  // Workflow & Agent State
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [showAgentCreator, setShowAgentCreator] = useState(false);
  const [extractedToolCalls, setExtractedToolCalls] = useState<ExtractedToolCall[]>([]);
  const [createdWorkflowId, setCreatedWorkflowId] = useState<number | null>(null);
  const [showCapabilityExplorer, setShowCapabilityExplorer] = useState(false);

  // Feature Toggles state
  const [useReasoning, setUseReasoning] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [responseMode, setResponseMode] = useState<'simple' | 'detailed'>(
    () => (localStorage.getItem('chat_response_mode') as 'simple' | 'detailed') || 'simple'
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Track the conversation ID we're streaming for (to prevent cross-conversation flush)
  const streamingConversationRef = useRef<number | null>(null);

  // -- Initialization & Effects --

  // Theme Management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const darkMode = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(darkMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Surface stream errors that were not already toasted at send-time
  useEffect(() => {
    if (streamError && streamError !== 'Request cancelled') {
      toast.error(streamError);
    }
  }, [streamError]);

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadConversations(),
        loadProviders(),
        loadTools()
      ]);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync Messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ── Seamless turn completion ──────────────────────────────────────────────
  // The isDone effect is removed in favor of direct finalization in sendMessage
  // to prevent flickering and unnecessary database re-fetches.

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => setIsRecording(true);

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
          setInputMessage(prev => prev + finalTranscript);
          toast.success('Voice input added!');
        }
      };

      recognitionInstance.onerror = () => setIsRecording(false);
      recognitionInstance.onend = () => setIsRecording(false);

      setRecognition(recognitionInstance);
    }
  }, []);

  // -- Handlers --

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await apiService.getConversations();
      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const response = await apiService.getMessages(conversationId);
      if (response.success) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await apiService.getLLMProviders();
      if (response.success) {
        setProviders(response.data);
        // Pick default: prefer backend default if available, then first available provider
        const backendDefault = response.data.default;
        const availableProviders = response.data.providers || [];
        const firstAvailable = response.data.all_providers?.find((p: any) => p.available)?.id;

        const defaultProvider =
          (availableProviders.includes(backendDefault) ? backendDefault : null) ||
          availableProviders[0] ||
          firstAvailable;
        setSelectedProvider(defaultProvider || 'ollama');
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      setSelectedProvider('ollama');
    }
  };

  const loadTools = async () => {
    try {
      // Warm discovery cache for Capability Explorer / welcome suggestions
      await apiService.getToolDiscovery();
    } catch (error) {
      console.error('Error loading tools:', error);
    }
  };

  const createNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    if (inputRef.current) inputRef.current.focus();
  };

  const deleteConversation = async (conversationId: number) => {
    try {
      await apiService.deleteConversation(conversationId);
      toast.success('Conversation deleted');
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversation?.id === conversationId) createNewConversation();
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  const updateConversationTitle = async (conversationId: number, title: string) => {
    try {
      const response = await apiService.updateConversation(conversationId, title);
      if (response.success) {
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title } : c));
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(prev => prev ? { ...prev, title } : null);
        }
      }
    } catch (error) {
      toast.error('Failed to update title');
    }
  };

  const sendMessage = async () => {
    if (selectedProvider && !isProviderAvailable(selectedProvider)) {
      toast.error(`Provider ${getProviderDisplayName(selectedProvider)} not available`);
      return;
    }

    if (usage?.ai_actions?.at_limit) {
      toast.error(`AI action limit reached for the ${tier} plan. Please upgrade to continue.`);
      navigate('/pricing');
      return;
    }

    setIsLoading(true);
    const messageContent = inputMessage.trim();
    setInputMessage('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      let conversationToUse = currentConversation;

      if (!conversationToUse) {
        const title = messageContent.length > 40 ? messageContent.substring(0, 40) + '...' : messageContent;
        const createResponse = await apiService.createConversation({ title });
        if (createResponse.success) {
          conversationToUse = createResponse.data;
          setCurrentConversation(conversationToUse);
          loadConversations();
        } else {
          throw new Error('Failed to create conversation');
        }
      }

      // Optimistically add the user message
      const tempUserMessage: Message = {
        id: Date.now(), // temporary ID
        conversation_id: conversationToUse!.id,
        role: 'user',
        content: messageContent,
        created_at: new Date().toISOString(),
        status: 'completed'
      };
      
      setMessages(prev => [...prev, tempUserMessage]);
      loadConversations();
      refreshUsage();

      // Track which conversation this stream belongs to
      streamingConversationRef.current = conversationToUse!.id;

      const finalState = await sendStreamingMessage(
        conversationToUse!.id,
        messageContent,
        selectedProvider,
        useReasoning,
        useSearch
      );

      // ── Seamless Handover ──
      // Snapshot is authoritative (not React state). Paint MessageItem first, then
      // flush the live stream on the next frames so there is no flicker / truncation.
      if (finalState.error) {
        toast.error(finalState.error);
        setIsLoading(false);
        streamingConversationRef.current = null;
        flushStreamState();
      } else if (
        finalState.content ||
        finalState.activityLog.length > 0 ||
        (finalState.finalToolsCalled && finalState.finalToolsCalled.length > 0)
      ) {
        const assistantMsg: Message = {
          id: (finalState.lastMessageId as any) || (Date.now() + 1),
          conversation_id: conversationToUse!.id,
          role: 'assistant',
          content: finalState.content || '',
          tools_called: finalState.finalToolsCalled,
          created_at: new Date().toISOString(),
          status: 'completed'
        };

        setMessages(prev => {
          if (prev.some(m => m.id === assistantMsg.id)) return prev;
          return [...prev, assistantMsg];
        });

        // Double-rAF: wait until MessageItem has committed, then drop the ghost stream.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            flushStreamState();
            setIsLoading(false);
            streamingConversationRef.current = null;
          });
        });
      } else {
        toast.error('No response received. Please try again.');
        setIsLoading(false);
        streamingConversationRef.current = null;
        flushStreamState();
      }

    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
      setInputMessage(messageContent);
      setIsLoading(false);
      streamingConversationRef.current = null;
    }
  };


  const resendEditedMessage = async () => {
    if (!editingMessage || !editingMessageText.trim()) return;

    try {
      const editedContent = editingMessageText.trim();
      setMessages(prev => prev.map(msg => msg.id === editingMessage ? { ...msg, content: editedContent } : msg));

      const currentResponse = messages.find(msg =>
        msg.role === 'assistant' && msg.id > editingMessage! &&
        !messages.some(m => m.role === 'user' && m.id > editingMessage! && m.id < msg.id)
      );

      if (currentResponse) {
        setMessageVersions(prev => ({
          ...prev,
          [editingMessage!]: [...(prev[editingMessage!] || []), currentResponse]
        }));
        const versionCount = (messageVersions[editingMessage!] || []).length + 1;
        setCurrentVersion(prev => ({ ...prev, [editingMessage!]: versionCount }));
      }

      setEditingMessage(null);
      setEditingMessageText('');

      setIsLoading(true);
      streamingConversationRef.current = currentConversation!.id;
      const finalState = await sendStreamingMessage(
        currentConversation!.id,
        editedContent,
        selectedProvider,
        useReasoning,
        useSearch
      );
      if (finalState.error) {
        toast.error(finalState.error);
      } else if (finalState.content || (finalState.finalToolsCalled && finalState.finalToolsCalled.length > 0)) {
        const assistantMsg: Message = {
          id: (finalState.lastMessageId as any) || (Date.now() + 1),
          conversation_id: currentConversation!.id,
          role: 'assistant',
          content: finalState.content || '',
          tools_called: finalState.finalToolsCalled,
          created_at: new Date().toISOString(),
          status: 'completed'
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        toast.error('No response received. Please try again.');
      }
      flushStreamState();
    } catch (error) {
      toast.error('Failed to resend message');
    } finally {
      setIsLoading(false);
      streamingConversationRef.current = null;
    }
  };

  // Helper getters
  const getProviderDisplayName = (pId: string) => {
    const names: any = { openai: 'GPT-4', gemini: 'Gemini Pro', ollama: 'Llama 3 (Local)', anthropic: 'Claude 3' };
    return names[pId] || pId;
  };

  const isProviderAvailable = (pId: string) => {
    return providers?.all_providers?.find(p => p.id === pId)?.available || false;
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
  };

  const handleOpenWorkflowBuilder = () => {
    const toolCalls: ExtractedToolCall[] = [];
    messages.forEach(msg => {
      if (msg.tools_called) {
        msg.tools_called.forEach(t => toolCalls.push({
          id: t.id || `call_${Math.random()}`,
          message_id: msg.id,
          tool_name: t.name,
          arguments: t.arguments || {},
          result: t.result || {},
          success: t.result?.success !== false,
          timestamp: msg.created_at
        }));
      }
    });

    if (toolCalls.length === 0) {
      toast.error('No tool executions found');
      return;
    }
    setExtractedToolCalls(toolCalls);
    setShowWorkflowBuilder(true);
  };

  // ── Keyboard Shortcuts ────────────────────────────────────────────────────
  useKeyboardShortcuts({
    onNewChat: createNewConversation,
    onToggleSidebar: () => setSidebarCollapsed(prev => !prev),
    onFocusInput: () => inputRef.current?.focus(),
    onCancelStream: cancelStream,
    onEditLastMessage: () => {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        setEditingMessage(lastUserMsg.id);
        setEditingMessageText(lastUserMsg.content);
      }
    },
    isStreaming,
    inputRef,
  });

  // -- Render --
  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500
      ${isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>

      {/* Mobile Backdrop */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar Component */}
      <ChatSidebar
        conversations={conversations}
        currentConversation={currentConversation}
        setCurrentConversation={setCurrentConversation}
        createNewConversation={createNewConversation}
        deleteConversation={deleteConversation}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        updateConversationTitle={updateConversationTitle}
        providers={providers}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        getProviderDisplayName={getProviderDisplayName}
        isProviderAvailable={isProviderAvailable}
        handleBackToDashboard={() => navigate('/unified')}
        hasToolCalls={messages.some(m => m.tools_called && m.tools_called.length > 0)}
        handleOpenWorkflowBuilder={handleOpenWorkflowBuilder}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header (Top Bar) */}
        <header className={`flex items-center justify-between px-4 md:px-6 py-4 border-b z-10
          ${isDarkMode ? 'bg-gray-950/50 border-gray-800' : 'bg-white/50 border-gray-100'}`}>
          <div className="flex items-center space-x-3 md:space-x-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg md:hidden ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <Activity size={20} className="text-indigo-500" />
            </button>
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className={`hidden md:flex p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <Activity size={20} className="text-indigo-500" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-black tracking-tight">
                {currentConversation?.title || 'New Intelligence'}
              </h2>
              <p className={`text-[10px] font-bold opacity-50 uppercase tracking-widest`}>
                {messages.length} messages • {getProviderDisplayName(selectedProvider)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">System Operational</span>
            </div>
          </div>
        </header>

        {/* Message List — now with unified streamState */}
        <MessageList
          messages={messages}
          isDarkMode={isDarkMode}
          isLoading={isLoading}
          streamState={streamState}
          isStreaming={isStreaming}
          onCancelStream={cancelStream}
          responseMode={responseMode}
          onResponseModeChange={(mode) => {
            setResponseMode(mode);
            localStorage.setItem('chat_response_mode', mode);
          }}
          currentConversation={currentConversation}
          messageVersions={messageVersions}
          currentVersion={currentVersion}
          switchVersion={(id, idx) => setCurrentVersion(prev => ({ ...prev, [id]: idx }))}
          formatTime={formatTime}
          editingMessageId={editingMessage}
          editingMessageText={editingMessageText}
          setEditingMessageText={setEditingMessageText}
          saveEditedMessage={() => setEditingMessage(null)}
          resendEditedMessage={resendEditedMessage}
          cancelEditingMessage={() => setEditingMessage(null)}
          startEditingMessage={(m) => { setEditingMessage(m.id); setEditingMessageText(m.content); }}
          messagesEndRef={messagesEndRef}
          setInputMessage={setInputMessage}
          onOpenCapabilityExplorer={() => setShowCapabilityExplorer(true)}
          onRegenerate={() => {
            // Find the last user message and re-send it
            const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
            if (lastUserMsg && currentConversation) {
              setInputMessage(lastUserMsg.content);
              // Trigger send on next tick after state update
              setTimeout(() => {
                const btn = document.querySelector('.chat-send-btn') as HTMLButtonElement;
                if (btn) btn.click();
              }, 50);
            }
          }}
          onViewSources={(sources) => {
            setActiveSources(sources);
            setShowSourcesPanel(true);
          }}
        />

        {/* Chat Input Area */}
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          sendMessage={sendMessage}
          isLoading={isLoading}
          isDarkMode={isDarkMode}
          isRecording={isRecording}
          toggleVoiceRecording={toggleVoiceRecording}
          inputRef={inputRef}
          autoResizeTextarea={autoResizeTextarea}
          handleKeyPress={handleKeyPress}
          selectedProvider={selectedProvider}
          getProviderDisplayName={getProviderDisplayName}
          isProviderAvailable={isProviderAvailable}
          usage={usage}
          limits={limits}
          useReasoning={useReasoning}
          setUseReasoning={setUseReasoning}
          useSearch={useSearch}
          setUseSearch={setUseSearch}
          onFilesSelected={(files) => {
            const names = files.map((f) => f.name).join(', ');
            const prompt =
              `Upload these file(s) to my Google Drive (create a sensible folder if needed): ${names}. ` +
              `Use google_workspace_drive. If Drive is not connected, tell me to connect Google Workspace.`;
            setInputMessage(inputMessage ? `${inputMessage}\n\n${prompt}` : prompt);
            toast.success(
              files.length === 1
                ? 'Added Drive upload prompt for 1 file'
                : `Added Drive upload prompt for ${files.length} files`
            );
          }}
        />
      </main>

      {/* Artifact Panel */}
      {activeArtifact && (
        <ArtifactPanel
          artifact={activeArtifact}
          isDarkMode={isDarkMode}
          onClose={() => { /* close logic */ }}
        />
      )}

      {/* Sources Sidebar */}
      {(showSourcesPanel || (isStreaming && streamingSources?.length > 0)) && (
        <SourcesPanel
          sources={showSourcesPanel && activeSources ? activeSources : streamingSources}
          isOpen={showSourcesPanel || (isStreaming && streamingSources?.length > 0)}
          onClose={() => {
            setShowSourcesPanel(false);
            setActiveSources(null);
          }}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Modals */}
      {showWorkflowBuilder && currentConversation && (
        <WorkflowBuilderModal
          open={showWorkflowBuilder}
          onClose={() => setShowWorkflowBuilder(false)}
          conversationId={currentConversation.id}
          toolCalls={extractedToolCalls}
          onWorkflowCreated={(w: any) => { setShowWorkflowBuilder(false); toast.success(`Workflow ${w.name} created!`); }}
          onCreateAgent={(wId: number) => { setShowWorkflowBuilder(false); setCreatedWorkflowId(wId); setShowAgentCreator(true); }}
        />
      )}

      {showAgentCreator && createdWorkflowId && (
        <AgentCreatorModal
          open={showAgentCreator}
          onClose={() => { setShowAgentCreator(false); setCreatedWorkflowId(null); }}
          workflowId={createdWorkflowId}
          onAgentCreated={() => { setShowAgentCreator(false); toast.success('Agent created!'); }}
        />
      )}

      {/* Capability Explorer Panel */}
      <CapabilityExplorer
        isDarkMode={isDarkMode}
        isOpen={showCapabilityExplorer}
        onClose={() => setShowCapabilityExplorer(false)}
        onSuggestionClick={(prompt) => {
          setInputMessage(prompt);
          setShowCapabilityExplorer(false);
          if (inputRef.current) inputRef.current.focus();
        }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}} />
    </div>
  );
};

export default Chat;