import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  X,
  Send,
  Minimize2,
  Maximize2,
  Sparkles,
  Loader2,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  Zap,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Compass,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import apiService from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  sources?: Array<{ title: string; score: number }>;
  suggestedFollowups?: string[];
  feedbackGiven?: 'up' | 'down' | null;
  userQuery?: string; // For feedback tracking
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  prompt: string;
}

interface CapabilityCategory {
  id: string;
  name: string;
  icon: string;
  tools: Array<{
    id: string;
    name: string;
    description: string;
    connected: boolean;
  }>;
}

interface AIAssistantProps {
  onClose?: () => void;
  embedded?: boolean; // When rendered inside FloatingActionMenu
}

// ─── Helper: Relative Time ───────────────────────────────────────────────────

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

// ─── Helper: Session ID ──────────────────────────────────────────────────────

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('assistant_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('assistant_session_id', sessionId);
  }
  return sessionId;
};

// ─── Helper: Persist Messages ────────────────────────────────────────────────

const STORAGE_KEY = 'arrotech_assistant_messages';

const loadPersistedMessages = (): AssistantMessage[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
};

const persistMessages = (messages: AssistantMessage[]) => {
  try {
    // Keep last 50 messages max
    const toStore = messages.filter(m => !m.isTyping).slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // Storage full — clear and retry
    localStorage.removeItem(STORAGE_KEY);
  }
};

// ─── Component ───────────────────────────────────────────────────────────────

