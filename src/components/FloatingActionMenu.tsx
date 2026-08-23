import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  BookOpen,
  HelpCircle,
  X,
  MessageSquare,
  Sparkles,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTutorial } from '../hooks/useTutorial';
import AIAssistant from './AIAssistant';

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
  const {
    startTutorial,
    startPageTutorial,
    isActive: tutorialActive,
    hasCompletedPage,
    hasPageTutorial,
    currentPage,
  } = useTutorial();

  const [isOpen, setIsOpen] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // User preferences from localStorage
  const [showFloatingMenu, setShowFloatingMenu] = useState(() => localStorage.getItem('showFloatingMenu') !== 'false');
  const [showTutorials, setShowTutorials] = useState(() => localStorage.getItem('showTutorials') !== 'false');
  const [showAIAssistant, setShowAIAssistant] = useState(() => localStorage.getItem('showAIAssistant') !== 'false');
  const [showWhatsAppSupport, setShowWhatsAppSupport] = useState(() => localStorage.getItem('showWhatsAppSupport') !== 'false');

  // Listen for storage changes (from Settings page)
  useEffect(() => {
    const handleStorageChange = () => {
      setShowFloatingMenu(localStorage.getItem('showFloatingMenu') !== 'false');
      setShowTutorials(localStorage.getItem('showTutorials') !== 'false');
      setShowAIAssistant(localStorage.getItem('showAIAssistant') !== 'false');
      setShowWhatsAppSupport(localStorage.getItem('showWhatsAppSupport') !== 'false');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  // Listen for custom event to open assistant from anywhere
  useEffect(() => {
    const handleOpenAssistant = () => {
      setIsOpen(false);
      setShowAssistant(true);
    };
    window.addEventListener('open-ai-assistant', handleOpenAssistant);
    return () => window.removeEventListener('open-ai-assistant', handleOpenAssistant);
  }, []);

  // Don't show when: tutorial is active or user disabled via settings
  if (tutorialActive || !showFloatingMenu) return null;

  const pageLabels: Record<string, string> = {
    workspace: 'Workspace',
    unifiedInbox: 'Unified Inbox',
    unifiedTasks: 'Unified Tasks',
    unifiedCalendar: 'Unified Calendar',
    chat: 'Chat',
    workflows: 'Workflows',
    agents: 'Agents',
    codingAgent: 'Coding Agent',
    whatsapp: 'WhatsApp',
    connections: 'Connections',
    marketplace: 'Marketplace',
    favorites: 'Favorites',
    productivity: 'Productivity',
    payments: 'Payments',
    activity: 'Activity',
    settings: 'Settings',
    profile: 'Profile',
    creator: 'Creator Profile',
    mcptools: 'MCP Tools',
    pricing: 'Pricing',
    kra: 'KRA / GavaConnect',
    tiktok: 'TikTok Hub',
  };

  const currentPageLabel = pageLabels[currentPage] || 'This Page';
  const pageHasTutorial = hasPageTutorial(currentPage);
  const hasCompletedCurrentPage = pageHasTutorial && hasCompletedPage(currentPage);

  // Build menu items based on user preferences
  const menuItems: MenuItem[] = [
    // AI Assistant - only show if enabled
    ...(showAIAssistant ? [{
      id: 'assistant',
      icon: <Bot className="w-5 h-5" />,
      label: 'AI Assistant',
      description: 'Get help with anything',
      color: 'from-primary-500 to-secondary-900',
      onClick: () => {
        setIsOpen(false);
        setShowAssistant(true);
      },
      badge: 'AI',
    }] : []),
    ...(showWhatsAppSupport ? [{
      id: 'whatsapp-support',
      icon: <MessageCircle className="w-5 h-5" />,
      label: 'WhatsApp Support',
      description: 'Chat with our support team',
      color: 'from-primary-500 to-accent-400',
      onClick: () => {
        setIsOpen(false);
        window.open('https://wa.me/254797568564', '_blank');
      },
    }] : []),
    // Tutorial items - only show if logged in AND enabled in settings
    ...(user && showTutorials ? [
      ...(pageHasTutorial ? [{
        id: 'page-tutorial',
        icon: <BookOpen className="w-5 h-5" />,
        label: `${currentPageLabel} Tutorial`,
        description: hasCompletedCurrentPage ? 'Replay tutorial' : 'Learn this page',
        color: 'from-accent-400 to-primary-500',
        onClick: () => {
          setIsOpen(false);
          startPageTutorial();
        },
        badge: hasCompletedCurrentPage ? '✓' : 'New',
      }] : []),
      {
        id: 'full-tutorial',
        icon: <Sparkles className="w-5 h-5" />,
        label: 'Full Platform Tour',
        description: 'Explore all features',
        color: 'from-accent-500 to-accent-600',
        onClick: () => {
          setIsOpen(false);
          startTutorial();
        },
      },
    ] : []),
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 sm:bottom-20 sm:right-6 z-[60]" ref={menuRef}>
        {/* Backdrop when open */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Menu Items - Fan/Wheel Animation */}
        <div className={`absolute bottom-16 right-0 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-[calc(100vw-32px)] sm:w-80 shrink-0 right-0 origin-bottom-right">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-900">
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
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${item.badge === 'AI'
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                          : item.badge === '✓'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                            : 'bg-accent-100 text-secondary-900 dark:bg-accent-500/20 dark:text-accent-300'
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
          className={`relative p-4 rounded-full shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ${isOpen
            ? 'bg-gray-700 rotate-45'
            : 'bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-900'
            }`}
          aria-label="Help & Resources"
        >
          {/* Animated rings */}
          {!isOpen && (
            <>
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-900 animate-ping opacity-20" />
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-400 to-primary-500 animate-pulse opacity-30" />
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
        <AIAssistant embedded onClose={() => setShowAssistant(false)} />
      )}
    </>
  );
};

export default FloatingActionMenu;

