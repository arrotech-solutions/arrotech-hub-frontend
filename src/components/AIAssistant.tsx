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
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import apiService from '../services/api';

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  prompt: string;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();

  // Get context-aware suggestions based on current page
  const getPageContext = useCallback((): string => {
    const path = location.pathname;
    if (path.includes('/unified') || path.includes('/dashboard')) return 'workspace';
    if (path.includes('/workflows')) return 'workflows';
    if (path.includes('/agents')) return 'agents';
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/connections')) return 'connections';
    if (path.includes('/marketplace')) return 'marketplace';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/templates')) return 'templates';
    return 'general';
  }, [location.pathname]);

  // Quick actions based on context
  const quickActions: Record<string, QuickAction[]> = {
    dashboard: [
      { icon: <Zap size={14} />, label: 'Show my stats', prompt: 'Show me a summary of my dashboard statistics' },
      { icon: <Lightbulb size={14} />, label: 'Optimization tips', prompt: 'Give me tips to optimize my workflow performance' },
      { icon: <HelpCircle size={14} />, label: 'Getting started', prompt: 'How do I get started with Mini-Hub?' },
    ],
    workflows: [
      { icon: <Zap size={14} />, label: 'Create workflow', prompt: 'Help me create a new workflow' },
      { icon: <Lightbulb size={14} />, label: 'Best practices', prompt: 'What are the best practices for creating workflows?' },
      { icon: <HelpCircle size={14} />, label: 'Workflow types', prompt: 'Explain the different types of workflows I can create' },
    ],
    agents: [
      { icon: <Zap size={14} />, label: 'Create agent', prompt: 'How do I create an autonomous agent?' },
      { icon: <Lightbulb size={14} />, label: 'Agent strategies', prompt: 'What strategies can I use for agents?' },
      { icon: <HelpCircle size={14} />, label: 'Monitor agents', prompt: 'How do I monitor my agent performance?' },
    ],
    connections: [
      { icon: <Zap size={14} />, label: 'Add connection', prompt: 'How do I add a new connection?' },
      { icon: <Lightbulb size={14} />, label: 'Available integrations', prompt: 'What integrations are available?' },
      { icon: <HelpCircle size={14} />, label: 'Troubleshoot', prompt: 'Help me troubleshoot my connection issues' },
    ],
    marketplace: [
      { icon: <Zap size={14} />, label: 'Find workflows', prompt: 'Help me find workflows for my use case' },
      { icon: <Lightbulb size={14} />, label: 'Popular workflows', prompt: 'What are the most popular workflows?' },
      { icon: <HelpCircle size={14} />, label: 'Publish workflow', prompt: 'How do I publish my workflow to the marketplace?' },
    ],
    settings: [
      { icon: <Zap size={14} />, label: 'Security tips', prompt: 'Give me security recommendations for my account' },
      { icon: <Lightbulb size={14} />, label: 'API setup', prompt: 'How do I set up API access?' },
      { icon: <HelpCircle size={14} />, label: 'Notifications', prompt: 'How do I configure my notification preferences?' },
    ],
    general: [
      { icon: <Zap size={14} />, label: 'Quick start', prompt: 'Give me a quick tour of Mini-Hub features' },
      { icon: <Lightbulb size={14} />, label: 'Use cases', prompt: 'What are some common use cases for Mini-Hub?' },
      { icon: <HelpCircle size={14} />, label: 'Help', prompt: 'I need help getting started' },
    ],
    templates: [
      { icon: <Zap size={14} />, label: 'Browse templates', prompt: 'Show me available workflow templates' },
      { icon: <Lightbulb size={14} />, label: 'Template tips', prompt: 'How do I customize a template?' },
      { icon: <HelpCircle size={14} />, label: 'Create template', prompt: 'How do I create my own template?' },
    ],
    chat: [
      { icon: <Zap size={14} />, label: 'Chat features', prompt: 'What can I do in the chat?' },
      { icon: <Lightbulb size={14} />, label: 'Available tools', prompt: 'What tools are available in chat?' },
      { icon: <HelpCircle size={14} />, label: 'Export chat', prompt: 'How do I export my chat history?' },
    ],
  };

  const currentQuickActions = quickActions[getPageContext()] || quickActions.general;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize conversation
  const initConversation = async () => {
    try {
      const response = await apiService.createConversation({
        title: 'AI Assistant Chat',
      });
      if (response.success && response.data) {
        setConversationId(response.data.id);
        return response.data.id;
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
    return null;
  };

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent || isLoading) return;

    setShowQuickActions(false);
    setInputValue('');

    // Add user message
    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add typing indicator
    const typingMessage: AssistantMessage = {
      id: `typing-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMessage]);
    setIsLoading(true);

    try {
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        currentConversationId = await initConversation();
      }

      if (currentConversationId) {
        // Add context to the message
        const contextualPrompt = `[Context: User is on the ${getPageContext()} page of Mini-Hub]\n\n${messageContent}`;

        const response = await apiService.sendMessage(currentConversationId, {
          content: contextualPrompt,
        });

        // Remove typing indicator and add response
        setMessages((prev) => {
          const filtered = prev.filter((m) => !m.isTyping);
          return [
            ...filtered,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: response.content || 'I apologize, but I encountered an issue processing your request. Please try again.',
              timestamp: new Date(),
            },
          ];
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove typing indicator and add error message
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isTyping);
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: 'I apologize, but I encountered an error. Please try again or check your connection.',
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    setConversationId(null);
    setShowQuickActions(true);
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} className="font-bold text-base mt-3 mb-1">{line.slice(3)}</h3>;
        }
        // Lists
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        }
        if (/^\d+\. /.test(line)) {
          return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
        }
        // Code blocks
        if (line.startsWith('`') && line.endsWith('`')) {
          return <code key={i} className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-sm">{line.slice(1, -1)}</code>;
        }
        // Regular text
        if (line.trim()) {
          return <p key={i} className="mb-1">{line}</p>;
        }
        return <br key={i} />;
      });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${isOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
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

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${isExpanded
              ? 'bottom-4 right-4 left-4 top-4 md:left-auto md:w-[600px] md:h-[80vh]'
              : 'bottom-24 right-6 w-[380px] h-[520px]'
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Mini-Hub Assistant</h3>
                <p className="text-xs text-white/70">Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearChat}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Clear chat"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
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
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  How can I help you today?
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  I'm here to assist you with Mini-Hub. Ask me anything!
                </p>

                {/* Quick Actions */}
                {showQuickActions && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                      Quick Actions
                    </p>
                    {currentQuickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(action.prompt)}
                        className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                          {action.icon}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                >
                  {message.isTyping ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm leading-relaxed">
                        {formatMessage(message.content)}
                      </div>
                      {message.role === 'assistant' && (
                        <div className="flex items-center justify-end mt-2 space-x-2">
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
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
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {messages.length > 3 && (
            <button
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="absolute bottom-24 right-4 p-2 bg-white dark:bg-gray-700 shadow-lg rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything..."
                  rows={1}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500"
                  style={{ maxHeight: '120px' }}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;