const AIAssistant: React.FC<AIAssistantProps> = ({ onClose, embedded = false }) => {
  const [isOpen, setIsOpen] = useState(embedded);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>(() => loadPersistedMessages());
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(messages.length === 0);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [capabilities, setCapabilities] = useState<CapabilityCategory[]>([]);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();

  // ─── Page Context ────────────────────────────────────────────────────────────

  const getPageContext = useCallback((): string => {
    const path = location.pathname;
    if (path.includes('/unified') || path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/workflows')) return 'Workflows';
    if (path.includes('/agents')) return 'Agents';
    if (path.includes('/chat')) return 'Chat';
    if (path.includes('/connections')) return 'Connections';
    if (path.includes('/marketplace')) return 'Marketplace';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/templates')) return 'Templates';
    if (path === '/' || path.includes('/home')) return 'Home';
    return 'General';
  }, [location.pathname]);

  // ─── Context-Aware Quick Actions ─────────────────────────────────────────────

  const quickActions: Record<string, QuickAction[]> = {
    Home: [
      { icon: <Sparkles size={14} />, label: 'What is Arrotech Hub?', prompt: 'What is Arrotech Hub and what can it do for my business?' },
      { icon: <Zap size={14} />, label: 'Show integrations', prompt: 'What integrations and platforms does Arrotech Hub support?' },
      { icon: <Lightbulb size={14} />, label: 'How to get started', prompt: 'How do I get started with Arrotech Hub? Walk me through the onboarding steps.' },
    ],
    Dashboard: [
      { icon: <Zap size={14} />, label: 'Dashboard overview', prompt: 'How do I use the dashboard effectively?' },
      { icon: <Lightbulb size={14} />, label: 'Optimization tips', prompt: 'Give me tips to optimize my workflow performance' },
      { icon: <HelpCircle size={14} />, label: 'Analytics guide', prompt: 'How do I read and use my analytics data?' },
    ],
    Workflows: [
      { icon: <Zap size={14} />, label: 'Create workflow', prompt: 'How do I create a new workflow in Arrotech Hub?' },
      { icon: <Lightbulb size={14} />, label: 'Autoresponder setup', prompt: 'How do I set up an autoresponder workflow for WhatsApp or Instagram?' },
      { icon: <HelpCircle size={14} />, label: 'Workflow examples', prompt: 'Show me some example workflows I can create' },
    ],
    Connections: [
      { icon: <Zap size={14} />, label: 'Connect a platform', prompt: 'How do I connect a new platform like Slack or WhatsApp?' },
      { icon: <Lightbulb size={14} />, label: 'Available integrations', prompt: 'What integrations are available and how do they work?' },
      { icon: <HelpCircle size={14} />, label: 'Troubleshoot', prompt: 'My connection is not working. How do I troubleshoot it?' },
    ],
    Settings: [
      { icon: <Zap size={14} />, label: 'Security setup', prompt: 'How do I set up two-factor authentication and security settings?' },
      { icon: <Lightbulb size={14} />, label: 'API access', prompt: 'How do I generate and manage API keys?' },
      { icon: <HelpCircle size={14} />, label: 'Account settings', prompt: 'Walk me through the account settings options' },
    ],
    General: [
      { icon: <Sparkles size={14} />, label: 'What can you do?', prompt: 'What can you help me with?' },
      { icon: <Zap size={14} />, label: 'Quick start guide', prompt: 'Give me a quick start guide for Arrotech Hub' },
      { icon: <HelpCircle size={14} />, label: 'Contact support', prompt: 'How do I contact Arrotech support?' },
    ],
  };

  const currentQuickActions = quickActions[getPageContext()] || quickActions.General;

  // ─── Scroll Management ───────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    if (!userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [userScrolledUp]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setUserScrolledUp(!isAtBottom);
  }, []);

  // ─── Focus Input ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if ((isOpen || embedded) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, embedded]);

  // ─── Persist Messages ────────────────────────────────────────────────────────

  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  // ─── Load Capabilities ───────────────────────────────────────────────────────

  const loadCapabilities = async () => {
    if (capabilities.length > 0) {
      setShowCapabilities(true);
      return;
    }
    
    setCapabilitiesLoading(true);
    try {
      const result = await apiService.getAssistantCapabilities();
      if (result.success) {
        setCapabilities(result.data.categories);
      }
    } catch (error) {
      console.error('Failed to load capabilities:', error);
    } finally {
      setCapabilitiesLoading(false);
      setShowCapabilities(true);
    }
  };

  // ─── Send Message ────────────────────────────────────────────────────────────

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent || isLoading) return;

    setShowQuickActions(false);
    setShowCapabilities(false);
    setInputValue('');

    // Add user message
    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setUserScrolledUp(false);

    // Add typing indicator
    const typingMessage: AssistantMessage = {
      id: `typing-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);
    setIsLoading(true);

    try {
      // Build conversation history from persisted messages
      const history = messages
        .filter(m => !m.isTyping)
        .map(m => ({ role: m.role, content: m.content }));

      const result = await apiService.assistantChat(
        messageContent,
        history,
        getPageContext(),
        getSessionId()
      );

      // Remove typing indicator and add response
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isTyping);
        return [
          ...filtered,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant' as const,
            content: result.response,
            timestamp: new Date(),
            sources: result.sources,
            suggestedFollowups: result.suggested_followups,
            feedbackGiven: null,
            userQuery: messageContent,
          },
        ];
      });
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      let errorContent = 'I apologize, but I encountered an error. Please try again.';
      if (error?.response?.status === 429) {
        errorContent = error?.response?.data?.detail || 'You\'ve reached the message limit. Create a free account for unlimited access! 🚀';
      }
      
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isTyping);
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            role: 'assistant' as const,
            content: errorContent,
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Feedback ────────────────────────────────────────────────────────────────

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? { ...m, feedbackGiven: helpful ? 'up' : 'down' }
          : m
      )
    );

    const message = messages.find(m => m.id === messageId);
    if (message) {
      try {
        await apiService.submitAssistantFeedback(
          message.content,
          helpful,
          message.userQuery || ''
        );
      } catch (error) {
        console.error('Failed to submit feedback:', error);
      }
    }
  };

  // ─── Utilities ───────────────────────────────────────────────────────────────

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setShowQuickActions(true);
    setShowCapabilities(false);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsOpen(false);
    }
  };

  // ─── Markdown Formatter ──────────────────────────────────────────────────────

  const formatMessage = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{formatInline(line.slice(4))}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} className="font-bold text-base mt-3 mb-1">{formatInline(line.slice(3))}</h3>;
        }
        // Lists
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <li key={i} className="ml-4 list-disc">{formatInline(line.slice(2))}</li>;
        }
        if (/^\d+\. /.test(line)) {
          return <li key={i} className="ml-4 list-decimal">{formatInline(line.replace(/^\d+\. /, ''))}</li>;
        }
        // Code blocks
        if (line.startsWith('`') && line.endsWith('`')) {
          return <code key={i} className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">{line.slice(1, -1)}</code>;
        }
        // Regular text
        if (line.trim()) {
          return <p key={i} className="mb-1">{formatInline(line)}</p>;
        }
        return <br key={i} />;
      });
  };

  // Inline formatting: **bold**, *italic*, `code`
  const formatInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const chatPanel = (
    <div
      className={`${embedded
        ? 'fixed bottom-[80px] right-4 left-4 sm:left-auto sm:right-6 z-50 sm:w-[400px] h-[70vh] sm:h-[560px] max-h-[calc(100vh-100px)]'
        : isExpanded
          ? 'fixed z-50 bottom-4 right-4 left-4 top-4 md:left-auto md:right-6 md:bottom-6 md:w-[600px] md:h-[85vh]'
          : 'fixed z-50 bottom-[80px] right-4 left-4 sm:left-auto sm:right-6 sm:w-[400px] h-[70vh] sm:h-[560px] max-h-[calc(100vh-100px)]'
        } bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}
      style={{ animation: 'slideUp 0.3s ease-out' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Arrotech Assistant</h3>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <p className="text-xs text-white/70">Online • Powered by AI</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => loadCapabilities()}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Explore capabilities"
          >
            <Compass className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={clearChat}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="New conversation"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
          {!embedded && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4 text-white" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white" />
              )}
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Capabilities Panel */}
      {showCapabilities && (
        <div className="border-b border-gray-200 dark:border-gray-700 max-h-[280px] overflow-y-auto">
          <div className="p-3 bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-500" />
                Platform Capabilities
              </h4>
              <button
                onClick={() => setShowCapabilities(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>

            {capabilitiesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {capabilities.map(category => (
                  <div
                    key={category.id}
                    className="bg-white dark:bg-gray-700/50 rounded-xl p-2.5 border border-gray-100 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-sm">{category.icon}</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                        {category.name}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {category.tools.slice(0, 3).map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setShowCapabilities(false);
                            handleSendMessage(`Tell me about ${tool.name} integration`);
                          }}
                          className="w-full text-left flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors group"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tool.connected ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-500'}`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {tool.name}
                          </span>
                        </button>
                      ))}
                      {category.tools.length > 3 && (
                        <p className="text-xs text-gray-400 pl-1.5">+{category.tools.length - 3} more</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && !showCapabilities && (
          <div className="text-center py-6" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Hi there! 👋
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-[260px] mx-auto">
              I'm your Arrotech Hub assistant. Ask me about features, integrations, or how to get started.
            </p>

            {/* Quick Actions */}
            {showQuickActions && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                  Quick Actions
                </p>
                {currentQuickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(action.prompt)}
                    className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 text-left group"
                    style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1}s both` }}
                  >
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                      {action.icon}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {action.label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animation: 'slideUp 0.2s ease-out' }}
          >
            <div className={`max-w-[90%] sm:max-w-[85%] ${message.role === 'user' ? '' : 'space-y-2'}`}>
              <div
                className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                  ? 'bg-gradient-to-r from-secondary-800 to-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                {message.isTyping ? (
                  <div className="flex items-center space-x-1.5 py-1 px-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed">
                    {formatMessage(message.content)}
                  </div>
                )}
              </div>

              {/* Message Footer: Timestamp + Actions */}
              {!message.isTyping && (
                <div className={`flex items-center ${message.role === 'user' ? 'justify-end' : 'justify-between'} px-1 mt-1`}>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {getRelativeTime(message.timestamp)}
                  </div>
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-1">
                      {/* Feedback buttons */}
                      <button
                        onClick={() => handleFeedback(message.id, true)}
                        className={`p-1.5 sm:p-1 rounded transition-colors ${
                          message.feedbackGiven === 'up'
                            ? 'text-green-500 bg-green-50 dark:bg-green-900/30'
                            : 'text-gray-400 hover:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        title="Helpful"
                        disabled={!!message.feedbackGiven}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, false)}
                        className={`p-1.5 sm:p-1 rounded transition-colors ${
                          message.feedbackGiven === 'down'
                            ? 'text-red-500 bg-red-50 dark:bg-red-900/30'
                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        title="Not helpful"
                        disabled={!!message.feedbackGiven}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                      {/* Copy button */}
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="p-1.5 sm:p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Copy"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  {message.sources.map((source, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs"
                    >
                      📄 {source.title}
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Follow-ups */}
              {message.suggestedFollowups && message.suggestedFollowups.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {message.suggestedFollowups.map((followup, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(followup)}
                      className="w-full text-left px-3 py-2 text-xs bg-white dark:bg-gray-600/50 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      {followup}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {userScrolledUp && messages.length > 3 && (
        <button
          onClick={() => {
            setUserScrolledUp(false);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-24 right-4 p-2 bg-white dark:bg-gray-700 shadow-lg rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
        >
          <ChevronDown className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about Arrotech Hub..."
              rows={1}
              maxLength={2000}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 text-sm"
              style={{ maxHeight: '100px' }}
              disabled={isLoading}
            />
            {inputValue.length > 1800 && (
              <span className={`absolute right-2 bottom-1.5 text-xs ${inputValue.length >= 2000 ? 'text-red-500' : 'text-gray-400'}`}>
                {inputValue.length}/2000
              </span>
            )}
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-secondary-800 to-primary-500 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );

  // If embedded (from FloatingActionMenu), just render the panel directly
  if (embedded) {
    return chatPanel;
  }

  // Standalone mode with its own FAB
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${isOpen
          ? 'bg-gray-600 hover:bg-gray-700'
          : 'bg-gradient-to-r from-secondary-800 to-primary-500 hover:from-purple-700 hover:to-indigo-700'
        }`}
        aria-label="AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
        )}
      </button>

      {isOpen && chatPanel}

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default AIAssistant;
