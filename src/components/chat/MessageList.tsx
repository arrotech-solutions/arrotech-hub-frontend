import React from 'react';
import {
    Bot,
    MessageCircle,
    Sparkles,
    ChevronRight,
    Target,
    BarChart3,
    Globe,
    MessageSquare
} from 'lucide-react';
import { Conversation, Message } from '../../types';
import MessageItem from './MessageItem';

interface MessageListProps {
    messages: Message[];
    isDarkMode: boolean;
    isLoading: boolean;
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
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    isDarkMode,
    isLoading,
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
}) => {
    const suggestions = [
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

    const renderWelcomeScreen = () => (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-in fade-in zoom-in duration-700">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                    <Sparkles className="w-12 h-12 text-white" />
                </div>
            </div>

            <h1 className={`text-3xl md:text-4xl font-black mb-4 tracking-tight
        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                How can I help you <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">transform</span> work?
            </h1>

            <p className={`text-lg mb-12 max-w-xl mx-auto leading-relaxed
        ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Mini-Hub AI connects your business tools to automate complex tasks and provides deep insights across your entire organization.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {suggestions.map((item, i) => (
                    <button
                        key={i}
                        onClick={() => setInputMessage(item.prompt)}
                        className={`group flex items-start p-4 border rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
              ${isDarkMode
                                ? 'bg-gray-800/50 border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800'
                                : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5'}`}
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
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-8">
            <div className="max-w-4xl mx-auto flex flex-col min-h-full">
                {!currentConversation ? (
                    renderWelcomeScreen()
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 animate-in fade-in duration-700">
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
                                isLast={idx === messages.length - 1}
                                messageVersions={messageVersions[msg.id]}
                                currentVersionIndex={currentVersion[msg.id] || 0}
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

                        {isLoading && (
                            <div className="flex flex-col items-start mb-8 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
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
                    </>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>
        </div>
    );
};

export default MessageList;
