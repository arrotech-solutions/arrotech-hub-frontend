import React from 'react';
import {
    User,
    Bot,
    Copy,
    Edit,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { Message } from '../../types';
import ToolResultWidget from './ToolResultWidget';

interface MessageItemProps {
    message: Message;
    isDarkMode: boolean;
    isLast: boolean;
    messageVersions?: Message[];
    currentVersionIndex?: number;
    switchVersion?: (messageId: number, versionIndex: number) => void;
    editingMessageId: number | null;
    editingMessageText: string;
    setEditingMessageText: (text: string) => void;
    saveEditedMessage: () => void;
    cancelEditingMessage: () => void;
    startEditingMessage: (message: Message) => void;
    resendEditedMessage: () => void;
    formatTime: (timestamp: string) => string;
}

const MessageItem: React.FC<MessageItemProps> = ({
    message,
    isDarkMode,
    isLast,
    messageVersions = [],
    currentVersionIndex = 0,
    switchVersion,
    editingMessageId,
    editingMessageText,
    setEditingMessageText,
    saveEditedMessage,
    cancelEditingMessage,
    startEditingMessage,
    resendEditedMessage,
    formatTime,
}) => {
    const isUser = message.role === 'user';
    const isEditing = editingMessageId === message.id;
    const hasVersions = messageVersions.length > 0;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You might want to trigger a toast here, but for now we'll keep it simple
    };

    return (
        <div className={`group flex flex-col mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500
      ${isUser ? 'items-end' : 'items-start'}`}
        >
            <div className={`flex max-w-[85%] lg:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-110
          ${isUser
                        ? 'ml-3 bg-gradient-to-br from-indigo-500 to-purple-600'
                        : 'mr-3 bg-gradient-to-br from-emerald-400 to-teal-500'}`}
                >
                    {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                </div>

                {/* Message Bubble Container */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`relative px-5 py-3.5 rounded-2xl transition-all duration-300
            ${isUser
                            ? (isDarkMode ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/20 shadow-[0_4px_20px_rgba(79,70,229,0.1)]' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20')
                            : (isDarkMode ? 'bg-gray-800/80 text-gray-200 border border-gray-700/50' : 'bg-white text-gray-800 border border-gray-100 shadow-sm')}
            ${isEditing ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
                    >
                        {isEditing ? (
                            <div className="min-w-[300px] sm:min-w-[450px]">
                                <textarea
                                    autoFocus
                                    className={`w-full bg-transparent outline-none resize-none text-sm leading-relaxed
                    ${isUser ? 'text-white placeholder-indigo-200' : (isDarkMode ? 'text-gray-200' : 'text-gray-800')}`}
                                    value={editingMessageText}
                                    onChange={(e) => setEditingMessageText(e.target.value)}
                                    rows={Math.max(2, editingMessageText.split('\n').length)}
                                />
                                <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-white/10">
                                    <button
                                        onClick={cancelEditingMessage}
                                        className="p-1.5 rounded-lg hover:bg-black/10 transition-colors text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={resendEditedMessage}
                                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 transition-transform"
                                    >
                                        <RefreshCw size={12} />
                                        <span>Resend</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap">
                                {message.content}

                                {/* Tool Results in Assistant Messages */}
                                {!isUser && message.tools_called && (
                                    <ToolResultWidget
                                        message={message}
                                        isDarkMode={isDarkMode}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Metadata & Actions */}
                    {!isEditing && (
                        <div className={`flex items-center mt-2 space-x-4 transition-opacity duration-200
              ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
              ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                        >
                            <span className="text-[10px] font-medium tracking-wide">
                                {formatTime(message.created_at)}
                            </span>

                            {message.tokens_used && (
                                <div className="flex items-center space-x-1">
                                    <div className="w-1 h-1 rounded-full bg-current opacity-40" />
                                    <span className="text-[10px] font-medium">{message.tokens_used} tokens</span>
                                </div>
                            )}

                            {/* Version Toggle for Assistant */}
                            {!isUser && hasVersions && switchVersion && (
                                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-1.5 py-0.5 space-x-2">
                                    <button
                                        onClick={() => switchVersion(message.id, Math.max(0, currentVersionIndex - 1))}
                                        disabled={currentVersionIndex === 0}
                                        className="hover:text-indigo-500 disabled:opacity-30 p-0.5"
                                    >
                                        <ChevronLeft size={12} />
                                    </button>
                                    <span className="text-[10px] font-bold">
                                        {currentVersionIndex + 1} / {messageVersions.length + 1}
                                    </span>
                                    <button
                                        onClick={() => switchVersion(message.id, Math.min(messageVersions.length, currentVersionIndex + 1))}
                                        disabled={currentVersionIndex === messageVersions.length}
                                        className="hover:text-indigo-500 disabled:opacity-30 p-0.5"
                                    >
                                        <ChevronRight size={12} />
                                    </button>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => copyToClipboard(message.content)}
                                    className="p-1 hover:text-indigo-500 transition-colors"
                                    title="Copy"
                                >
                                    <Copy size={12} />
                                </button>
                                {isUser && (
                                    <button
                                        onClick={() => startEditingMessage(message)}
                                        className="p-1 hover:text-indigo-500 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageItem;
