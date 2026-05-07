import React from 'react';
import { X, Globe, ExternalLink, Link2, Search, Share2, Bookmark } from 'lucide-react';
import { SearchSource } from '../../types';

interface SourcesPanelProps {
  sources: SearchSource[];
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const SourcesPanel: React.FC<SourcesPanelProps> = ({ sources, isOpen, onClose, isDarkMode }) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl border-l transition-all duration-300 shadow-2xl animate-in slide-in-from-right ${
      isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-100'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
            <Globe size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight uppercase">Research Sources</h2>
            <p className={`text-[10px] font-bold opacity-50 uppercase tracking-widest`}>
              {sources.length} Verified results
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${
              isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {sources.map((source, idx) => {
          const displayDomain = source.domain || (source.url ? new URL(source.url).hostname.replace('www.', '') : 'source');
          
          return (
            <div 
              key={idx}
              className={`group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-900/40 border-gray-800 hover:border-cyan-500/30 hover:bg-gray-900/60' 
                  : 'bg-white border-gray-100 hover:border-cyan-400/30 hover:shadow-xl hover:shadow-cyan-500/5'
              }`}
            >
              {/* Domain & Index Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                  }`}>
                    {source.favicon ? (
                      <img src={source.favicon} alt="" className="w-4 h-4 object-contain" />
                    ) : (
                      <Globe size={14} className="text-gray-400" />
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {displayDomain}
                  </span>
                </div>
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-400' 
                    : 'bg-gray-50 border-gray-100 text-gray-400'
                }`}>
                  {idx + 1}
                </span>
              </div>

              {/* Title & Link */}
              <a 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`text-[15px] font-bold leading-tight mb-2 hover:text-cyan-500 transition-colors ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {source.title}
              </a>

              {/* Snippet */}
              {source.snippet && (
                <p className={`text-xs leading-relaxed mb-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {source.snippet}
                </p>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-gray-800/50">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1.5 opacity-40 hover:opacity-100 transition-opacity">
                    <Bookmark size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Save</span>
                  </button>
                  <button className="flex items-center space-x-1.5 opacity-40 hover:opacity-100 transition-opacity">
                    <Share2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Share</span>
                  </button>
                </div>
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    isDarkMode 
                      ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' 
                      : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
                  }`}
                >
                  <span>Visit Site</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className={`p-6 border-t ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
        <div className={`flex items-center space-x-3 p-4 rounded-2xl border ${
          isDarkMode ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50/50 border-indigo-100'
        }`}>
          <div className="p-2 rounded-xl bg-indigo-500 text-white">
            <Search size={16} />
          </div>
          <div>
            <p className={`text-[11px] font-bold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
              Deep Search Active
            </p>
            <p className={`text-[10px] opacity-60 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Sources verified by Mini-Hub Intelligence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourcesPanel;
