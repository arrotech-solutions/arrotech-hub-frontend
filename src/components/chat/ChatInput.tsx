import React from 'react';
import {
    Send,
    Mic,
    Paperclip,
    Loader2,
    Zap,
    Command,
    Plus,
    BrainCircuit,
    Globe
} from 'lucide-react';
import ConnectedAppsDropdown from './ConnectedAppsDropdown';

interface ChatInputProps {
    inputMessage: string;
    setInputMessage: (message: string) => void;
    sendMessage: () => void;
    isLoading: boolean;
    isDarkMode: boolean;
    isRecording: boolean;
    toggleVoiceRecording: () => void;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    autoResizeTextarea: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleKeyPress: (e: React.KeyboardEvent) => void;
    selectedProvider: string;
    getProviderDisplayName: (provider: string) => string;
    isProviderAvailable: (provider: string) => boolean;
    usage: any;
    limits: any;
    useReasoning: boolean;
    setUseReasoning: (val: boolean) => void;
    useSearch: boolean;
    setUseSearch: (val: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
    inputMessage,
    setInputMessage,
    sendMessage,
    isLoading,
    isDarkMode,
    isRecording,
    toggleVoiceRecording,
    inputRef,
    autoResizeTextarea,
    handleKeyPress,
    selectedProvider,
    getProviderDisplayName,
    isProviderAvailable,
    usage,
    limits,
    useReasoning,
    setUseReasoning,
    useSearch,
    setUseSearch,
}) => {
    const [showFeaturesMenu, setShowFeaturesMenu] = React.useState(false);
    
    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const el = document.getElementById('features-menu');
            const btn = document.getElementById('features-btn');
            if (showFeaturesMenu && el && !el.contains(event.target as Node) && btn && !btn.contains(event.target as Node)) {
                setShowFeaturesMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFeaturesMenu]);
    const aiActionsLimit = usage?.ai_actions?.limit || limits?.ai_actions_monthly || 0;
    const aiActionsUsed = usage?.ai_actions?.used || 0;
    const remaining = Math.max(0, aiActionsLimit - aiActionsUsed);
    const isAtLimit = usage?.ai_actions?.at_limit || false;
    return (
        <div className={`mt-auto px-6 pb-8 pt-4 w-full max-w-4xl mx-auto z-20`}>
            <div className={`relative flex flex-col w-full rounded-2xl border transition-all duration-300 shadow-2xl chat-input-container
        ${isDarkMode
                    ? 'bg-gray-800/90 border-gray-700/50 focus-within:border-indigo-500/50'
                    : 'bg-white border-gray-100 focus-within:border-indigo-300'}`}
            >
                {/* Input Area */}
                <div className="flex items-end px-4 py-3 relative">
                    <div className="flex space-x-1 items-center mb-0.5 relative">
                      <button
                          id="features-btn"
                          onClick={() => setShowFeaturesMenu(!showFeaturesMenu)}
                          className={`p-2 rounded-xl transition-colors
                            ${isDarkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-50 text-gray-400'}
                            ${showFeaturesMenu ? (isDarkMode ? 'bg-gray-700 text-indigo-400' : 'bg-gray-50 text-indigo-500') : ''}
                          `}
                          title="Add Features"
                      >
                          <Plus size={18} className={`transition-transform duration-200 ${showFeaturesMenu ? 'rotate-45' : ''}`} />
                      </button>
                      
                      {/* Features Dropdown Menu */}
                      {showFeaturesMenu && (
                          <div id="features-menu" className={`absolute left-0 bottom-full mb-2 w-56 rounded-xl border shadow-xl overflow-visible z-50 animate-in fade-in slide-in-from-bottom-2 origin-bottom-left
                              ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-black/50' : 'bg-white border-gray-100 shadow-gray-200/50'}`}
                          >
                              <div className="p-2 space-y-1">
                                  <button
                                      className={`w-full flex items-center p-2.5 rounded-lg text-sm transition-colors
                                          ${isDarkMode ? 'hover:bg-gray-700/50 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}
                                      `}
                                      title="Add photos/files"
                                  >
                                      <div className="flex items-center space-x-3">
                                          <Paperclip size={16} className="text-blue-500" />
                                          <span className="font-medium">Add photos/files</span>
                                      </div>
                                  </button>
                                  <button
                                      onClick={() => { setUseSearch(!useSearch); setShowFeaturesMenu(false); }}
                                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors
                                          ${isDarkMode ? 'hover:bg-gray-700/50 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}
                                      `}
                                  >
                                      <div className="flex items-center space-x-3">
                                          <Globe size={16} className={useSearch ? 'text-emerald-500' : 'text-gray-400'} />
                                          <span className="font-medium">Web Search</span>
                                      </div>
                                      <div className={`w-8 h-4 rounded-full relative transition-colors ${useSearch ? 'bg-emerald-500' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-200')}`}>
                                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useSearch ? 'translate-x-4' : ''}`} />
                                      </div>
                                  </button>
                                  
                                  <button
                                      onClick={() => { setUseReasoning(!useReasoning); setShowFeaturesMenu(false); }}
                                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors
                                          ${isDarkMode ? 'hover:bg-gray-700/50 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}
                                      `}
                                  >
                                      <div className="flex items-center space-x-3">
                                          <BrainCircuit size={16} className={useReasoning ? 'text-indigo-500' : 'text-gray-400'} />
                                          <span className="font-medium">Deep Thinking</span>
                                      </div>
                                      <div className={`w-8 h-4 rounded-full relative transition-colors ${useReasoning ? 'bg-indigo-500' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-200')}`}>
                                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useReasoning ? 'translate-x-4' : ''}`} />
                                      </div>
                                  </button>
                                  <ConnectedAppsDropdown isDarkMode={isDarkMode} />
                              </div>
                          </div>
                      )}
                    </div>

                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={inputMessage}
                        onChange={(e) => {
                            setInputMessage(e.target.value);
                            autoResizeTextarea(e);
                        }}
                        onKeyDown={handleKeyPress}
                        placeholder={isAtLimit ? "Daily limit reached. Upgrade to continue chatting." : "Describe what you want to achieve..."}
                        disabled={isAtLimit}
                        className={`flex-1 mx-2 py-2 max-h-[200px] bg-transparent outline-none resize-none text-sm leading-relaxed
              ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} ${isAtLimit ? 'cursor-not-allowed opacity-50' : ''}`}
                    />

                    <div className="flex items-center space-x-1 mb-0.5">
                        <button
                            onClick={toggleVoiceRecording}
                            className={`p-2.5 rounded-xl transition-all
                ${isRecording
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : (isDarkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-50 text-gray-400')}`}
                            title="Voice Input"
                        >
                            <Mic size={18} />
                        </button>

                        <button
                            onClick={sendMessage}
                            disabled={isLoading || !inputMessage.trim() || isAtLimit}
                            className={`p-2.5 rounded-xl transition-all chat-send-btn
                ${!inputMessage.trim() || isLoading
                                    ? (isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-50 text-gray-200 cursor-not-allowed')
                                    : 'bg-gradient-to-br from-primary-500 to-secondary-900 text-white shadow-lg shadow-primary-500/20 hover:scale-105 hover:shadow-primary-500/40'}`}
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>

                {/* Footer info Bar */}
                <div className={`flex items-center justify-between px-4 py-2 rounded-b-2xl border-t
          ${isDarkMode ? 'bg-gray-900/30 border-gray-700/50' : 'bg-gray-50/50 border-gray-50'}`}
                >
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1.5 opacity-60">
                            <Zap size={12} className={isProviderAvailable(selectedProvider) ? 'text-yellow-500' : 'text-gray-400'} />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-gray-500">
                                {getProviderDisplayName(selectedProvider)}
                            </span>
                        </div>
                        {inputMessage.length > 0 && (
                            <span className="text-[10px] font-medium text-gray-400">
                                {inputMessage.length} characters
                            </span>
                        )}
                        <div className="flex items-center space-x-1 border-l pl-3 border-gray-300 dark:border-gray-700">
                            <span className={`text-[10px] font-black uppercase tracking-tight ${remaining <= 2 && remaining > 0 ? 'text-amber-500' : remaining === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                {remaining} / {aiActionsLimit} AI Actions Left
                            </span>
                        </div>
                        
                        {/* Selected Features Badges */}
                        {(useReasoning || useSearch) && (
                            <div className="flex items-center space-x-2 border-l pl-3 border-gray-300 dark:border-gray-700">
                                {useReasoning && (
                                    <div className="flex items-center space-x-1 border border-indigo-500/20 bg-indigo-500/5 text-indigo-500 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                        <BrainCircuit size={10} />
                                        <span>Thinking</span>
                                    </div>
                                )}
                                {useSearch && (
                                    <div className="flex items-center space-x-1 border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                        <Globe size={10} />
                                        <span>Search</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-3 opacity-40">
                        <div className="flex items-center space-x-1">
                            <Command size={10} className="text-gray-500" />
                            <span className="text-[10px] font-bold">↵</span>
                            <span className="text-[10px] lowercase text-gray-500 ml-1">to send</span>
                        </div>
                        <div className="flex items-center space-x-1 border-l pl-3 border-gray-300 dark:border-gray-700">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">AI Enabled</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <p className={`mt-3 text-[10px] text-center font-medium opacity-40 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Mini-Hub AI can make mistakes. Check important information.
            </p>
        </div>
    );
};

export default ChatInput;
