
import React, { useState, useEffect, useRef } from 'react';
import { useCommandContext, Command } from '../contexts/CommandContext';
import { Search, Command as CommandIcon, ArrowRight, CornerDownLeft } from 'lucide-react';

const GlobalCommandPalette: React.FC = () => {
    const { isOpen, closePalette, commands } = useCommandContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);

    // Router navigation for default commands
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter commands
    useEffect(() => {
        if (!isOpen) return;

        const lowerSearch = searchTerm.toLowerCase();

        // prioritize: starts with > contains > keywords
        const filtered = commands.filter(cmd => {
            if (!searchTerm) return true;
            return cmd.name.toLowerCase().includes(lowerSearch) ||
                cmd.section?.toLowerCase().includes(lowerSearch) ||
                cmd.keywords?.some(k => k.toLowerCase().includes(lowerSearch));
        }).sort((a, b) => {
            // Simple sort: section then name
            if (a.section !== b.section) return (a.section || '') > (b.section || '') ? 1 : -1;
            return a.name.localeCompare(b.name);
        });

        // Add some default navigation commands if empty or matching
        // Actually, better to register these in App.tsx to keep this component pure UI-ish
        // But for "Speed Layer", having built-ins here is fine.

        setFilteredCommands(filtered);
        setSelectedIndex(0);
    }, [searchTerm, commands, isOpen]);

    // Handle Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    closePalette();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, closePalette]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Scroll to selected
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={closePalette}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[60vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header / Input */}
                <div className="flex items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 placeholder:text-gray-400 font-medium"
                    />
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 font-medium px-2 py-1 bg-gray-200/50 rounded-md border border-gray-200">
                        <span className="text-[10px]">ESC</span>
                    </div>
                </div>

                {/* List */}
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto p-2 scrollbar-hide"
                >
                    {filteredCommands.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <CommandIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No commands found</p>
                        </div>
                    ) : (
                        filteredCommands.map((cmd, index) => {
                            const isSelected = index === selectedIndex;
                            return (
                                <button
                                    key={cmd.id}
                                    onClick={() => { cmd.action(); closePalette(); }}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-75 group
                                        ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}
                                    `}
                                >
                                    {/* Icon Box */}
                                    <div className={`
                                        w-8 h-8 rounded-md flex items-center justify-center shrink-0
                                        ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}
                                    `}>
                                        {cmd.icon || <CommandIcon className="w-4 h-4" />}
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                {cmd.name}
                                            </span>
                                            {cmd.section && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wide font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    {cmd.section}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Shortcut / Enter */}
                                    {isSelected ? (
                                        <div className="text-white/70 animate-in fade-in slide-in-from-left-1">
                                            <CornerDownLeft className="w-4 h-4" />
                                        </div>
                                    ) : cmd.shortcut ? (
                                        <div className="flex gap-1">
                                            {cmd.shortcut.map(k => (
                                                <kbd key={k} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 font-sans min-w-[20px] text-center">
                                                    {k}
                                                </kbd>
                                            ))}
                                        </div>
                                    ) : null}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-400 flex justify-between items-center">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> Select
                        </span>
                        <span className="flex items-center gap-1">
                            <CornerDownLeft className="w-3 h-3" /> Run
                        </span>
                    </div>
                    <div>
                        Arrotech Hub AI
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalCommandPalette;
