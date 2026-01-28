
import { useEffect } from 'react';
import { useCommandContext, Command } from '../contexts/CommandContext';

export const useCommand = (command: Command) => {
    const { registerCommand, unregisterCommand } = useCommandContext();

    useEffect(() => {
        registerCommand(command);
        return () => unregisterCommand(command.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registerCommand, unregisterCommand, command.id, command.name, JSON.stringify(command.shortcut)]);
};

/**
 * Hook to programmatically control the palette
 */
export const usePaletteControl = () => {
    const { openPalette, closePalette, togglePalette, isOpen } = useCommandContext();
    return { openPalette, closePalette, togglePalette, isOpen };
};
