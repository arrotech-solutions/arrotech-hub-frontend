import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onFocusInput: () => void;
  onCancelStream: () => void;
  onEditLastMessage?: () => void;
  isStreaming: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

/**
 * Global keyboard shortcuts for the chat interface.
 * 
 * Shortcuts:
 * - Ctrl/Cmd + Shift + O  → New conversation
 * - Ctrl/Cmd + Shift + S  → Toggle sidebar
 * - Shift + Escape         → Focus chat input
 * - Escape                 → Cancel stream (when streaming) / blur input
 * - Ctrl/Cmd + ArrowUp    → Edit last user message
 */
export function useKeyboardShortcuts({
  onNewChat,
  onToggleSidebar,
  onFocusInput,
  onCancelStream,
  onEditLastMessage,
  isStreaming,
  inputRef,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;
    const target = e.target as HTMLElement;
    const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // Ctrl/Cmd + Shift + O → New conversation
    if (isMod && e.shiftKey && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      onNewChat();
      return;
    }

    // Ctrl/Cmd + Shift + S → Toggle sidebar
    if (isMod && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      onToggleSidebar();
      return;
    }

    // Shift + Escape → Focus chat input
    if (e.shiftKey && e.key === 'Escape') {
      e.preventDefault();
      onFocusInput();
      return;
    }

    // Escape → Cancel stream or blur input
    if (e.key === 'Escape' && !e.shiftKey) {
      if (isStreaming) {
        e.preventDefault();
        onCancelStream();
        return;
      }
      // If in input, blur it
      if (isInInput && inputRef.current) {
        inputRef.current.blur();
        return;
      }
    }

    // Ctrl/Cmd + ArrowUp → Edit last user message
    if (isMod && e.key === 'ArrowUp' && !e.shiftKey) {
      e.preventDefault();
      onEditLastMessage?.();
      return;
    }
  }, [onNewChat, onToggleSidebar, onFocusInput, onCancelStream, onEditLastMessage, isStreaming, inputRef]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
