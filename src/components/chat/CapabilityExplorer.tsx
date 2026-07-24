import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronDown,
  Plug,
  Zap,
  Lock,
  Lightbulb,
  X,
  Search,
  Loader2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import apiService from '../../services/api';

// Types for the discovery response
interface ToolInfo {
  name: string;
  description: string;
}

interface ActiveCapability {
  platform: string;
  display_name: string;
  icon: string;
  color: string;
  category: string;
  capabilities: string[];
  tool_count: number;
  tools: ToolInfo[];
  status: string;
}

interface BuiltinCategory {
  category_key: string;
  label: string;
  tools: ToolInfo[];
}

interface UnlockableApp {
  platform: string;
  display_name: string;
  icon: string;
  color: string;
  category: string;
  description: string;
  capabilities: string[];
  status: string;
}

interface Suggestion {
  title: string;
  prompt: string;
  icon: string;
  platform: string;
}

interface DiscoverySummary {
  total_tools: number;
  total_connected_apps: number;
  total_builtin_tools: number;
  total_platform_tools: number;
  total_available_to_connect: number;
}

interface DiscoveryData {
  active_capabilities: ActiveCapability[];
  builtin_capabilities: BuiltinCategory[];
  available_to_unlock: UnlockableApp[];
  suggestions: Suggestion[];
  workflow_suggestions: string[];
  summary: DiscoverySummary;
  discovery_text: string;
}

interface CapabilityExplorerProps {
  isDarkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuggestionClick: (prompt: string) => void;
}

