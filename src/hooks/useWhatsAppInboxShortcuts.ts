import { useEffect, useCallback } from 'react';

interface WhatsAppInboxShortcutsConfig {
    contacts: { id: number }[];
    selectedContactId: number | null;
    onSelectContact: (id: number) => void;
    onFocusSearch: () => void;
    onFocusComposer: () => void;
    onClearSelection: () => void;
    searchRef: React.RefObject<HTMLInputElement>;
    composerRef: React.RefObject<HTMLTextAreaElement>;
    enabled?: boolean;
}

/**
 * WhatsApp inbox keyboard shortcuts:
 * - j / k — next / previous conversation
 * - / — focus search
 * - Escape — clear selected conversation (desktop)
 */
export function useWhatsAppInboxShortcuts({
    contacts,
    selectedContactId,
    onSelectContact,
    onFocusSearch,
    onFocusComposer,
    onClearSelection,
    searchRef,
    composerRef,
    enabled = true,
}: WhatsAppInboxShortcutsConfig) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!enabled) return;
            const target = e.target as HTMLElement;
            const isInInput =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable;

            if (e.key === '/' && !isInInput) {
                e.preventDefault();
                onFocusSearch();
                searchRef.current?.focus();
                return;
            }

            if (e.key === 'Escape' && !e.shiftKey) {
                if (isInInput) {
                    (target as HTMLElement).blur();
                    return;
                }
                onClearSelection();
                return;
            }

            if (isInInput && !e.metaKey && !e.ctrlKey) return;

            if (e.key === 'j' || e.key === 'k') {
                if (contacts.length === 0) return;
                e.preventDefault();
                const idx = contacts.findIndex((c) => c.id === selectedContactId);
                const delta = e.key === 'j' ? 1 : -1;
                const nextIdx = Math.max(0, Math.min(contacts.length - 1, (idx < 0 ? 0 : idx) + delta));
                onSelectContact(contacts[nextIdx].id);
                return;
            }

            if (e.key === 'Enter' && e.metaKey) {
                e.preventDefault();
                onFocusComposer();
                composerRef.current?.focus();
            }
        },
        [
            enabled,
            contacts,
            selectedContactId,
            onSelectContact,
            onFocusSearch,
            onFocusComposer,
            onClearSelection,
            searchRef,
            composerRef,
        ]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
