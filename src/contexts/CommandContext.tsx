
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Command {
    id: string;
    name: string;
    action: () => void;
    section?: string;
    icon?: React.ReactNode;
    keywords?: string[]; // For filtering
    shortcut?: string[]; // e.g. ['ctrl', 's']
}

interface CommandContextType {
    isOpen: boolean;
    openPalette: () => void;
    closePalette: () => void;
    togglePalette: () => void;
    registerCommand: (command: Command) => void;
    unregisterCommand: (commandId: string) => void;
    commands: Command[];
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export const CommandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [commands, setCommands] = useState<Command[]>([]);

    const openPalette = useCallback(() => setIsOpen(true), []);
    const closePalette = useCallback(() => setIsOpen(false), []);
    const togglePalette = useCallback(() => setIsOpen(prev => !prev), []);

    const registerCommand = useCallback((command: Command) => {
        setCommands(prev => {
            // Prevent duplicates
            if (prev.some(c => c.id === command.id)) return prev;
            return [...prev, command];
        });
    }, []);

    const unregisterCommand = useCallback((commandId: string) => {
        setCommands(prev => prev.filter(c => c.id !== commandId));
    }, []);

    // Keyboard shortcut to open (Cmd+K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                togglePalette();
            }
            if (e.key === 'Escape' && isOpen) {
                closePalette();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, togglePalette, closePalette]);

    return (
        <CommandContext.Provider value={{
            isOpen,
            openPalette,
            closePalette,
            togglePalette,
            registerCommand,
            unregisterCommand,
            commands
        }}>
            {children}
        </CommandContext.Provider>
    );
};

export const useCommandContext = () => {
    const context = useContext(CommandContext);
    if (!context) {
        throw new Error('useCommandContext must be used within a CommandProvider');
    }
    return context;
};