const CapabilityExplorer: React.FC<CapabilityExplorerProps> = ({
  isDarkMode,
  isOpen,
  onClose,
  onSuggestionClick,
}) => {
  const [data, setData] = useState<DiscoveryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['active', 'builtin'])
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && !data) {
      loadDiscovery();
    }
  }, [isOpen]);

  const loadDiscovery = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getToolDiscovery();
      if (response.success) {
        setData(response as unknown as DiscoveryData);
      } else {
        setError('Failed to load capabilities');
      }
    } catch (err) {
      setError('Failed to load capabilities');
      console.error('Discovery error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Filter based on search
  const filterCapabilities = (text: string): boolean => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 flex flex-col
          animate-in slide-in-from-right duration-300
          ${isDarkMode ? 'bg-gray-950 border-l border-gray-800' : 'bg-white border-l border-gray-200'}
          shadow-2xl`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-5 border-b shrink-0
          ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                What I Can Do
              </h2>
              {data?.summary && (
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {data.summary.total_tools} tools • {data.summary.total_connected_apps} connected
                  apps
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className={`px-6 py-3 border-b shrink-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition-colors
            ${isDarkMode ? 'bg-gray-900 border-gray-800 focus-within:border-indigo-500/50' : 'bg-gray-50 border-gray-200 focus-within:border-indigo-300'}`}
          >
            <Search size={14} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
            <input
              type="text"
              placeholder="Search capabilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 text-sm bg-transparent outline-none ${isDarkMode ? 'text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Loading capabilities...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                <X size={20} className="text-red-500" />
              </div>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {error}
              </p>
              <button
                onClick={loadDiscovery}
                className="px-4 py-2 text-xs font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <div className="px-6 py-4 space-y-6">
              {/* Summary Stats Bar */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Connected', value: data.summary.total_connected_apps, color: 'emerald' },
                  { label: 'Built-in', value: data.summary.total_builtin_tools, color: 'indigo' },
                  { label: 'Available', value: data.summary.total_available_to_connect, color: 'amber' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl p-3 text-center border transition-colors
                    ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`}
                  >
                    <div
                      className={`text-xl font-black ${
                        stat.color === 'emerald'
                          ? 'text-emerald-500'
                          : stat.color === 'indigo'
                            ? 'text-indigo-500'
                            : 'text-amber-500'
                      }`}
                    >
                      {stat.value}
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* 🟢 Active Integrations */}
              {data.active_capabilities.length > 0 && (
                <section>
                  <button
                    onClick={() => toggleSection('active')}
                    className={`w-full flex items-center justify-between py-2 group`}
                  >
                    <div className="flex items-center space-x-2">
                      <Plug size={14} className="text-emerald-500" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Active Integrations
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                        {data.active_capabilities.length}
                      </span>
                    </div>
                    {expandedSections.has('active') ? (
                      <ChevronDown size={14} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-500" />
                    )}
                  </button>

                  {expandedSections.has('active') && (
                    <div className="space-y-2 mt-2">
                      {data.active_capabilities
                        .filter((cap) => filterCapabilities(cap.display_name + ' ' + cap.capabilities.join(' ')))
                        .map((cap) => (
                          <div
                            key={cap.platform}
                            className={`rounded-xl border p-3 transition-all duration-200
                            ${isDarkMode ? 'bg-gray-900/50 border-gray-800 hover:border-emerald-500/30' : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-sm'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-base">{cap.icon}</span>
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {cap.display_name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                                  {cap.tool_count} tools
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                              </div>
                            </div>
                            <ul className="space-y-1">
                              {cap.capabilities.slice(0, 3).map((c, i) => (
                                <li key={i} className={`text-xs flex items-start space-x-1.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  <span className="mt-0.5 text-emerald-500/50">•</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  )}
                </section>
              )}

              {/* ⚡ Built-in Capabilities */}
              {data.builtin_capabilities.length > 0 && (
                <section>
                  <button
                    onClick={() => toggleSection('builtin')}
                    className={`w-full flex items-center justify-between py-2 group`}
                  >
                    <div className="flex items-center space-x-2">
                      <Zap size={14} className="text-indigo-500" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Built-in Tools
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold">
                        {data.summary.total_builtin_tools}
                      </span>
                    </div>
                    {expandedSections.has('builtin') ? (
                      <ChevronDown size={14} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-500" />
                    )}
                  </button>

                  {expandedSections.has('builtin') && (
                    <div className="space-y-2 mt-2">
                      {data.builtin_capabilities
                        .filter((cat) =>
                          filterCapabilities(cat.label + ' ' + cat.tools.map((t) => t.name + ' ' + t.description).join(' '))
                        )
                        .map((cat) => (
                          <div
                            key={cat.category_key}
                            className={`rounded-xl border overflow-hidden transition-all duration-200
                            ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-100'}`}
                          >
                            <button
                              onClick={() => toggleCategory(cat.category_key)}
                              className={`w-full flex items-center justify-between p-3 text-left transition-colors
                              ${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {cat.label}
                                </span>
                                <span className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {cat.tools.length} tools
                                </span>
                              </div>
                              {expandedCategories.has(cat.category_key) ? (
                                <ChevronDown size={12} className="text-gray-500" />
                              ) : (
                                <ChevronRight size={12} className="text-gray-500" />
                              )}
                            </button>

                            {expandedCategories.has(cat.category_key) && (
                              <div className={`px-3 pb-3 space-y-1.5 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                {cat.tools.map((tool) => (
                                  <button
                                    key={tool.name}
                                    onClick={() =>
                                      onSuggestionClick(
                                        `Use the ${tool.name.replace(/_/g, ' ')} tool`
                                      )
                                    }
                                    className={`w-full text-left p-2 rounded-lg flex items-start justify-between group transition-colors
                                    ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-semibold truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {tool.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                      </p>
                                      <p className={`text-[11px] line-clamp-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {tool.description}
                                      </p>
                                    </div>
                                    <ArrowRight
                                      size={12}
                                      className="mt-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 shrink-0"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </section>
              )}

              {/* 🔌 Available to Connect */}
              {data.available_to_unlock.length > 0 && (
                <section>
                  <button
                    onClick={() => toggleSection('unlock')}
                    className={`w-full flex items-center justify-between py-2 group`}
                  >
                    <div className="flex items-center space-x-2">
                      <Lock size={14} className="text-amber-500" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Available to Connect
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                        {data.available_to_unlock.length}
                      </span>
                    </div>
                    {expandedSections.has('unlock') ? (
                      <ChevronDown size={14} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-500" />
                    )}
                  </button>

                  {expandedSections.has('unlock') && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {data.available_to_unlock
                        .filter((app) => filterCapabilities(app.display_name + ' ' + app.description))
                        .map((app) => (
                          <div
                            key={app.platform}
                            className={`rounded-xl border p-3 transition-all duration-200 flex flex-col
                            ${isDarkMode ? 'bg-gray-900/50 border-gray-800 hover:border-amber-500/30' : 'bg-white border-gray-100 hover:border-amber-200 hover:shadow-sm'}`}
                          >
                            <div className="flex items-center space-x-2 mb-1.5">
                              <span className="text-sm">{app.icon}</span>
                              <span className={`text-xs font-bold truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {app.display_name}
                              </span>
                            </div>
                            <p className={`text-[10px] line-clamp-2 flex-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                              {app.description}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {expandedSections.has('unlock') && (
                    <p className={`text-[11px] mt-3 flex items-center space-x-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      <ExternalLink size={10} />
                      <span>
                        Connect apps in <strong>Settings → Connections</strong>
                      </span>
                    </p>
                  )}
                </section>
              )}

              {/* 💡 Workflow Suggestions */}
              {data.workflow_suggestions && data.workflow_suggestions.length > 0 && (
                <section>
                  <button
                    onClick={() => toggleSection('workflows')}
                    className={`w-full flex items-center justify-between py-2 group`}
                  >
                    <div className="flex items-center space-x-2">
                      <Lightbulb size={14} className="text-purple-500" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Workflow Ideas
                      </span>
                    </div>
                    {expandedSections.has('workflows') ? (
                      <ChevronDown size={14} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-500" />
                    )}
                  </button>

                  {expandedSections.has('workflows') && (
                    <div className="space-y-1.5 mt-2">
                      {data.workflow_suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => onSuggestionClick(suggestion)}
                          className={`w-full text-left p-3 rounded-xl border flex items-start justify-between group transition-all duration-200
                          ${isDarkMode
                            ? 'bg-gray-900/50 border-gray-800 hover:border-purple-500/30 hover:bg-gray-900'
                            : 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start space-x-2 flex-1 min-w-0">
                            <span className="text-purple-500 mt-0.5">💡</span>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {suggestion}
                            </span>
                          </div>
                          <ArrowRight
                            size={12}
                            className="mt-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500 shrink-0"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t shrink-0 ${isDarkMode ? 'border-gray-800 bg-gray-950/80' : 'border-gray-100 bg-gray-50/80'}`}
        >
          <button
            onClick={() => {
              onSuggestionClick('What can you do?');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-primary-500 to-secondary-900 text-white 
              hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-primary-500/20
              flex items-center justify-center space-x-2"
          >
            <Sparkles size={14} />
            <span>Ask in Chat</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default CapabilityExplorer;
