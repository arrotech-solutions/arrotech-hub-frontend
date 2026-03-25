import React, { useState, useEffect, useRef } from 'react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface ReasoningBubbleProps {
    content?: string;
    reasoningContent?: string;
    isStreaming?: boolean;
    isDarkMode: boolean;
}

export const extractThought = (content: string): { thought: string | null; cleanContent: string } => {
    if (!content) return { thought: null, cleanContent: "" };

    const thoughtRegex = /(?:Thinking|Thought|Reasoning):\s*([\s\S]*?)(?=(?:Tool Call:|Response:|Action:|User:|$))/i;
    const deepSeekRegex = /<think>(.*?)<\/think>/is;
    
    let match = content.match(deepSeekRegex);
    if (match && match[1]) {
        return { thought: match[1].trim(), cleanContent: content.replace(match[0], '').trim() };
    }

    match = content.match(thoughtRegex);
    if (match && match[1]) {
        const thought = match[1].trim();
        const cleanContent = content.replace(match[0], '').trim();
        return { thought, cleanContent };
    }

    return { thought: null, cleanContent: content };
};

const ReasoningBubble: React.FC<ReasoningBubbleProps> = ({ content, reasoningContent, isStreaming, isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const contentEndRef = useRef<HTMLDivElement>(null);

    // Get final thought derived from props
    let finalThought = reasoningContent;
    if (!finalThought && content) {
        const extracted = extractThought(content);
        finalThought = extracted.thought || undefined;
    }

    // Auto-open when streaming reasoning starts
    useEffect(() => {
        if (isStreaming && finalThought && !isOpen) {
            setIsOpen(true);
        }
    }, [isStreaming, finalThought]);

    // Auto-scroll when open and streaming
    useEffect(() => {
        if (isOpen && isStreaming && contentEndRef.current) {
            contentEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [finalThought, isOpen, isStreaming]);

    if (!finalThought) return null;

    return (
        <div className={`mb-3 rounded-lg border overflow-hidden transition-all duration-300 ${isDarkMode
                ? 'bg-indigo-900/20 border-indigo-500/30'
                : 'bg-indigo-50 border-indigo-100'
            }`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center w-full px-3 py-2 text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-indigo-300 hover:text-indigo-200 bg-indigo-900/30' 
                    : 'text-indigo-600 hover:text-indigo-700 bg-indigo-100/50'
                }`}
            >
                <Brain size={14} className={`mr-2 ${isStreaming ? 'animate-pulse text-indigo-400' : ''}`} />
                <span>{isStreaming ? 'Thinking...' : 'Thoughts'}</span>
                {isOpen ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
            </button>

            {isOpen && (
                <div className={`px-3 pb-3 pt-2 text-xs whitespace-pre-wrap leading-relaxed border-t max-h-60 overflow-y-auto ${isDarkMode
                        ? 'text-indigo-200/80 border-indigo-500/20'
                        : 'text-indigo-800/80 border-indigo-200/50'
                    }`}>
                    {finalThought}
                    {isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-400 animate-pulse" />}
                    <div ref={contentEndRef} />
                </div>
            )}
        </div>
    );
};

export default ReasoningBubble;
