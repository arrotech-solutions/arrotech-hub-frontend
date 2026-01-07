import React, { useState } from 'react';
import {
    MessageCircle,
    MessageSquare,
    ChevronRight,
    Sun,
    Moon,
    Plus,
    Sparkles,
    MoreVertical,
    Edit,
    Trash2,
    Settings,
    Workflow
} from 'lucide-react';
import { Conversation, LLMProviderResponse } from '../../types';

interface ChatSidebarProps {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    setCurrentConversation: (conversation: Conversation | null) => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    handleBackToDashboard: () => void;
    selectedProvider: string;
    setSelectedProvider: (provider: string) => void;
    providers: LLMProviderResponse | null;
    createNewConversation: () => void;
    deleteConversation: (id: number) => void;
    updateConversationTitle: (id: number, title: string) => Promise<void>;
    getProviderDisplayName: (provider: string) => string;
    isProviderAvailable: (provider: string) => boolean;
    hasToolCalls: boolean;
    handleOpenWorkflowBuilder: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    conversations,
    currentConversation,
    setCurrentConversation,
    sidebarCollapsed,
    setSidebarCollapsed,
    isDarkMode,
    toggleTheme,
    handleBackToDashboard,
    selectedProvider,
    setSelectedProvider,
    providers,
    createNewConversation,
    deleteConversation,
    updateConversationTitle,
    getProviderDisplayName,
    isProviderAvailable,
    hasToolCalls,
    handleOpenWorkflowBuilder
}) => {
    const [editingConversation, setEditingConversation] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [showOptionsMenu, setShowOptionsMenu] = useState<number | null>(null);

    const startEditing = (convo: Conversation) => {
        setEditingConversation(convo.id);
        setEditingTitle(convo.title || '');
        setShowOptionsMenu(null);
    };

    const handleUpdateTitle = (id: number) => {
        if (editingTitle.trim()) {
            updateConversationTitle(id, editingTitle.trim());
        }
        setEditingConversation(null);
    };

    const groupConversationsByTime = (convos: Conversation[]) => {
        const sorted = [...convos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterday = today - 86400000;

        const groups: Record<string, Conversation[]> = { 'Today': [], 'Yesterday': [], 'Older': [] };

        sorted.forEach(c => {
            const d = new Date(c.created_at);
            const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            if (t === today) groups['Today'].push(c);
            else if (t === yesterday) groups['Yesterday'].push(c);
            else groups['Older'].push(c);
        });

        return Object.fromEntries(Object.entries(groups).filter(([_, l]) => l.length > 0));
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 md:relative flex flex-col border-r backdrop-blur-md transition-all duration-300 ease-in-out
                ${sidebarCollapsed
                    ? '-translate-x-full md:translate-x-0 md:w-20'
                    : 'translate-x-0 w-[280px] md:w-72'} 
                ${isDarkMode ? 'bg-gray-900/95 md:bg-gray-900/80 border-gray-800' : 'bg-white/95 md:bg-white/80 border-gray-200'}`}
        >
            {/* Sidebar Header */}
            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className={`flex items-center justify-between ${sidebarCollapsed ? 'flex-col space-y-4' : ''}`}>
                    <button
                        onClick={handleBackToDashboard}
                        className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <MessageCircle className="w-5 h-5 text-white" />
                    </button>

                    {!sidebarCollapsed ? (
                        <div className="flex items-center space-x-1">
                            <button onClick={toggleTheme} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <button onClick={() => setSidebarCollapsed(true)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                                <ChevronRight size={18} className="rotate-180" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setSidebarCollapsed(false)} className={`hidden md:flex p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>

                {!sidebarCollapsed && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Model</label>
                            <Settings size={12} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
                        </div>
                        <div className="relative">
                            <select
                                value={selectedProvider}
                                onChange={(e) => setSelectedProvider(e.target.value)}
                                className={`w-full appearance-none px-3 py-2 text-xs font-bold rounded-lg border focus:outline-none transition-all
                                    ${isDarkMode ? 'bg-gray-800/50 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                            >
                                {providers?.all_providers?.map((p) => (
                                    <option key={p.id} value={p.id} disabled={!p.available}>{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <div className={`w-1.5 h-1.5 rounded-full ${isProviderAvailable(selectedProvider) ? 'bg-green-500' : 'bg-red-400'}`} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                {!sidebarCollapsed ? (
                    Object.entries(groupConversationsByTime(conversations)).map(([group, l]) => (
                        <div key={group} className="mb-6 last:mb-2">
                            <h3 className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>{group}</h3>
                            <div className="space-y-0.5">
                                {l.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => {
                                            setCurrentConversation(c);
                                            // Auto collapse on mobile when selection happens
                                            if (window.innerWidth < 768) setSidebarCollapsed(true);
                                        }}
                                        className={`group relative flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200
                                            ${currentConversation?.id === c.id
                                                ? (isDarkMode ? 'bg-indigo-600/20 text-indigo-100' : 'bg-indigo-50 text-indigo-700')
                                                : (isDarkMode ? 'hover:bg-gray-800/50 text-gray-400' : 'hover:bg-gray-50 text-gray-600')}`}
                                    >
                                        <MessageSquare size={16} className={`shrink-0 ${currentConversation?.id === c.id ? 'text-indigo-500' : 'text-gray-400'}`} />
                                        <div className="ml-3 flex-1 min-w-0 pr-6">
                                            {editingConversation === c.id ? (
                                                <input
                                                    autoFocus
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateTitle(c.id);
                                                        if (e.key === 'Escape') setEditingConversation(null);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full bg-transparent outline-none text-sm font-bold"
                                                />
                                            ) : (
                                                <p className="text-sm font-bold truncate">{c.title || 'Untitled Chat'}</p>
                                            )}
                                        </div>
                                        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical size={14} onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(showOptionsMenu === c.id ? null : c.id); }} />
                                            {showOptionsMenu === c.id && (
                                                <div className={`absolute right-0 top-full mt-1 z-50 w-32 rounded-lg border shadow-xl overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                                    <button onClick={() => startEditing(c)} className={`w-full flex items-center px-3 py-2 text-xs ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                                                        <Edit size={12} className="mr-2" /> Rename
                                                    </button>
                                                    <button onClick={() => deleteConversation(c.id)} className="w-full flex items-center px-3 py-2 text-xs text-red-500 hover:bg-red-50">
                                                        <Trash2 size={12} className="mr-2" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center space-y-3">
                        {conversations.slice(0, 10).map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setCurrentConversation(c)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                    ${currentConversation?.id === c.id ? 'bg-indigo-500 text-white shadow-lg' : (isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')}`}
                            >
                                <MessageSquare size={18} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className={`p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} flex flex-col space-y-2`}>
                {hasToolCalls && !sidebarCollapsed && (
                    <button
                        onClick={handleOpenWorkflowBuilder}
                        className={`flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl font-bold text-xs transition-all border
                            ${isDarkMode ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                    >
                        <Workflow size={14} />
                        <span>Export Workflow</span>
                    </button>
                )}
                <button
                    onClick={() => {
                        createNewConversation();
                        if (window.innerWidth < 768) setSidebarCollapsed(true);
                    }}
                    className={`flex items-center justify-center space-x-2 w-full py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg
                        ${sidebarCollapsed ? 'p-0 h-12' : 'px-4'}
                        bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white`}
                >
                    {sidebarCollapsed ? <Plus size={24} /> : (
                        <>
                            <Sparkles size={18} />
                            <span className="text-sm">New Intelligence</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default ChatSidebar;
