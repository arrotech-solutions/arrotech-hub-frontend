import React, { useState, useEffect } from 'react';
import { Search, Calendar, MessageSquare, CheckSquare, Settings, Plus, Zap } from 'lucide-react';

interface CommandPaletteProps {
    onCreateTask: () => void;
    onComposeMessage: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onCreateTask, onComposeMessage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex] = useState(0);

    const actions = [
        { id: 'new-task', title: 'Create New Task', icon: <CheckSquare className="w-4 h-4" />, shortcut: 'C', action: onCreateTask },
        { id: 'compose', title: 'Compose Message', icon: <MessageSquare className="w-4 h-4" />, shortcut: 'M', action: onComposeMessage },
        { id: 'calendar', title: 'View Calendar', icon: <Calendar className="w-4 h-4" />, shortcut: 'V', action: () => console.log('View Calendar') },
        { id: 'focus', title: 'Toggle Focus Mode', icon: <Zap className="w-4 h-4" />, shortcut: 'F', action: () => console.log('Toggle Focus') },
        { id: 'connect', title: 'Connect Integration', icon: <Plus className="w-4 h-4" />, shortcut: 'I', action: () => console.log('Connect') },
        { id: 'settings', title: 'Settings', icon: <Settings className="w-4 h-4" />, shortcut: 'S', action: () => console.log('Settings') },
    ];

    const filteredActions = actions.filter(action =>
        action.title.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelect = (action: () => void) => {
        action();
        setIsOpen(false);
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden flex flex-col">
                {/* Search Input */}
                <div className="flex items-center p-4 border-b border-gray-200/50">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        type="text"
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent border-none outline-none text-lg text-gray-800 placeholder:text-gray-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400 px-2 py-1 bg-gray-100 rounded-md">ESC</span>
                    </div>
                </div>

                {/* Results */}
                <div className="p-2 max-h-[300px] overflow-y-auto">
                    {filteredActions.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No results found.</div>
                    ) : (
                        <div className="space-y-1">
                            {filteredActions.map((action, index) => (
                                <button
                                    key={action.id}
                                    onClick={() => handleSelect(action.action)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${index === activeIndex ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${index === activeIndex ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {action.icon}
                                        </div>
                                        <span className="font-medium">{action.title}</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-400 bg-white/50 px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                                        {action.shortcut}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 px-4">
                    <div className="flex gap-4">
                        <span><strong className="font-semibold text-gray-500">↑↓</strong> to navigate</span>
                        <span><strong className="font-semibold text-gray-500">↵</strong> to select</span>
                    </div>
                    <span>Arrotech Hub AI</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
