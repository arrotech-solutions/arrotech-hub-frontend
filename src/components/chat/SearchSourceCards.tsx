import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { SearchSource } from '../../types';

interface SearchSourceCardsProps {
  sources: SearchSource[];
  isDarkMode: boolean;
}

const SearchSourceCards: React.FC<SearchSourceCardsProps> = ({ sources, isDarkMode }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-3">
        <Globe size={14} className="text-cyan-500" />
        <span className={`text-xs font-semibold uppercase tracking-wider ${
          isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
        }`}>
          Sources ({sources.length})
        </span>
      </div>

      {/* Scrollable source cards */}
      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {sources.map((source, idx) => (
          <a
            key={idx}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-shrink-0 w-56 rounded-xl border p-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group cursor-pointer ${
              isDarkMode
                ? 'bg-gray-800/60 border-gray-700/50 hover:border-cyan-500/40 hover:bg-gray-800/90'
                : 'bg-white border-gray-200 hover:border-cyan-300 hover:shadow-cyan-100/50'
            }`}
          >
            {/* Source header with favicon */}
            <div className="flex items-center space-x-2 mb-2">
              {source.favicon ? (
                <img
                  src={source.favicon}
                  alt=""
                  className="w-4 h-4 rounded-sm flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Globe size={12} className="text-gray-400 flex-shrink-0" />
              )}
              <span className={`text-[10px] font-medium truncate ${
                isDarkMode ? 'text-cyan-400/80' : 'text-cyan-600/80'
              }`}>
                {source.domain}
              </span>
              <ExternalLink
                size={10}
                className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500"
              />
            </div>

            {/* Title */}
            <p className={`text-xs font-semibold leading-tight line-clamp-2 mb-1 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              {source.title}
            </p>

            {/* Snippet */}
            <p className={`text-[10px] leading-relaxed line-clamp-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {source.snippet}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SearchSourceCards;
