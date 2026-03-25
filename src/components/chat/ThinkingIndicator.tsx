import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BrainCircuit, CheckCircle2, CircleDashed } from 'lucide-react';
import { ThinkingStep } from '../../hooks/useStreamingChat';

interface ThinkingIndicatorProps {
  steps: ThinkingStep[];
  isDarkMode: boolean;
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ steps, isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!steps || steps.length === 0) return null;

  const activeStep = steps.find(s => !s.isComplete) || steps[steps.length - 1];
  const allComplete = steps.every(s => s.isComplete);

  return (
    <div className={`mb-4 rounded-xl border overflow-hidden transition-all duration-300
      ${isDarkMode 
        ? 'bg-gray-800/40 border-gray-700/50' 
        : 'bg-gray-50/80 border-gray-200'}`}
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white shadow-sm'}`}>
            <BrainCircuit size={16} className={allComplete ? 'text-green-500' : 'text-indigo-500'} />
          </div>
          <div>
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {allComplete ? 'Finished thinking' : 'Thinking...'}
            </span>
            {!isExpanded && !allComplete && (
              <p className={`text-xs mt-0.5 animate-pulse ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {activeStep.text}
              </p>
            )}
            {!isExpanded && allComplete && steps.length > 0 && (
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {steps.length} reasoning steps
              </p>
            )}
          </div>
        </div>
        
        {isExpanded ? (
          <ChevronDown size={16} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
        ) : (
          <ChevronRight size={16} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
        )}
      </button>

      {isExpanded && (
        <div className={`p-4 pt-2 border-t text-sm ${isDarkMode ? 'border-gray-700/50 bg-gray-800/20' : 'border-gray-200 bg-white/50'}`}>
          <div className="space-y-3 pl-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start space-x-3 animate-in fade-in slide-in-from-left-2">
                <div className="mt-0.5 flex-shrink-0">
                  {step.isComplete ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <CircleDashed size={14} className="text-indigo-500 animate-spin-slow" />
                  )}
                </div>
                <div className={`flex-1 ${!step.isComplete ? 'animate-pulse' : ''}`}>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingIndicator;
