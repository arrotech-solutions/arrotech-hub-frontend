import React, { useState } from 'react';
import { X, Code, Copy, Check, FileCode, MonitorPlay } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface Artifact {
  id: string;
  title: string;
  content: string;
  language?: string;
  type: 'code' | 'markdown' | 'html';
}

interface ArtifactPanelProps {
  artifact?: Artifact | null;
  onClose: () => void;
  isDarkMode: boolean;
}

const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ artifact, onClose, isDarkMode }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  if (!artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col h-full w-full max-w-lg lg:max-w-2xl border-l transition-all duration-300 animate-in slide-in-from-right-16 ${
      isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-3 truncate">
          <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <FileCode size={16} />
          </div>
          <h2 className="text-sm font-semibold truncate">{artifact.title || 'Generated Artifact'}</h2>
        </div>
        <div className="flex items-center space-x-2">
          {artifact.type === 'html' && (
            <div className={`flex items-center p-1 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <button
                onClick={() => setActiveTab('code')}
                className={`p-1 rounded-md transition-colors ${activeTab === 'code' ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-white shadow text-gray-900') : 'text-gray-500'}`}
              >
                <Code size={14} />
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`p-1 rounded-md transition-colors ${activeTab === 'preview' ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-white shadow text-gray-900') : 'text-gray-500'}`}
              >
                <MonitorPlay size={14} />
              </button>
            </div>
          )}
          <button onClick={handleCopy} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-auto custom-scrollbar p-4 ${isDarkMode ? 'bg-[#0d1117]' : 'bg-white'}`}>
        {activeTab === 'code' ? (
          <pre className={`text-sm font-mono leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
            <code>{artifact.content}</code>
          </pre>
        ) : (
          <div className="w-full h-full bg-white rounded-md overflow-hidden border">
            {artifact.type === 'html' ? (
              <iframe
                srcDoc={artifact.content}
                title="Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="prose prose-sm max-w-none p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtifactPanel;
