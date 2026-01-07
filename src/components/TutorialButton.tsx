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
    availablePages,
    isActive
  } = useTutorial();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Don't show button when not logged in or tutorial is active
  if (!user || isActive) return null;

  const pageLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    chat: 'Chat',
    workflows: 'Workflows',
    agents: 'Agents',
    connections: 'Connections',
    payments: 'Payments',
    activity: 'Activity',
    settings: 'Settings',
    profile: 'Profile',
  };

  const currentPageLabel = pageLabels[currentPage] || currentPage;
  const hasCompletedCurrentPage = hasCompletedPage(currentPage);

  return (
    <div className="fixed bottom-6 right-6 z-40" ref={menuRef}>
      {/* Menu */}
      {isMenuOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
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

          {/* Current Page Tutorial */}
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={() => {
                startPageTutorial();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">
                    {currentPageLabel} Tutorial
                  </p>
                  <p className="text-xs text-gray-600">
                    {hasCompletedCurrentPage ? 'Replay this page tutorial' : 'Learn this page'}
                  </p>
                </div>
              </div>
              {hasCompletedCurrentPage && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </button>
          </div>

          {/* Full Tutorial Option */}
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={() => {
                startTutorial();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">Full Tutorial</p>
                <p className="text-xs text-gray-600">
                  {isCompleted ? 'Replay complete tour' : 'Tour all features'}
                </p>
              </div>
            </button>
          </div>

          {/* Page List */}
          <div className="p-3 max-h-64 overflow-y-auto">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-1">
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
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{pageLabels[page] || page}</span>
                      {isCurrentPage && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
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
            ? 'bg-gray-100 text-gray-700'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
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
      {!hasCompletedCurrentPage && !isMenuOpen && (
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
        </span>
      )}
    </div>
  );
};

export default TutorialButton;
