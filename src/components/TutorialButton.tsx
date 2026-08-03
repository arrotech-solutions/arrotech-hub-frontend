import { BookOpen, CheckCircle, ChevronUp, HelpCircle, Play, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTutorial } from '../hooks/useTutorial';

const TutorialButton: React.FC = () => {
  const { user } = useAuth();
  const {
    startTutorial,
    startPageTutorial,
    isCompleted,
    currentPage,
    hasCompletedPage,
    hasPageTutorial,
    availablePages,
    isActive
  } = useTutorial();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // User preference for tutorial guide visibility
  const [showTutorialGuide, setShowTutorialGuide] = useState(() => localStorage.getItem('showTutorialGuide') !== 'false');

  // Listen for storage changes (from Settings page)
  useEffect(() => {
    const handleStorageChange = () => {
      setShowTutorialGuide(localStorage.getItem('showTutorialGuide') !== 'false');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Don't show button when not logged in, tutorial is active, or user disabled it
  if (!user || isActive || !showTutorialGuide) return null;

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
    mcptools: 'MCP Tools',
    marketplace: 'Marketplace',
    favorites: 'Favorites',
    productivity: 'Productivity',
    payments: 'Payments',
    activity: 'Activity',
    settings: 'Settings',
    profile: 'Profile',
    creator: 'Creator Profile',
    pricing: 'Pricing',
    kra: 'KRA / GavaConnect',
    tiktok: 'TikTok Hub',
  };

  // Get the label for the current page with proper capitalization
  const pageHasTutorial = hasPageTutorial(currentPage);
  const currentPageLabel = pageLabels[currentPage] ||
    (currentPage ? currentPage.charAt(0).toUpperCase() + currentPage.slice(1) : 'This Page');
  const hasCompletedCurrentPage = pageHasTutorial && hasCompletedPage(currentPage);

  return (
    <div className="fixed bottom-6 right-6 z-40" ref={menuRef}>
      {/* Menu */}
      {isMenuOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-900 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold">Tutorial Guide</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Page Tutorial — only when this route has guided steps */}
          {pageHasTutorial && (
          <div className="p-3 border-b border-gray-100 dark:border-slate-800">
            <button
              onClick={() => {
                startPageTutorial();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {currentPageLabel} Tutorial
                  </p>
                  <p className="text-xs text-gray-600 dark:text-slate-400">
                    {hasCompletedCurrentPage ? 'Replay this page tutorial' : 'Learn this page'}
                  </p>
                </div>
              </div>
              {hasCompletedCurrentPage && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </button>
          </div>
          )}

          {/* Full Tutorial Option */}
          <div className="p-3 border-b border-gray-100 dark:border-slate-800">
            <button
              onClick={() => {
                startTutorial();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white text-sm">Full Tutorial</p>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  {isCompleted ? 'Replay complete tour' : 'Tour all features'}
                </p>
              </div>
            </button>
          </div>

          {/* Page List */}
          <div className="p-3 max-h-64 overflow-y-auto">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">
              All Pages
            </p>
            <div className="space-y-1">
              {availablePages.map((page) => {
                const isCurrentPage = page === currentPage;
                const isPageCompleted = hasCompletedPage(page);

                return (
                  <button
                    key={page}
                    onClick={() => {
                      startPageTutorial(page);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${isCurrentPage
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                      }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{pageLabels[page] || page}</span>
                      {isCurrentPage && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </span>
                    {isPageCompleted && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${isMenuOpen
          ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200'
          : 'bg-gradient-to-r from-primary-500 to-secondary-900 text-white'
          }`}
        title="Tutorial Guide"
      >
        {isMenuOpen ? (
          <ChevronUp className="w-6 h-6" />
        ) : (
          <HelpCircle className="w-6 h-6" />
        )}
      </button>

      {/* Pulse indicator for uncompleted current page */}
      {pageHasTutorial && !hasCompletedCurrentPage && !isMenuOpen && (
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
        </span>
      )}
    </div>
  );
};

export default TutorialButton;
