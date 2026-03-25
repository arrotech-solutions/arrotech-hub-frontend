import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot } from 'lucide-react';
import ReasoningBubble from './ReasoningBubble';

interface StreamingMessageBubbleProps {
  content: string;
  reasoningContent?: string;
  isDarkMode: boolean;
}

const StreamingMessageBubble: React.FC<StreamingMessageBubbleProps> = ({ content, reasoningContent, isDarkMode }) => {
  if (!content && !reasoningContent) return null;

  return (
    <div className="flex flex-col items-start mb-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-start space-x-3 max-w-[85%]">
        <div className="w-8 h-8 mt-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg relative">
          <Bot size={16} className="text-white relative z-10" />
          <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse" />
        </div>

        <div className={`group relative flex flex-col items-start`}>
          <ReasoningBubble 
              reasoningContent={reasoningContent} 
              isStreaming={true} 
              isDarkMode={isDarkMode} 
          />
          {content && (
              <div
                className={`px-5 py-3.5 rounded-2xl border shadow-sm prose prose-sm max-w-none transition-all duration-300
                  ${isDarkMode 
                    ? 'bg-gray-800/90 border-gray-700/50 text-gray-200 prose-invert' 
                    : 'bg-white border-gray-100 text-gray-800'
                  }
                `}
              >
                {/* The actual markdown content */}
                <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <div className="relative rounded-lg overflow-hidden mt-4 mb-4 border border-gray-700/50">
                      <div className="flex items-center px-4 py-2 bg-gray-900 border-b border-gray-800">
                        <span className="text-xs text-gray-400 font-mono lowercase">{match[1]}</span>
                      </div>
                      <div className="overflow-x-auto bg-gray-950 p-4">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <code className={`${className} px-1.5 py-0.5 rounded-md ${isDarkMode ? 'bg-gray-700/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>

            {/* Blinking cursor at the end to indicate streaming */}
            <span className="inline-block w-2.5 h-4 ml-1 -mb-0.5 bg-indigo-500 animate-pulse rounded-sm" />
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamingMessageBubble;
