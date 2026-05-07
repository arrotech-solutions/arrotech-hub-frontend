import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  isDarkMode?: boolean;
  [key: string]: any;
}

/**
 * Shared code block component with copy-to-clipboard button.
 * Used by both MessageItem and StreamingActivityLog for consistent rendering.
 */
const CodeBlock: React.FC<CodeBlockProps> = ({ inline, className, children, isDarkMode = true, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');

  const handleCopy = async () => {
    const text = String(children).replace(/\n$/, '');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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

  if (!inline && match) {
    return (
      <div className="relative rounded-lg overflow-hidden mt-4 mb-4 border border-gray-700/50 not-prose group/code">
        {/* Header bar with language label and copy button */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <span className="text-xs text-gray-400 font-mono lowercase">{match[1]}</span>
          <button
            onClick={handleCopy}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200
              ${copied
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 opacity-0 group-hover/code:opacity-100'
              }`}
            title="Copy code"
          >
            {copied ? (
              <>
                <Check size={12} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        {/* Code content */}
        <div className="overflow-x-auto bg-gray-950 p-4">
          <code className={`${className} text-sm`} {...props}>
            {children}
          </code>
        </div>
      </div>
    );
  }

  // Inline code
  return (
    <code
      className={`${className || ''} px-1.5 py-0.5 rounded-md text-[13px] ${
        isDarkMode ? 'bg-gray-700/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
      }`}
      {...props}
    >
      {children}
    </code>
  );
};

/**
 * Returns a markdown components object with CodeBlock wired in.
 * Usage: <ReactMarkdown components={createMarkdownComponents(isDarkMode)} />
 */
export const createMarkdownComponents = (isDarkMode: boolean) => ({
  code({ node, inline, className, children, ...props }: any) {
    return (
      <CodeBlock inline={inline} className={className} isDarkMode={isDarkMode} {...props}>
        {children}
      </CodeBlock>
    );
  },
});

export default CodeBlock;
