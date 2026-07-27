import React, { useState, useEffect, useCallback } from 'react';
import {
    Bot,
    ArrowDown,
    MessageCircle,
    Sparkles,
    ChevronRight,
    Target,
    BarChart3,
    Globe,
    MessageSquare,
    Plug,
    HelpCircle,
    Loader2,
    Zap
} from 'lucide-react';
import { Conversation, Message, SearchSource, ToolContextEvent } from '../../types';
import MessageItem from './MessageItem';
import StreamingActivityLog from './StreamingActivityLog';
import apiService from '../../services/api';

import { StreamingState } from '../../hooks/useStreamingChat';

interface MessageListProps {
    messages: Message[];
    isDarkMode: boolean;
    isLoading: boolean;
    // New unified streaming state
    streamState: StreamingState;
    isStreaming: boolean;
    onCancelStream: () => void;
    responseMode?: 'simple' | 'detailed';
    onResponseModeChange?: (mode: 'simple' | 'detailed') => void;
    currentConversation: Conversation | null;
    messageVersions: { [key: number]: Message[] };
    currentVersion: { [key: number]: number };
    switchVersion: (messageId: number, versionIndex: number) => void;
    formatTime: (timestamp: string) => string;
    editingMessageId: number | null;
    editingMessageText: string;
    setEditingMessageText: (text: string) => void;
    saveEditedMessage: () => void;
    resendEditedMessage: () => void;
    cancelEditingMessage: () => void;
    startEditingMessage: (message: Message) => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    setInputMessage: (message: string) => void;
    onOpenCapabilityExplorer?: () => void;
    onRegenerate?: () => void;
    onViewSources?: (sources: SearchSource[]) => void;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    isDarkMode,
    isLoading,
    streamState,
    isStreaming,
    onCancelStream,
    responseMode = 'simple',
    onResponseModeChange,
    currentConversation,
    messageVersions,
    currentVersion,
    switchVersion,
    formatTime,
    editingMessageId,
    editingMessageText,
    setEditingMessageText,
    saveEditedMessage,
    resendEditedMessage,
    cancelEditingMessage,
    startEditingMessage,
    messagesEndRef,
    setInputMessage,
    onOpenCapabilityExplorer,
    onRegenerate,
    onViewSources,
}) => {
    // -- Scroll-to-bottom FAB --
    const [showScrollFab, setShowScrollFab] = useState(false);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowScrollFab(!entry.isIntersecting);
            },
            { root: scrollContainerRef.current, threshold: 0 }
        );
        const target = messagesEndRef.current;
        if (target) observer.observe(target);
        return () => { if (target) observer.unobserve(target); };
    }, [messagesEndRef, messages.length, isStreaming]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesEndRef]);

    // Seamless handoff: once the assistant MessageItem is painted, drop the ghost stream
    // so we never show duplicate content/tools.
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const handoffPainted =
        streamState.phase === 'done' &&
        lastMessage?.role === 'assistant' &&
        (
            Boolean(lastMessage.content) ||
            Boolean(lastMessage.tools_called && lastMessage.tools_called.length > 0)
        );
    const showLiveStream = isStreaming && !handoffPainted;
    // -- Discovery data for dynamic welcome screen --
    const [discoveryData, setDiscoveryData] = useState<any>(null);
    const [discoveryLoading, setDiscoveryLoading] = useState(false);

    useEffect(() => {
        if (!currentConversation) {
            loadDiscoveryData();
        }
    }, [currentConversation]);

    const loadDiscoveryData = async () => {
        setDiscoveryLoading(true);
        try {
            const response = await apiService.getToolDiscovery();
            if (response.success) {
                setDiscoveryData(response);
            }
        } catch (err) {
            console.error('Failed to load discovery data:', err);
        } finally {
            setDiscoveryLoading(false);
        }
    };

    // Static fallback suggestions
    const staticSuggestions = [
        {
            title: "Market Analysis",
            prompt: "Research current trends in the AI industry and summarize key opportunities.",
            icon: <BarChart3 className="text-blue-500" size={16} />
        },
        {
            title: "Team Setup",
            prompt: "Create a Slack channel #ops-center and invite all department leads.",
            icon: <MessageCircle className="text-purple-500" size={16} />
        },
        {
            title: "Data Export",
            prompt: "Extract last month's sales data from HubSpot and generate a growth report.",
            icon: <Target className="text-emerald-500" size={16} />
        },
        {
            title: "Global Reach",
            prompt: "Translate my latest marketing post into 5 languages and schedule for Tuesday.",
            icon: <Globe className="text-orange-500" size={16} />
        }
    ];

    // Convert discovery suggestions to the display format
    const getSuggestions = () => {
        if (discoveryData?.suggestions && discoveryData.suggestions.length > 0) {
            const iconMap: Record<string, JSX.Element> = {
                'communication': <MessageCircle className="text-blue-500" size={16} />,
                'crm': <Target className="text-rose-500" size={16} />,
                'productivity': <Zap className="text-amber-500" size={16} />,
                'analytics': <BarChart3 className="text-indigo-500" size={16} />,
                'social_media': <Globe className="text-pink-500" size={16} />,
                'payments': <Target className="text-emerald-500" size={16} />,
                'project_management': <Target className="text-purple-500" size={16} />,
            };
            return discoveryData.suggestions.slice(0, 4).map((s: any) => ({
                title: s.title || s.platform || 'Suggestion',
                prompt: s.prompt || s.title,
                icon: iconMap[s.category] || <Sparkles className="text-indigo-500" size={16} />
            }));
        }
        return staticSuggestions;
    };

    const renderWelcomeScreen = () => {
        const suggestions = getSuggestions();
        const connectedApps = discoveryData?.active_capabilities || [];
        const summary = discoveryData?.summary;

        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-in fade-in zoom-in duration-700">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                        <Sparkles className="w-12 h-12 text-white" />
                    </div>
                </div>

                <h1 className={`text-3xl md:text-4xl font-black mb-4 tracking-tight
                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    How can I help you <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-900">transform</span> work?
                </h1>

                <p className={`text-lg mb-8 max-w-xl mx-auto leading-relaxed
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Mini-Hub AI connects your business tools to automate complex tasks and provides deep insights across your entire organization.
                </p>

                {/* Connected Apps Badges */}
                {connectedApps.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-lg">
                        {connectedApps.map((app: any, i: number) => (
                            <div
                                key={app.platform}
                                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all duration-300
                                    animate-in fade-in slide-in-from-bottom-2
                                    ${isDarkMode
                                        ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                                        : 'bg-emerald-50 border-emerald-100 hover:border-emerald-300'
                                    }`}
                                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                                <span className="text-xs">{app.icon}</span>
                                <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                    {app.display_name}
                                </span>
                            </div>
                        ))}
                        {summary && summary.total_available_to_connect > 0 && (
                            <div
                                className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full border text-[11px] font-semibold cursor-pointer transition-all
                                    ${isDarkMode
                                        ? 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-indigo-500/30 hover:text-indigo-400'
                                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-indigo-200 hover:text-indigo-500'
                                    }`}
                                onClick={() => onOpenCapabilityExplorer?.()}
                            >
                                <Plug size={10} />
                                <span>+{summary.total_available_to_connect} more</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Loading state for suggestions */}
                {discoveryLoading && (
                    <div className="flex items-center space-x-2 mb-6">
                        <Loader2 size={14} className="text-indigo-500 animate-spin" />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>Loading your capabilities...</span>
                    </div>
                )}

                {/* Suggestion Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    {suggestions.map((item: any, i: number) => (
                        <button
                            key={i}
                            onClick={() => setInputMessage(item.prompt)}
                            className={`group flex items-start p-4 border rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                                ${isDarkMode
                                    ? 'bg-gray-800/50 border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800'
                                    : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-primary-500/5'}`}
                        >
                            <div className={`p-2.5 rounded-xl mr-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                {item.icon}
                            </div>
                            <div className="flex-1 pr-4">
                                <h4 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    {item.title}
                                </h4>
                                <p className={`text-xs line-clamp-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {item.prompt}
                                </p>
                            </div>
                            <ChevronRight size={14} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                        </button>
                    ))}
                </div>

                {/* "What can I do?" Button */}
                <button
                    onClick={() => onOpenCapabilityExplorer?.()}
                    className={`mt-8 flex items-center space-x-2 px-5 py-2.5 rounded-full border transition-all duration-300
                        hover:scale-[1.03] active:scale-[0.98]
                        ${isDarkMode
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/40'
                            : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-200'
                        }`}
                >
                    <HelpCircle size={14} />
                    <span className="text-xs font-bold">What can I do?</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                        ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-500'}`}>
                        {summary ? `${summary.total_tools} tools` : '50+ tools'}
                    </span>
                </button>
            </div>
        );
    };

    return (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 py-8 chat-messages-area">
            <div className="max-w-4xl mx-auto flex flex-col min-h-full">
                {!currentConversation ? (
                    renderWelcomeScreen()
                ) : messages.length === 0 && !isStreaming ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 animate-in fade-in duration-700 chat-messages-empty">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6
              ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <MessageSquare className={`w-8 h-8 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            New Intelligence Channel
                        </h3>
                        <p className={`text-sm max-w-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Start chatting or select a suggested task. I'm ready to assist with your business operations.
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => (
                            <MessageItem
                                key={msg.id}
                                message={msg}
                                isDarkMode={isDarkMode}
                                isLast={idx === messages.length - 1 && !showLiveStream}
                                responseMode={responseMode || 'simple'}
                                onResponseModeChange={onResponseModeChange}
                                messageVersions={messageVersions[msg.id]}
                                onViewSources={onViewSources}
                                currentVersionIndex={currentVersion[msg.id] || 0}
                                onRegenerate={idx === messages.length - 1 && msg.role === 'assistant' ? onRegenerate : undefined}
                                switchVersion={switchVersion}
                                editingMessageId={editingMessageId}
                                editingMessageText={editingMessageText}
                                setEditingMessageText={setEditingMessageText}
                                saveEditedMessage={saveEditedMessage}
                                cancelEditingMessage={cancelEditingMessage}
                                startEditingMessage={startEditingMessage}
                                resendEditedMessage={resendEditedMessage}
                                formatTime={formatTime}
                            />
                        ))}

                        {/* Standard Loading Indicator (fallback if not streaming) */}
                        {isLoading && !isStreaming && (
                            <div className="flex flex-col items-start mb-8 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-900 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                    <div className={`px-5 py-3 rounded-2xl border
                    ${isDarkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-100 shadow-sm'}`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <div className="flex space-x-1">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                                            </div>
                                            <span className={`text-xs font-bold tracking-tight ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                Thinking...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Live stream — unmounts the instant the final MessageItem is painted */}
                        {showLiveStream && (
                            <StreamingActivityLog
                                streamState={streamState}
                                isDarkMode={isDarkMode}
                                onCancel={onCancelStream}
                                scrollContainerRef={scrollContainerRef}
                                onViewSources={onViewSources}
                            />
                        )}
                    </>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Scroll-to-bottom FAB */}
            {showScrollFab && (
                <button
                    onClick={scrollToBottom}
                    className={`fixed bottom-32 right-8 z-30 p-3 rounded-full border shadow-lg transition-all duration-300
                        hover:scale-110 active:scale-95 animate-in fade-in slide-in-from-bottom-4
                        ${isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 shadow-black/30'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-gray-300/30'
                        }`}
                    title="Scroll to bottom"
                >
                    <ArrowDown size={18} />
                </button>
            )}
        </div>
    );
};

export default MessageList;
