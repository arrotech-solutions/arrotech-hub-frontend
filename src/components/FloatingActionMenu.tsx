import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  BookOpen,
  HelpCircle,
  X,
  MessageSquare,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTutorial } from '../hooks/useTutorial';

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
  badge?: string;
}

const FloatingActionMenu: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { 
    startTutorial, 
    startPageTutorial, 
    isActive: tutorialActive,
    hasCompletedPage,
    currentPage,
  } = useTutorial();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard shortcut to open menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + / to toggle menu
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowAssistant(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Don't show when not logged in or tutorial is active
  if (!user || tutorialActive) return null;

  const pageLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    chat: 'Chat',
    workflows: 'Workflows',
    agents: 'Agents',
    connections: 'Connections',
    mcptools: 'MCP Tools',
    marketplace: 'Marketplace',
    templates: 'Templates',
    favorites: 'Favorites',
    payments: 'Payments',
    activity: 'Activity',
    settings: 'Settings',
    profile: 'Profile',
  };

  const currentPageLabel = pageLabels[currentPage] || 'This Page';
  const hasCompletedCurrentPage = hasCompletedPage(currentPage);

  const menuItems: MenuItem[] = [
    {
      id: 'assistant',
      icon: <Bot className="w-5 h-5" />,
      label: 'AI Assistant',
      description: 'Get help with anything',
      color: 'from-purple-500 to-blue-500',
      onClick: () => {
        setIsOpen(false);
        setShowAssistant(true);
      },
      badge: 'AI',
    },
    {
      id: 'page-tutorial',
      icon: <BookOpen className="w-5 h-5" />,
      label: `${currentPageLabel} Tutorial`,
      description: hasCompletedCurrentPage ? 'Replay tutorial' : 'Learn this page',
      color: 'from-blue-500 to-cyan-500',
      onClick: () => {
        setIsOpen(false);
        startPageTutorial();
      },
      badge: hasCompletedCurrentPage ? '✓' : 'New',
    },
    {
      id: 'full-tutorial',
      icon: <Sparkles className="w-5 h-5" />,
      label: 'Full Platform Tour',
      description: 'Explore all features',
      color: 'from-amber-500 to-orange-500',
      onClick: () => {
        setIsOpen(false);
        startTutorial();
      },
    },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50" ref={menuRef}>
        {/* Backdrop when open */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Menu Items - Fan/Wheel Animation */}
        <div className={`absolute bottom-16 right-0 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-80">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">Help & Resources</h3>
                    <p className="text-xs text-white/70">What do you need?</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-1">
              {menuItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                          item.badge === 'AI' 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                            : item.badge === '✓'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">/</kbd> to toggle
              </p>
            </div>
          </div>
        </div>

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-4 rounded-full shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ${
            isOpen
              ? 'bg-gray-700 rotate-45'
              : 'bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500'
          }`}
          aria-label="Help & Resources"
        >
          {/* Animated rings */}
          {!isOpen && (
            <>
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 animate-ping opacity-20" />
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 animate-pulse opacity-30" />
            </>
          )}
          
          {/* Icon */}
          <div className={`relative transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <div className="relative">
                <MessageSquare className="w-6 h-6 text-white" />
                <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
              </div>
            )}
          </div>
        </button>

        {/* Notification dot */}
        {!hasCompletedCurrentPage && !isOpen && (
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border-2 border-white" />
          </span>
        )}
      </div>

      {/* AI Assistant Panel (shown when selected) */}
      {showAssistant && (
        <AIAssistantPanel onClose={() => setShowAssistant(false)} />
      )}
    </>
  );
};

// Inline AI Assistant Panel Component
const AIAssistantPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  const getPageContext = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/workflows')) return 'workflows';
    if (path.includes('/agents')) return 'agents';
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/connections')) return 'connections';
    if (path.includes('/marketplace')) return 'marketplace';
    if (path.includes('/settings')) return 'settings';
    return 'general';
  };

  const quickPrompts = [
    { label: 'How do I create a workflow?', icon: '🔧' },
    { label: 'Show me keyboard shortcuts', icon: '⌨️' },
    { label: 'What can I do here?', icon: '🤔' },
    { label: 'Help me get started', icon: '🚀' },
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const context = getPageContext();
      const response = {
        role: 'assistant',
        content: `I understand you're asking about "${input}" while on the ${context} page. I'm here to help! This is a demo response - in production, I'd connect to your AI backend to provide real assistance.`,
      };
      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-white/70">Ask me anything</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              How can I help you today?
            </p>
            <div className="space-y-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInput(prompt.label);
                    handleSend();
                  }}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>{prompt.icon}</span>
                  <span className="text-gray-700 dark:text-gray-300">{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-800 dark:text-gray-200"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingActionMenu;

