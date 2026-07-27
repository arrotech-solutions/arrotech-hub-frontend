import React, { useState } from 'react';
import {
    User,
    Bot,
    Copy,
    Check,
    Edit,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    ThumbsUp,
    ThumbsDown,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { Message } from '../../types';
import ToolResultWidget from './ToolResultWidget';
import ResponseModeToggle from './ResponseModeToggle';
import ReasoningBubble, { extractThought } from './ReasoningBubble';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createMarkdownComponents } from './CodeBlock';

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
    responseMode?: 'simple' | 'detailed';
    onResponseModeChange?: (mode: 'simple' | 'detailed') => void;
    onRegenerate?: () => void;
    onViewSources?: (sources: any[]) => void;
}

const FEEDBACK_REASONS = [
    'Inaccurate',
    'Not helpful',
    'Too verbose',
    'Incomplete',
    'Other',
];

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
    responseMode = 'simple',
    onResponseModeChange,
    onRegenerate,
    onViewSources,
}) => {
    const isUser = message.role === 'user';
    const isEditing = editingMessageId === message.id;
    const hasVersions = messageVersions.length > 0;

    // Feedback state
    const [feedbackState, setFeedbackState] = useState<'none' | 'up' | 'down'>('none');
    const [showFeedbackMenu, setShowFeedbackMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Extract thought from content
    const { cleanContent } = (!isUser && message.content)
        ? extractThought(message.content)
        : { cleanContent: message.content };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleFeedback = (type: 'up' | 'down') => {
        if (type === 'down') {
            setShowFeedbackMenu(true);
            setFeedbackState('down');
        } else {
            setFeedbackState(feedbackState === 'up' ? 'none' : 'up');
            setShowFeedbackMenu(false);
            // TODO: Send feedback to backend
            // apiService.sendMessageFeedback(message.id, { helpful: true });
        }
    };

    const handleFeedbackReason = (reason: string) => {
        setShowFeedbackMenu(false);
        // TODO: Send feedback to backend
        // apiService.sendMessageFeedback(message.id, { helpful: false, reason });
        console.log('Feedback:', { messageId: message.id, helpful: false, reason });
    };

    const handleReadAloud = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanContent);

        // Find a good voice if possible (optional, but improves UX)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const markdownComponents = createMarkdownComponents(isDarkMode);

    return (
        <div className={`group flex flex-col mb-8
      ${isUser ? 'items-end' : 'items-start'}`}
        >
            <div className={`flex max-w-[85%] lg:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-110
          ${isUser
                        ? 'ml-3 bg-gradient-to-br from-primary-500 to-secondary-900'
                        : 'mr-3 bg-gradient-to-br from-primary-400 to-accent-400'}`}
                >
                    {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                </div>

                {/* Message Bubble Container */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`relative px-5 py-3.5 rounded-2xl transition-all duration-300
            ${isUser
                            ? (isDarkMode ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/20 shadow-[0_4px_20px_rgba(79,70,229,0.1)]' : 'bg-indigo-600 text-white shadow-lg shadow-primary-600/20')
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
                            <div className="text-sm sm:text-[15px] leading-relaxed">
                                {!isUser && message.content && (
                                    <ReasoningBubble content={message.content} isDarkMode={isDarkMode} />
                                )}

                                {!isUser ? (
                                    <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : 'prose-gray'} mt-1`}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={markdownComponents}
                                        >
                                            {cleanContent || ''}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap">{cleanContent}</div>
                                )}

                                {/* Tool Results in Assistant Messages */}
                                {!isUser && message.tools_called && (
                                    <div className="mt-3 not-prose">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                Tools Used ({message.tools_called.length})
                                            </span>
                                            {onResponseModeChange && (
                                                <ResponseModeToggle
                                                    mode={responseMode}
                                                    onChange={onResponseModeChange}
                                                    isDarkMode={isDarkMode}
                                                />
                                            )}
                                        </div>
                                        <ToolResultWidget
                                            message={message}
                                            isDarkMode={isDarkMode}
                                            responseMode={responseMode}
                                            onViewSources={onViewSources}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Metadata & Actions */}
                    {!isEditing && (
                        <div className={`flex items-center mt-2 space-x-3 transition-opacity duration-200
              ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
              ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                        >
                            <span className="text-[10px] font-medium tracking-wide">
                                {formatTime(message.created_at)}
                            </span>

                            {message.tokens_used != null && message.tokens_used > 0 && (
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

                            {/* Quick Actions — always visible area */}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Copy */}
                                <button
                                    onClick={() => copyToClipboard(message.content)}
                                    className={`p-1.5 rounded-lg transition-all ${copied
                                            ? 'text-emerald-500'
                                            : 'hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                    title="Copy message"
                                >
                                    {copied ? <Check size={13} /> : <Copy size={13} />}
                                </button>

                                {/* Read Aloud */}
                                <button
                                    onClick={handleReadAloud}
                                    className={`p-1.5 rounded-lg transition-all ${isSpeaking
                                            ? 'text-indigo-500 bg-indigo-500/10'
                                            : 'hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                    title={isSpeaking ? "Stop reading" : "Read aloud"}
                                >
                                    {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                                </button>

                                {/* Edit (user messages only) */}
                                {isUser && (
                                    <button
                                        onClick={() => startEditingMessage(message)}
                                        className="p-1.5 rounded-lg hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                        title="Edit message"
                                    >
                                        <Edit size={13} />
                                    </button>
                                )}

                                {/* Feedback (assistant messages only) */}
                                {!isUser && (
                                    <>
                                        <button
                                            onClick={() => handleFeedback('up')}
                                            className={`p-1.5 rounded-lg transition-all ${feedbackState === 'up'
                                                    ? 'text-emerald-500 bg-emerald-500/10'
                                                    : 'hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5'
                                                }`}
                                            title="Good response"
                                        >
                                            <ThumbsUp size={13} />
                                        </button>
                                        <div className="relative">
                                            <button
                                                onClick={() => handleFeedback('down')}
                                                className={`p-1.5 rounded-lg transition-all ${feedbackState === 'down'
                                                        ? 'text-red-400 bg-red-500/10'
                                                        : 'hover:text-red-400 hover:bg-black/5 dark:hover:bg-white/5'
                                                    }`}
                                                title="Bad response"
                                            >
                                                <ThumbsDown size={13} />
                                            </button>

                                            {/* Feedback reason dropdown */}
                                            {showFeedbackMenu && (
                                                <div className={`absolute bottom-full mb-2 right-0 w-40 rounded-xl border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2
                                                    ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                                                >
                                                    <div className="p-1">
                                                        {FEEDBACK_REASONS.map(reason => (
                                                            <button
                                                                key={reason}
                                                                onClick={() => handleFeedbackReason(reason)}
                                                                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors
                                                                    ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                                                            >
                                                                {reason}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Regenerate (last assistant message only) */}
                                {!isUser && isLast && onRegenerate && (
                                    <button
                                        onClick={onRegenerate}
                                        className="p-1.5 rounded-lg hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                        title="Regenerate response"
                                    >
                                        <RefreshCw size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default MessageItem;
