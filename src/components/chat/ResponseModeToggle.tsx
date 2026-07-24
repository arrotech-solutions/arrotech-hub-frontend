import React from 'react';
import { Eye, Code2 } from 'lucide-react';

interface ResponseModeToggleProps {
  mode: 'simple' | 'detailed';
  onChange: (mode: 'simple' | 'detailed') => void;
  isDarkMode: boolean;
}

const ResponseModeToggle: React.FC<ResponseModeToggleProps> = ({ mode, onChange, isDarkMode }) => {
  return (
    <div
      className={`inline-flex items-center rounded-full p-0.5 text-[11px] font-medium transition-all duration-300 ${
        isDarkMode
          ? 'bg-gray-800/80 border border-gray-700/50'
          : 'bg-gray-100/80 border border-gray-200/50'
      }`}
    >
      <button
        onClick={() => onChange('simple')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-300 ${
          mode === 'simple'
            ? isDarkMode
              ? 'bg-indigo-500/20 text-indigo-400 shadow-sm shadow-primary-500/10'
              : 'bg-indigo-500/10 text-indigo-600 shadow-sm shadow-primary-500/10'
            : isDarkMode
              ? 'text-gray-500 hover:text-gray-400'
              : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Eye size={12} />
        Simple
      </button>
      <button
        onClick={() => onChange('detailed')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-300 ${
          mode === 'detailed'
            ? isDarkMode
              ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/10'
              : 'bg-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/10'
            : isDarkMode
              ? 'text-gray-500 hover:text-gray-400'
              : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Code2 size={12} />
        Detailed
      </button>
    </div>
  );
};

export default ResponseModeToggle;
