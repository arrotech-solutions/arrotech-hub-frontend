import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface ReasoningBubbleProps {
    content: string;
    isDarkMode: boolean;
}

export const extractThought = (content: string): { thought: string | null; cleanContent: string } => {
    if (!content) return { thought: null, cleanContent: "" };

    // Matches "Thought: <text>" at the start or distinct lines
    // Also handles "Thought: <text> Plan: <text> ..." as one block
    const thoughtRegex = /(?:Thinking|Thought|Reasoning):\s*([\s\S]*?)(?=(?:Tool Call:|Response:|Action:|User:|$))/i;

    const match = content.match(thoughtRegex);

    if (match && match[1]) {
        const thought = match[1].trim();
        // Remove the thought block from content to avoid duplication
        // We replace the entire match (which includes "Thought:")
        const cleanContent = content.replace(match[0], '').trim();
        return { thought, cleanContent };
    }

    return { thought: null, cleanContent: content };
};

const ReasoningBubble: React.FC<ReasoningBubbleProps> = ({ content, isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { thought } = extractThought(content);

    if (!thought) return null;

    return (
        <div className={`mb-3 rounded-lg border ${isDarkMode
                ? 'bg-indigo-900/20 border-indigo-500/30'
                : 'bg-indigo-50 border-indigo-100'
            }`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center w-full px-3 py-2 text-xs font-medium transition-colors ${isDarkMode ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-700'
                    }`}
            >
                <Brain size={14} className="mr-2" />
                <span>Thinking Process</span>
                {isOpen ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
            </button>

            {isOpen && (
                <div className={`px-3 pb-3 pt-1 text-xs whitespace-pre-wrap leading-relaxed border-t ${isDarkMode
                        ? 'text-indigo-200/80 border-indigo-500/20'
                        : 'text-indigo-800/80 border-indigo-200/50'
                    }`}>
                    {thought}
                </div>
            )}
        </div>
    );
};

export default ReasoningBubble;
