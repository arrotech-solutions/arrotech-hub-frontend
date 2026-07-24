import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { SearchSource } from '../../types';

interface SearchSourceCardsProps {
  sources: SearchSource[];
  isDarkMode: boolean;
  onViewSources?: (sources: SearchSource[]) => void;
}

const SearchSourceCards: React.FC<SearchSourceCardsProps> = ({ sources, isDarkMode, onViewSources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Header - Clickable to open sidebar */}
      <div 
        className={`flex items-center space-x-2 mb-3 cursor-pointer group/header w-fit transition-all hover:translate-x-1`}
        onClick={() => onViewSources && onViewSources(sources)}
      >
        <Globe size={14} className="text-cyan-500 group-hover/header:animate-pulse" />
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
          isDarkMode ? 'text-cyan-400 group-hover/header:text-cyan-300' : 'text-cyan-600 group-hover/header:text-cyan-500'
        }`}>
          Sources ({sources.length})
        </span>
      </div>

      {/* Row of logos */}
      <div className="flex flex-wrap gap-2.5 relative z-20">
        {sources.map((source, idx) => {
          const sourceUrl = source.url || (source as any).href;
          const displayDomain = source.domain || (sourceUrl ? new URL(sourceUrl).hostname.replace('www.', '') : 'source');
          
          return (
          <a
            key={idx}
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={source.title}
            className={`group/source relative flex items-center justify-center w-9 h-9 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
              isDarkMode
                ? 'bg-gray-800/90 border-gray-700 hover:border-cyan-500/60 hover:bg-gray-700 shadow-lg shadow-black/20'
                : 'bg-white border-gray-100 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/10'
            }`}
            style={{ zIndex: 30 }}
          >
            <div className="transform transition-transform duration-300 group-hover/source:scale-110 group-hover/source:-translate-y-0.5">
              {source.favicon ? (
                <img
                  src={source.favicon}
                  alt={displayDomain}
                  className="w-5 h-5 object-contain flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling;
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
              ) : null}
              
              <div 
                className={`flex items-center justify-center ${source.favicon ? 'hidden' : 'flex'}`}
                style={{ width: '20px', height: '20px' }}
              >
                <Globe size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              </div>
            </div>
            
            {/* World-Class Rich Hover Card (Perplexity Inspired) */}
            <div className={`absolute -top-4 -translate-y-full w-72 rounded-2xl border p-4 shadow-2xl transition-all duration-300 pointer-events-none z-[100] opacity-0 group-hover/source:opacity-100 group-hover/source:-translate-y-[calc(100%+8px)] 
              ${idx === 0 ? 'left-0 translate-x-0' : idx === sources.length - 1 ? 'right-0 translate-x-0' : 'left-1/2 -translate-x-1/2'}
              ${isDarkMode 
                ? 'bg-slate-900/95 backdrop-blur-xl border-slate-800/50 text-slate-200 shadow-black' 
                : 'bg-white/95 backdrop-blur-xl border-gray-100 text-gray-800 shadow-primary-500/10'
            }`}>
                {/* Modal Header: Favicon & Domain */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    {source.favicon ? (
                      <img src={source.favicon} alt="" className="w-3.5 h-3.5 object-contain" />
                    ) : (
                      <Globe size={14} className="text-gray-400" />
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {displayDomain}
                  </span>
                  <ExternalLink size={10} className="ml-auto opacity-40" />
                </div>

                {/* Modal Content: Title & Snippet */}
                <div className="space-y-2">
                  <h4 className={`text-[13px] font-bold leading-tight line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {source.title}
                  </h4>
                  {source.snippet && (
                    <p className={`text-[11px] leading-relaxed line-clamp-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {source.snippet}
                    </p>
                  )}
                </div>

                {/* Decorative Arrow */}
                <div className={`absolute -bottom-1.5 w-3 h-3 rotate-45 border-r border-b 
                  ${idx === 0 ? 'left-4' : idx === sources.length - 1 ? 'right-4' : 'left-1/2 -translate-x-1/2'}
                  ${isDarkMode 
                    ? 'bg-slate-900/95 border-slate-800/50' 
                    : 'bg-white/95 border-gray-100'
                }`} />
            </div>
          </a>
          );
        })}
      </div>
    </div>
  );
};

export default SearchSourceCards;
