import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, Phone, MoreVertical, Send, User, Shield, Info, Image as ImageIcon,
    Paperclip, CheckCheck, Check, Clock, Plus, Bot, Tag, Filter, UserCircle, Star, ArrowLeft, Loader2,
    X, MessageSquare, CircleDot, Archive, SlidersHorizontal, Zap, FileText, Ban, StarOff, Edit3, Save, Trash2,
    CheckSquare, Square, Camera, Download, Upload, BarChart2, Moon, AlertTriangle,
    ShoppingCart, CreditCard, UserCheck, LayoutTemplate, Users, Sparkles, Wrench, BellOff, Bell
} from 'lucide-react';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import ContactAvatar from './ContactAvatar';
import WhatsAppMessageMedia from './WhatsAppMessageMedia';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useWhatsAppInboxShortcuts } from '../../hooks/useWhatsAppInboxShortcuts';
import { useAuth } from '../../hooks/useAuth';

const SAVED_SEGMENTS_KEY = 'wa_inbox_segments';
const FLOATING_MENU_WIDTH = 256;

function computeFloatingMenuPosition(anchor: HTMLElement): { top: number; left: number } {
    const rect = anchor.getBoundingClientRect();
    const margin = 12;
    let left = rect.right - FLOATING_MENU_WIDTH;
    left = Math.max(margin, Math.min(left, window.innerWidth - FLOATING_MENU_WIDTH - margin));
    return { top: rect.bottom + 8, left };
}

export interface Contact {
    id: number;
    phone_number: string;
    name: string | null;
    profile_name: string | null;
    avatar_url?: string | null;
    tags: string[];
    notes: string | null;
    message_count: number;
    unread_count: number;
    first_message_at: string | null;
    last_message_at: string | null;
    last_message_preview?: string | null;
    is_blocked: boolean;
    opted_out?: boolean;
    snoozed_until?: string | null;
    first_inbound_at?: string | null;
    assigned_to_id?: string | null;
    status?: string;
    is_starred?: boolean;
    created_at: string;
}

export interface Message {
    id: number;
    direction: 'incoming' | 'outgoing';
    message_type: string;
    content: string | null;
    media_url: string | null;
    status: string;
    is_auto_reply: boolean;
    is_agent?: boolean;
    is_internal_note?: boolean;
    created_at: string;
    delivered_at: string | null;
    read_at: string | null;
}

export interface QuickReply {
    id: number;
    title: string;
    shortcut: string;
    content: string;
    category: string | null;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface InboxSettingsSla {
    sla_first_response_minutes: number;
    notify_new_message_browser?: boolean;
    notify_new_message_sound?: boolean;
    notify_new_message_email?: boolean;
    notify_sla_breach?: boolean;
    csat_enabled?: boolean;
}

const DEMO_BOT_PHONE = '254796391205';

interface ConversationsTabProps {
    contacts: Contact[];
    selectedContact: Contact | null;
    setSelectedContact: (contact: Contact | null) => void;
    messages: Message[];
    setMessages: (messages: Message[]) => void;
    setContacts: (contacts: Contact[]) => void;
    fetchContacts: () => void;
    fetchMessages: (contactId: number) => void;
    messagesLoading?: boolean;
    sharedTeamMembers?: TeamMember[];
    sharedInboxSettings?: InboxSettingsSla;
    sharedQuickReplies?: QuickReply[];
    onSharedQuickRepliesChange?: (replies: QuickReply[]) => void;
}

type StatusFilter = 'all' | 'open' | 'pending' | 'resolved' | 'closed';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    open: { label: 'Open', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', dot: 'bg-emerald-500' },
    pending: { label: 'Pending', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', dot: 'bg-amber-500' },
    resolved: { label: 'Resolved', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', dot: 'bg-blue-500' },
    closed: { label: 'Closed', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-400' },
};

interface SavedSegment {
    id: string;
    name: string;
    status?: StatusFilter;
    filterAgent?: string;
    filterStarred?: boolean;
    filterUnread?: boolean;
    filterSlaBreached?: boolean;
    tag?: string;
}

const BUILTIN_SEGMENTS: SavedSegment[] = [
    { id: 'unread-open', name: 'Unread + Open', status: 'open', filterUnread: true },
    { id: 'sla-breached', name: 'SLA breached', filterSlaBreached: true },
    { id: 'vip', name: 'VIP tag', tag: 'vip' },
    { id: 'failed-payment', name: 'Failed payment', tag: 'failed_payment' },
];

function loadSavedSegments(): SavedSegment[] {
    try {
        const raw = localStorage.getItem(SAVED_SEGMENTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function persistSavedSegments(segments: SavedSegment[]) {
    localStorage.setItem(SAVED_SEGMENTS_KEY, JSON.stringify(segments));
}

export const ConversationsTab: React.FC<ConversationsTabProps> = ({
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    setMessages,
    setContacts,
    fetchContacts,
    fetchMessages,
    messagesLoading = false,
    sharedTeamMembers,
    sharedInboxSettings,
    sharedQuickReplies,
    onSharedQuickRepliesChange,
}) => {
    const { user } = useAuth();
    const { lastEvent, sendPresence, isConnected } = useWebSocket();
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(true);
    const [localTeamMembers, setLocalTeamMembers] = useState<TeamMember[]>([]);
    const [localQuickReplies, setLocalQuickReplies] = useState<QuickReply[]>([]);
    const teamMembers = sharedTeamMembers ?? localTeamMembers;
    const quickReplies = sharedQuickReplies ?? localQuickReplies;
    const updateQuickReplies = useCallback(
        (next: QuickReply[] | ((prev: QuickReply[]) => QuickReply[])) => {
            if (sharedQuickReplies && onSharedQuickRepliesChange) {
                const resolved =
                    typeof next === 'function' ? next(sharedQuickReplies) : next;
                onSharedQuickRepliesChange(resolved);
                return;
            }
            setLocalQuickReplies(next);
        },
        [sharedQuickReplies, onSharedQuickRepliesChange]
    );
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filterAgent, setFilterAgent] = useState<string>('');
    const [filterStarred, setFilterStarred] = useState(false);
    const [filterUnread, setFilterUnread] = useState(false);
    const [filterSlaBreached, setFilterSlaBreached] = useState(false);
    const [showTeamQueue, setShowTeamQueue] = useState(false);
    const [teamQueue, setTeamQueue] = useState<{ workload: { agent_id: string; name: string; open_count: number }[]; unassigned: Contact[] } | null>(null);
    const [mcpRunning, setMcpRunning] = useState(false);
    const [aiDraftLoading, setAiDraftLoading] = useState(false);
    const [showNewContactModal, setShowNewContactModal] = useState(false);
    const [newContactPhone, setNewContactPhone] = useState('');
    const [newContactName, setNewContactName] = useState('');
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState('');
    const [newTag, setNewTag] = useState('');
    const [showQuickReplyManager, setShowQuickReplyManager] = useState(false);
    const [qrTitle, setQrTitle] = useState('');
    const [qrShortcut, setQrShortcut] = useState('');
    const [qrContent, setQrContent] = useState('');
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk'>('single');
    const [deleting, setDeleting] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const [messageSearch, setMessageSearch] = useState('');
    const [commerceContext, setCommerceContext] = useState<any>(null);
    const [presenceViewers, setPresenceViewers] = useState<{ user_id: string; name: string }[]>([]);
    const [localInboxSettings, setLocalInboxSettings] = useState<InboxSettingsSla>({
        sla_first_response_minutes: 5,
    });
    const inboxSettings = sharedInboxSettings ?? localInboxSettings;
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [templates, setTemplates] = useState<{ id: string; name: string; language: string; status?: string }[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [editingQuickReply, setEditingQuickReply] = useState<QuickReply | null>(null);
    const [showSegmentsMenu, setShowSegmentsMenu] = useState(false);
    const [filterTag, setFilterTag] = useState('');
    const [savedSegments, setSavedSegments] = useState<SavedSegment[]>(loadSavedSegments);
    const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesScrollRef = useRef<HTMLDivElement>(null);
    const prevContactIdRef = useRef<number | null>(null);
    const filterBtnRef = useRef<HTMLButtonElement>(null);
    const segmentsBtnRef = useRef<HTMLButtonElement>(null);
    const filterPortalRef = useRef<HTMLDivElement>(null);
    const segmentsPortalRef = useRef<HTMLDivElement>(null);
    const [filterMenuPos, setFilterMenuPos] = useState<{ top: number; left: number } | null>(null);
    const [segmentsMenuPos, setSegmentsMenuPos] = useState<{ top: number; left: number } | null>(null);
    const composerRef = useRef<HTMLTextAreaElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const skipInitialContactFetch = useRef(contacts.length > 0);

    const loadContactsFromServer = useCallback(async () => {
        try {
            const response = await apiService.getWhatsAppContacts({
                search: searchQuery || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                assigned_to: filterAgent || undefined,
                is_starred: filterStarred || undefined,
                has_unread: filterUnread || undefined,
                tag: filterTag || undefined,
                sla_breached: filterSlaBreached || undefined,
                include_snoozed: filterSlaBreached ? undefined : false,
            });
            if (response.success) setContacts(response.data);
        } catch {
            /* ignore */
        }
    }, [searchQuery, statusFilter, filterAgent, filterStarred, filterUnread, filterTag, filterSlaBreached, setContacts]);

    // Close filter/segment menus when clicking outside
    useEffect(() => {
        if (!showFilterMenu && !showSegmentsMenu) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                showFilterMenu &&
                !filterBtnRef.current?.contains(target) &&
                !filterPortalRef.current?.contains(target)
            ) {
                setShowFilterMenu(false);
                setFilterMenuPos(null);
            }
            if (
                showSegmentsMenu &&
                !segmentsBtnRef.current?.contains(target) &&
                !segmentsPortalRef.current?.contains(target)
            ) {
                setShowSegmentsMenu(false);
                setSegmentsMenuPos(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFilterMenu, showSegmentsMenu]);

    useLayoutEffect(() => {
        if (!showFilterMenu || !filterBtnRef.current) return;
        const update = () => {
            if (filterBtnRef.current) {
                setFilterMenuPos(computeFloatingMenuPosition(filterBtnRef.current));
            }
        };
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [showFilterMenu]);

    useLayoutEffect(() => {
        if (!showSegmentsMenu || !segmentsBtnRef.current) return;
        const update = () => {
            if (segmentsBtnRef.current) {
                setSegmentsMenuPos(computeFloatingMenuPosition(segmentsBtnRef.current));
            }
        };
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [showSegmentsMenu]);

    const toggleFilterMenu = () => {
        setShowSegmentsMenu(false);
        setSegmentsMenuPos(null);
        setShowFilterMenu((open) => {
            const next = !open;
            if (next && filterBtnRef.current) {
                setFilterMenuPos(computeFloatingMenuPosition(filterBtnRef.current));
            } else {
                setFilterMenuPos(null);
            }
            return next;
        });
    };

    const toggleSegmentsMenu = () => {
        setShowFilterMenu(false);
        setFilterMenuPos(null);
        setShowSegmentsMenu((open) => {
            const next = !open;
            if (next && segmentsBtnRef.current) {
                setSegmentsMenuPos(computeFloatingMenuPosition(segmentsBtnRef.current));
            } else {
                setSegmentsMenuPos(null);
            }
            return next;
        });
    };

    const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
        const container = messagesScrollRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior });
    }, []);

    // Keep the latest messages in view when opening a chat or when new messages arrive
    useLayoutEffect(() => {
        if (!selectedContact || messages.length === 0) return;
        const contactChanged = prevContactIdRef.current !== selectedContact.id;
        prevContactIdRef.current = selectedContact.id;
        scrollMessagesToBottom(contactChanged ? 'auto' : 'smooth');
    }, [selectedContact?.id, messages, scrollMessagesToBottom]);

    // Load inbox metadata only when parent has not already fetched it
    useEffect(() => {
        if (sharedTeamMembers) return;
        apiService
            .getWhatsAppTeamMembers()
            .then((response) => {
                if (response.success) setLocalTeamMembers(response.data);
            })
            .catch((error) => {
                console.error('Error fetching team members:', error);
            });
    }, [sharedTeamMembers]);

    useEffect(() => {
        if (sharedQuickReplies) return;
        apiService
            .getWhatsAppQuickReplies()
            .then((response) => {
                if (response.success) setLocalQuickReplies(response.data);
            })
            .catch((error) => {
                console.error('Error fetching quick replies:', error);
            });
    }, [sharedQuickReplies]);

    useEffect(() => {
        if (sharedInboxSettings) return;
        apiService
            .getWhatsAppInboxSettings()
            .then((r) => {
                if (r.success && r.data) setLocalInboxSettings(r.data);
            })
            .catch(() => {
                /* defaults already in state */
            });
    }, [sharedInboxSettings]);

    // Real-time inbox via WebSocket (fallback poll every 60s)
    useEffect(() => {
        if (!lastEvent) return;
        if (
            lastEvent.type === 'whatsapp_new_message' ||
            lastEvent.type === 'whatsapp_contact_updated'
        ) {
            loadContactsFromServer();
            const cid = lastEvent.data?.contact_id;
            if (selectedContact && cid === String(selectedContact.id)) {
                fetchMessages(selectedContact.id);
            }
        }
        if (lastEvent.type === 'whatsapp_inbox_presence' && selectedContact) {
            const selfId = user?.id ? String(user.id) : '';
            const viewers = (lastEvent.data?.viewers || []).filter(
                (v: { user_id: string }) => v.user_id !== selfId
            );
            setPresenceViewers(viewers);
        }
    }, [lastEvent, selectedContact, fetchMessages, loadContactsFromServer, user?.id]);

    useEffect(() => {
        if (!lastEvent || lastEvent.type !== 'whatsapp_new_message') return;
        if (lastEvent.data?.direction !== 'incoming') return;
        if (document.hasFocus() && selectedContact && lastEvent.data?.contact_id === String(selectedContact.id)) {
            return;
        }

        const notifyBrowser = inboxSettings.notify_new_message_browser !== false;
        const notifySound = inboxSettings.notify_new_message_sound !== false;

        if (notifyBrowser && typeof Notification !== 'undefined') {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
            if (Notification.permission === 'granted') {
                new Notification('New WhatsApp message', {
                    body: 'You have a new customer message in your inbox.',
                    tag: 'wa-inbox',
                });
            }
        }

        if (notifySound) {
            try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                gain.gain.value = 0.05;
                osc.start();
                osc.stop(ctx.currentTime + 0.12);
            } catch {
                /* ignore */
            }
        }
    }, [lastEvent, selectedContact, inboxSettings.notify_new_message_browser, inboxSettings.notify_new_message_sound]);

    useEffect(() => {
        // Safety net: slower when WebSocket is live, faster when polling is the only path
        const intervalMs = isConnected ? 60000 : 15000;
        const fallback = setInterval(() => loadContactsFromServer(), intervalMs);
        return () => clearInterval(fallback);
    }, [loadContactsFromServer, isConnected]);

    useEffect(() => {
        if (!selectedContact || isConnected) return;
        const pollMessages = setInterval(() => {
            fetchMessages(selectedContact.id);
        }, 10000);
        return () => clearInterval(pollMessages);
    }, [selectedContact, fetchMessages, isConnected]);

    useEffect(() => {
        const hasInboxFilters =
            statusFilter !== 'all' ||
            !!filterAgent ||
            filterStarred ||
            filterUnread ||
            !!filterTag ||
            filterSlaBreached ||
            !!searchQuery;

        if (skipInitialContactFetch.current && !hasInboxFilters) {
            skipInitialContactFetch.current = false;
            return;
        }

        const debounce = setTimeout(() => loadContactsFromServer(), 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, statusFilter, filterAgent, filterStarred, filterUnread, filterTag, filterSlaBreached, loadContactsFromServer]);

    useEffect(() => {
        if (!showTeamQueue) return;
        apiService.getWhatsAppTeamQueue().then((r) => {
            if (r.success) setTeamQueue(r.data);
        });
    }, [showTeamQueue, contacts.length]);

    const inboxContactList = useMemo(
        () =>
            contacts.filter((c) => {
                const searchTarget = `${c.name || ''} ${c.profile_name || ''} ${c.phone_number || ''}`.toLowerCase();
                return searchTarget.includes(searchQuery.toLowerCase());
            }),
        [contacts, searchQuery]
    );

    useWhatsAppInboxShortcuts({
        contacts: inboxContactList,
        selectedContactId: selectedContact?.id ?? null,
        onSelectContact: (id) => {
            const found = contacts.find((c) => c.id === id);
            if (found) setSelectedContact(found);
        },
        onFocusSearch: () => searchInputRef.current?.focus(),
        onFocusComposer: () => composerRef.current?.focus(),
        onClearSelection: () => setSelectedContact(null),
        searchRef: searchInputRef,
        composerRef,
    });

    useEffect(() => {
        if (!selectedContact) {
            sendPresence(null);
            setCommerceContext(null);
            setPresenceViewers([]);
            return;
        }
        sendPresence(String(selectedContact.id));
        apiService.getWhatsAppCommerceContext(String(selectedContact.id)).then((r) => {
            if (r.success) setCommerceContext(r.data);
        });
        return () => sendPresence(null);
    }, [selectedContact, sendPresence]);
    useEffect(() => {
        if (selectedContact && selectedContact.unread_count > 0) {
            apiService.markWhatsAppConversationRead(selectedContact.id).catch(() => {});
        }
    }, [selectedContact]);

    // Set notes value when contact changes
    useEffect(() => {
        if (selectedContact) {
            setNotesValue(selectedContact.notes || '');
            setEditingNotes(false);
        }
    }, [selectedContact]);

    // Quick replies trigger (typing /)
    useEffect(() => {
        if (newMessage.startsWith('/') && newMessage.length > 1) {
            const query = newMessage.slice(1).toLowerCase();
            const matches = quickReplies.filter(qr =>
                qr.shortcut.toLowerCase().includes(query) || qr.title.toLowerCase().includes(query)
            );
            if (matches.length > 0) {
                setShowQuickReplies(true);
            }
        } else if (newMessage === '/') {
            setShowQuickReplies(true);
        } else {
            setShowQuickReplies(false);
        }
    }, [newMessage, quickReplies]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContact || !newMessage.trim()) return;

        setSendingMessage(true);
        try {
            const response = await apiService.sendWhatsAppMessage(
                selectedContact.id,
                {
                    content: newMessage.trim(),
                    message_type: 'text',
                    is_internal_note: isInternalNote
                }
            );
            if (response.success) {
                setMessages([...messages, response.data]);
                setNewMessage('');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleAttachMedia = () => {
        mediaInputRef.current?.click();
    };

    const handleAssignAgent = async (agentId: string) => {
        if (!selectedContact) return;
        const note = window.prompt('Internal note for reassignment (optional):');
        if (note === null) return;
        try {
            const response = await apiService.reassignWhatsAppContact(String(selectedContact.id), {
                assigned_to_id: agentId || null,
                note: note.trim() || undefined,
            });
            if (response.success) {
                toast.success('Agent reassigned');
                fetchContacts();
                loadContactsFromServer();
                setSelectedContact({ ...selectedContact, assigned_to_id: agentId || null });
                if (note.trim()) fetchMessages(selectedContact.id);
            }
        } catch {
            toast.error('Failed to assign agent');
        }
    };

    const handleToggleOptOut = async () => {
        if (!selectedContact) return;
        const next = !selectedContact.opted_out;
        try {
            const response = await apiService.updateWhatsAppContact(selectedContact.id, { opted_out: next });
            if (response.success) {
                toast.success(next ? 'Contact opted out of broadcasts' : 'Contact opted back in');
                fetchContacts();
                loadContactsFromServer();
                setSelectedContact({ ...selectedContact, opted_out: next });
            }
        } catch {
            toast.error('Failed to update opt-out');
        }
    };

    const handleUnsnooze = async () => {
        if (!selectedContact) return;
        try {
            await apiService.unsnoozeWhatsAppContact(String(selectedContact.id));
            toast.success('Conversation unsnoozed');
            loadContactsFromServer();
            fetchContacts();
            setSelectedContact({ ...selectedContact, snoozed_until: null });
        } catch {
            toast.error('Failed to unsnooze');
        }
    };

    const handleAiDraft = async () => {
        if (!selectedContact || messages.length === 0) {
            toast.error('Open a conversation with messages first');
            return;
        }
        setAiDraftLoading(true);
        try {
            const recent = messages.slice(-8).map((m) => ({
                id: String(m.id),
                source: 'whatsapp',
                sender: selectedContact.phone_number,
                subject: '',
                preview: m.content || '',
                full_content: m.content || '',
            }));
            const result = await apiService.analyzeMessages(recent);
            const enriched = Object.values(result.enriched || {})[0] as { quick_replies?: string[]; summary?: string } | undefined;
            const draft = enriched?.quick_replies?.[0] || enriched?.summary;
            if (draft) {
                setNewMessage(draft);
                composerRef.current?.focus();
                toast.success('AI draft inserted');
            } else {
                toast.error('No draft suggestion available');
            }
        } catch {
            toast.error('AI draft failed');
        } finally {
            setAiDraftLoading(false);
        }
    };

    const runMcpAction = async (operation: string) => {
        if (!selectedContact) return;
        setMcpRunning(true);
        try {
            const result = await apiService.executeTool('whatsapp_messaging', {
                operation,
                phone_number: selectedContact.phone_number,
            });
            toast.success(typeof result === 'object' && result?.message ? result.message : 'Agent action completed');
        } catch {
            toast.error('Agent action failed');
        } finally {
            setMcpRunning(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedContact) return;
        try {
            const response = await apiService.updateWhatsAppContact(selectedContact.id, {
                status: newStatus
            });
            if (response.success) {
                toast.success(`Status changed to ${newStatus}`);
                fetchContacts();
                setSelectedContact({ ...selectedContact, status: newStatus });
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleToggleStar = async () => {
        if (!selectedContact) return;
        try {
            const newVal = !selectedContact.is_starred;
            const response = await apiService.starWhatsAppContact(selectedContact.id, newVal);
            if (response.success) {
                toast.success(newVal ? 'Conversation starred' : 'Star removed');
                fetchContacts();
                setSelectedContact({ ...selectedContact, is_starred: newVal });
            }
        } catch (error) {
            toast.error('Failed to update star');
        }
    };

    const handleToggleBlock = async () => {
        if (!selectedContact) return;
        try {
            const response = await apiService.updateWhatsAppContact(selectedContact.id, {
                is_blocked: !selectedContact.is_blocked
            });
            if (response.success) {
                toast.success(selectedContact.is_blocked ? 'Contact unblocked' : 'Contact blocked');
                fetchContacts();
                setSelectedContact({ ...selectedContact, is_blocked: !selectedContact.is_blocked });
            }
        } catch (error) {
            toast.error('Failed to update block status');
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedContact) return;
        try {
            await apiService.updateWhatsAppContact(selectedContact.id, { notes: notesValue });
            toast.success('Notes saved');
            setEditingNotes(false);
            setSelectedContact({ ...selectedContact, notes: notesValue });
        } catch {
            toast.error('Failed to save notes');
        }
    };

    const handleAddTag = async () => {
        if (!selectedContact || !newTag.trim()) return;
        const tags = [...(selectedContact.tags || []), newTag.trim()];
        try {
            await apiService.updateWhatsAppContact(selectedContact.id, { tags });
            setSelectedContact({ ...selectedContact, tags });
            setNewTag('');
            fetchContacts();
        } catch {
            toast.error('Failed to add tag');
        }
    };

    const handleRemoveTag = async (tag: string) => {
        if (!selectedContact) return;
        const tags = (selectedContact.tags || []).filter(t => t !== tag);
        try {
            await apiService.updateWhatsAppContact(selectedContact.id, { tags });
            setSelectedContact({ ...selectedContact, tags });
            fetchContacts();
        } catch {
            toast.error('Failed to remove tag');
        }
    };

    const handleNewContact = async () => {
        if (!newContactPhone.trim()) return;
        try {
            const response = await apiService.createWhatsAppContact({
                phone_number: newContactPhone.trim(),
                name: newContactName.trim() || undefined
            });
            if (response.success) {
                toast.success('Contact created');
                setShowNewContactModal(false);
                setNewContactPhone('');
                setNewContactName('');
                fetchContacts();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create contact');
        }
    };

    const handleSelectQuickReply = (qr: QuickReply) => {
        setNewMessage(qr.content);
        setShowQuickReplies(false);
        composerRef.current?.focus();
    };

    const handleCreateQuickReply = async () => {
        if (!qrTitle.trim() || !qrShortcut.trim() || !qrContent.trim()) return;
        try {
            const response = await apiService.createWhatsAppQuickReply({
                title: qrTitle, shortcut: qrShortcut, content: qrContent
            });
            if (response.success) {
                updateQuickReplies([...quickReplies, response.data]);
                setQrTitle(''); setQrShortcut(''); setQrContent('');
                toast.success('Quick reply created');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create quick reply');
        }
    };

    const handleDeleteQuickReply = async (id: number) => {
        try {
            await apiService.deleteWhatsAppQuickReply(id);
            updateQuickReplies(quickReplies.filter(qr => qr.id !== id));
            toast.success('Quick reply deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    const toggleContactSelection = (contactId: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(contactId)) {
                next.delete(contactId);
            } else {
                next.add(contactId);
            }
            return next;
        });
    };

    const openDeleteModal = (target: 'single' | 'bulk') => {
        setDeleteTarget(target);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            if (deleteTarget === 'single' && selectedContact) {
                await apiService.deleteWhatsAppContact(String(selectedContact.id));
                toast.success('Contact deleted');
                setSelectedContact(null);
                setMessages([]);
            } else {
                const ids = Array.from(selectedIds).map(String);
                const response = await apiService.bulkDeleteWhatsAppContacts(ids);
                if (response.success) {
                    const count = response.deleted ?? ids.length;
                    toast.success(`Deleted ${count} contact${count === 1 ? '' : 's'}`);
                    if (selectedContact && selectedIds.has(selectedContact.id)) {
                        setSelectedContact(null);
                        setMessages([]);
                    }
                }
            }
            setShowDeleteModal(false);
            exitSelectionMode();
            fetchContacts();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete contact(s)');
        } finally {
            setDeleting(false);
        }
    };

    const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedContact) return;
        setUploadingAvatar(true);
        try {
            const response = await apiService.uploadWhatsAppContactAvatar(String(selectedContact.id), file);
            if (response.success) {
                const updated = { ...selectedContact, avatar_url: response.data.avatar_url };
                setSelectedContact(updated);
                fetchContacts();
                toast.success('Photo updated');
            }
        } catch {
            toast.error('Failed to upload photo');
        } finally {
            setUploadingAvatar(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        if (!selectedContact) return;
        try {
            const response = await apiService.deleteWhatsAppContactAvatar(String(selectedContact.id));
            if (response.success) {
                setSelectedContact({ ...selectedContact, avatar_url: null });
                fetchContacts();
                toast.success('Photo removed');
            }
        } catch {
            toast.error('Failed to remove photo');
        }
    };

    const getContactLabel = (contact: Contact) =>
        contact.name || contact.profile_name || contact.phone_number;

    const deleteModalCount = deleteTarget === 'single' ? 1 : selectedIds.size;

    const isHumanHandoff = (contact: Contact | null) =>
        Boolean(contact?.tags?.includes('human_handoff') || commerceContext?.human_handoff);

    const isSlaBreached = (contact: Contact) => {
        if ((contact.status || 'open') !== 'open' || !contact.first_inbound_at) return false;
        const slaMs = (inboxSettings.sla_first_response_minutes || 5) * 60 * 1000;
        return Date.now() - new Date(contact.first_inbound_at).getTime() > slaMs;
    };

    const filteredMessages = messages.filter((m) => {
        if (!messageSearch.trim()) return true;
        return (m.content || '').toLowerCase().includes(messageSearch.toLowerCase());
    });

    const handleReleaseAgent = async () => {
        if (!selectedContact) return;
        try {
            const res = await apiService.releaseWhatsAppAgent(String(selectedContact.id));
            if (res.success) {
                toast.success('AI agent resumed');
                const tags = (selectedContact.tags || []).filter((t) => t !== 'human_handoff');
                setSelectedContact({ ...selectedContact, tags });
                const r = await apiService.getWhatsAppCommerceContext(String(selectedContact.id));
                if (r.success) setCommerceContext(r.data);
                fetchContacts();
            }
        } catch {
            toast.error('Failed to release agent');
        }
    };

    const handleTakeOverFromAi = async () => {
        if (!selectedContact) return;
        try {
            const tags = [...new Set([...(selectedContact.tags || []), 'human_handoff'])];
            const res = await apiService.updateWhatsAppContact(selectedContact.id, { tags });
            if (res.success) {
                toast.success('You are now handling this conversation');
                setSelectedContact({ ...selectedContact, tags });
                const r = await apiService.getWhatsAppCommerceContext(String(selectedContact.id));
                if (r.success) setCommerceContext(r.data);
            }
        } catch {
            toast.error('Failed to take over conversation');
        }
    };

    const applySegment = (segment: SavedSegment) => {
        if (segment.status) setStatusFilter(segment.status);
        else setStatusFilter('all');
        setFilterAgent(segment.filterAgent || '');
        setFilterStarred(Boolean(segment.filterStarred));
        setFilterUnread(Boolean(segment.filterUnread));
        setFilterSlaBreached(Boolean(segment.filterSlaBreached));
        setFilterTag(segment.tag || '');
        setActiveSegmentId(segment.id);
        setShowSegmentsMenu(false);
        setSegmentsMenuPos(null);
        setShowFilterMenu(false);
        setFilterMenuPos(null);
    };

    const clearSegmentFilters = () => {
        setFilterAgent('');
        setFilterStarred(false);
        setFilterUnread(false);
        setFilterSlaBreached(false);
        setFilterTag('');
        setActiveSegmentId(null);
    };

    const saveCurrentAsSegment = () => {
        const name = window.prompt('Segment name');
        if (!name?.trim()) return;
        const segment: SavedSegment = {
            id: `custom-${Date.now()}`,
            name: name.trim(),
            status: statusFilter !== 'all' ? statusFilter : undefined,
            filterAgent: filterAgent || undefined,
            filterStarred: filterStarred || undefined,
            filterUnread: filterUnread || undefined,
            filterSlaBreached: filterSlaBreached || undefined,
            tag: filterTag || undefined,
        };
        const next = [...savedSegments, segment];
        setSavedSegments(next);
        persistSavedSegments(next);
        setActiveSegmentId(segment.id);
        toast.success('Segment saved');
    };

    const handleResendPaymentLink = async () => {
        if (!selectedContact || !commerceContext?.order_id) return;
        const amount = commerceContext.payment_amount != null ? ` KES ${commerceContext.payment_amount}` : '';
        const text = `Hi! Here is your payment link for order ${commerceContext.order_id}${amount}. Please complete M-Pesa payment to confirm your order.`;
        try {
            const res = await apiService.sendWhatsAppMessage(selectedContact.id, { content: text });
            if (res.success) {
                setMessages([...messages, res.data]);
                toast.success('Payment reminder sent');
            }
        } catch {
            toast.error('Failed to send payment reminder');
        }
    };

    const handleSnooze = async (hours: number) => {
        if (!selectedContact) return;
        const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        try {
            await apiService.snoozeWhatsAppContact(String(selectedContact.id), until);
            toast.success(`Snoozed for ${hours}h`);
            setSelectedContact(null);
            loadContactsFromServer();
        } catch {
            toast.error('Failed to snooze');
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedContact) return;
        try {
            const res = await apiService.uploadWhatsAppChatMedia(String(selectedContact.id), file);
            if (res.success) {
                setMessages([...messages, res.data]);
                toast.success('Media sent');
            }
        } catch {
            toast.error('Failed to send media');
        } finally {
            if (mediaInputRef.current) mediaInputRef.current.value = '';
        }
    };

    const handleSendTemplate = async () => {
        if (!selectedContact || !selectedTemplate) return;
        const tpl = templates.find((t) => t.id === selectedTemplate);
        if (!tpl) return;
        try {
            const res = await apiService.sendWhatsAppTemplateMessage(String(selectedContact.id), {
                template_name: tpl.name,
                language_code: tpl.language || 'en',
            });
            if (res.success) {
                setMessages([...messages, res.data]);
                setShowTemplatePicker(false);
                toast.success('Template sent');
            }
        } catch {
            toast.error('Failed to send template');
        }
    };

    const handleExportContacts = async () => {
        try {
            const blob = await apiService.exportWhatsAppContacts();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'whatsapp-contacts.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Export failed');
        }
    };

    const handleImportContacts = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await apiService.importWhatsAppContacts(file);
            if (res.success) {
                toast.success(`Imported ${res.created} contacts (${res.skipped} skipped)`);
                loadContactsFromServer();
            }
        } catch {
            toast.error('Import failed');
        } finally {
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    const handleSaveQuickReplyEdit = async () => {
        if (!editingQuickReply) return;
        try {
            const res = await apiService.updateWhatsAppQuickReply(editingQuickReply.id, {
                title: editingQuickReply.title,
                shortcut: editingQuickReply.shortcut,
                content: editingQuickReply.content,
            });
            if (res.success) {
                updateQuickReplies(quickReplies.map((q) => (q.id === editingQuickReply.id ? res.data : q)));
                setEditingQuickReply(null);
                toast.success('Quick reply updated');
            }
        } catch {
            toast.error('Failed to update quick reply');
        }
    };

    const openTemplatePicker = async () => {
        setShowTemplatePicker(true);
        try {
            const resp = await apiService.getWhatsAppTemplates();
            if (resp.success) setTemplates(resp.data || []);
        } catch {
            /* ignore */
        }
    };

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const MessageStatusIcon = ({ status, isInternal }: { status: string, isInternal?: boolean }) => {
        if (isInternal) return <Shield className="w-3 h-3 ml-1" />;
        switch (status) {
            case 'sent': return <Check className="w-3 h-3 ml-1" />;
            case 'delivered': return <CheckCheck className="w-3 h-3 ml-1 text-slate-400" />;
            case 'read': return <CheckCheck className="w-3 h-3 ml-1 text-blue-400" />;
            case 'failed': return <Info className="w-3 h-3 ml-1 text-red-400" />;
            default: return <Clock className="w-3 h-3 ml-1" />;
        }
    };

    const filteredContacts = inboxContactList;

    const statusCounts = {
        all: contacts.length,
        open: contacts.filter(c => (c.status || 'open') === 'open').length,
        pending: contacts.filter(c => c.status === 'pending').length,
        resolved: contacts.filter(c => c.status === 'resolved').length,
        closed: contacts.filter(c => c.status === 'closed').length,
    };

    const contactStatus = (selectedContact?.status || 'open');
    const currentStatusConfig = STATUS_CONFIG[contactStatus] || STATUS_CONFIG.open;

    return (
        <div className="flex flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl border-y sm:border dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-100">
            {/* Left Pane: Conversations List */}
            <div className={`w-full md:w-80 lg:w-96 xl:w-[22rem] flex-shrink-0 border-r dark:border-slate-800 flex flex-col min-h-0 transition-transform duration-300 ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-3 sm:p-4 border-b dark:border-slate-800 space-y-2 sm:space-y-3 shrink-0">
                    <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white shrink-0 pt-1">Inbox</h2>
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowTeamQueue((v) => !v)}
                                className={`p-2 rounded-lg transition-colors ${showTeamQueue ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                title="Team queue"
                            >
                                <Users className="w-5 h-5" />
                            </button>
                            <button
                                ref={filterBtnRef}
                                type="button"
                                onClick={toggleFilterMenu}
                                className={`p-2 rounded-lg transition-colors ${(filterAgent || filterStarred || filterUnread || filterTag || filterSlaBreached) ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                title="Filters"
                                aria-expanded={showFilterMenu}
                                aria-haspopup="true"
                            >
                                <SlidersHorizontal className="w-5 h-5" />
                            </button>
                            <button
                                ref={segmentsBtnRef}
                                type="button"
                                onClick={toggleSegmentsMenu}
                                className={`p-2 rounded-lg transition-colors ${activeSegmentId ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                title="Saved segments"
                                aria-expanded={showSegmentsMenu}
                                aria-haspopup="true"
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    if (selectionMode) {
                                        exitSelectionMode();
                                    } else {
                                        setSelectionMode(true);
                                    }
                                }}
                                className={`p-2 rounded-lg transition-colors ${selectionMode ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                title={selectionMode ? 'Cancel selection' : 'Select contacts'}
                            >
                                {selectionMode ? <X className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setShowQuickReplyManager(!showQuickReplyManager)}
                                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Quick Replies"
                            >
                                <Zap className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleExportContacts}
                                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Export contacts CSV"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => importInputRef.current?.click()}
                                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Import contacts CSV"
                            >
                                <Upload className="w-5 h-5" />
                            </button>
                            <input ref={importInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportContacts} />
                            <button
                                type="button"
                                onClick={() => setShowNewContactModal(true)}
                                className="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                                title="New Contact"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <p
                        className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"
                        title={isConnected ? 'Live updates via WebSocket' : 'Polling for updates (WebSocket disconnected)'}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                        {isConnected ? 'Live updates' : 'Polling for updates'}
                    </p>

                    {/* Status Filter Tabs */}
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
                        {(['all', 'open', 'pending', 'resolved', 'closed'] as StatusFilter[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${statusFilter === s
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
                                <span className={`ml-1 ${statusFilter === s ? 'text-green-100' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {statusCounts[s]}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search conversations... (press /)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                {showTeamQueue && teamQueue && (
                    <div className="mx-3 mb-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs space-y-2 shrink-0">
                        <p className="font-semibold text-blue-900 dark:text-blue-200">Team workload</p>
                        <div className="flex flex-wrap gap-2">
                            {teamQueue.workload.map((w) => (
                                <span key={w.agent_id} className="px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {w.name}: {w.open_count}
                                </span>
                            ))}
                        </div>
                        {teamQueue.unassigned.length > 0 && (
                            <p className="text-slate-600 dark:text-slate-400">{teamQueue.unassigned.length} unassigned in queue</p>
                        )}
                    </div>
                )}

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {filteredContacts.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 space-y-4">
                            <Bot className="w-12 h-12 mx-auto opacity-50" />
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-300">No conversations yet</p>
                                <p className="text-sm mt-1">Messages from customers will appear here in real time.</p>
                            </div>
                            <a
                                href={`https://wa.me/${DEMO_BOT_PHONE}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Try the demo bot
                            </a>
                            <p className="text-[11px] text-slate-400">Tip: j/k to move · / to search · Esc to close chat</p>
                        </div>
                    ) : (
                        <div className="divide-y dark:divide-slate-800/50">
                            {filteredContacts.map(contact => {
                                const cStatus = contact.status || 'open';
                                const statusConf = STATUS_CONFIG[cStatus] || STATUS_CONFIG.open;
                                return (
                                    <button
                                        key={contact.id}
                                        onClick={() => {
                                            if (selectionMode) {
                                                toggleContactSelection(contact.id);
                                                return;
                                            }
                                            setSelectedContact(contact);
                                        }}
                                        className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left ${!selectionMode && selectedContact?.id === contact.id ? 'bg-green-50 dark:bg-slate-800 border-l-4 border-green-500' : 'border-l-4 border-transparent'} ${selectionMode && selectedIds.has(contact.id) ? 'bg-green-50/70 dark:bg-slate-800/70' : ''}`}
                                    >
                                        {selectionMode && (
                                            <div className="flex-shrink-0 pt-3">
                                                {selectedIds.has(contact.id) ? (
                                                    <CheckSquare className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                        )}
                                        <div className="relative flex-shrink-0">
                                            <ContactAvatar contact={contact} size="md" />
                                            {/* Status dot */}
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusConf.dot} border-2 border-white dark:border-slate-900 rounded-full`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {contact.is_starred && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                                                    {contact.tags?.includes('human_handoff') && (
                                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Human</span>
                                                    )}
                                                    {contact.opted_out && (
                                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700">Opted out</span>
                                                    )}
                                                    {isSlaBreached(contact) && (
                                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">SLA</span>
                                                    )}
                                                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                                                        {contact.name || contact.profile_name || contact.phone_number}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                    {formatTime(contact.last_message_at)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                    {contact.last_message_preview
                                                        ? contact.last_message_preview
                                                        : `+${contact.phone_number}`}
                                                </span>
                                                <div className="flex items-center gap-1.5 ml-2">
                                                    {contact.assigned_to_id && (
                                                        <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full flex items-center justify-center">
                                                            <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                    )}
                                                    {(contact.unread_count || 0) > 0 && (
                                                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                                                            {contact.unread_count > 99 ? '99+' : contact.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectionMode && selectedIds.size > 0 && (
                    <div className="p-3 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                        <button
                            onClick={exitSelectionMode}
                            className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => openDeleteModal('bulk')}
                            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete ({selectedIds.size})
                        </button>
                    </div>
                )}
            </div>

            {/* Middle Pane: Chat Area */}
            {selectedContact ? (
                <div className="flex-1 flex flex-col relative z-10 bg-slate-50 dark:bg-slate-900/50 min-h-0 min-w-0 overflow-hidden">
                    {/* Chat Header */}
                    <div className="min-h-14 sm:h-16 border-b dark:border-slate-800 flex items-center justify-between px-3 sm:px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 -ml-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full shrink-0">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <ContactAvatar contact={selectedContact} size="sm" showRing={false} />
                            <div className="min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm sm:text-base">
                                    {selectedContact.name || selectedContact.profile_name || selectedContact.phone_number}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">+{selectedContact.phone_number}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            {/* Status Badge — sidebar also has status on mobile */}
                            <select
                                value={contactStatus}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className={`hidden sm:block text-xs font-medium rounded-lg px-2.5 py-1.5 outline-none cursor-pointer border-0 ${currentStatusConfig.bg} ${currentStatusConfig.color}`}
                            >
                                {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                                    <option key={key} value={key}>{conf.label}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleToggleStar}
                                className={`p-2 rounded-full transition-colors ${selectedContact.is_starred ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                title={selectedContact.is_starred ? 'Unstar' : 'Star'}
                            >
                                <Star className={`w-5 h-5 ${selectedContact.is_starred ? 'fill-amber-500' : ''}`} />
                            </button>
                            <button
                                onClick={() => setShowRightSidebar(!showRightSidebar)}
                                className={`p-2 rounded-full transition-colors ${showRightSidebar ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <Info className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Handoff / presence banner */}
                    <div className="px-3 sm:px-4 py-2 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 text-xs shrink-0">
                        {isHumanHandoff(selectedContact) ? (
                            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium">
                                <UserCheck className="w-3.5 h-3.5" /> Human agent handling
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-medium">
                                <Bot className="w-3.5 h-3.5" /> AI agent handling
                            </span>
                        )}
                        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                            {presenceViewers.length > 0 && (
                                <span className="text-slate-500 text-[11px] sm:text-xs">{presenceViewers.map((v) => v.name).join(', ')} also viewing</span>
                            )}
                            {isHumanHandoff(selectedContact) ? (
                                <button onClick={handleReleaseAgent} className="px-2 py-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-xs whitespace-nowrap">
                                    Return to AI
                                </button>
                            ) : (
                                <button onClick={handleTakeOverFromAi} className="px-2 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs whitespace-nowrap">
                                    Take over
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="px-3 sm:px-4 py-2 border-b dark:border-slate-800 shrink-0">
                        <input
                            type="text"
                            placeholder="Search in conversation..."
                            value={messageSearch}
                            onChange={(e) => setMessageSearch(e.target.value)}
                            className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Messages Area */}
                    <div
                        ref={messagesScrollRef}
                        className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0 overscroll-contain"
                    >
                        {messagesLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-3" />
                                <p className="text-sm">Loading messages…</p>
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Bot className="w-16 h-16 mb-4 opacity-20" />
                                <p>Start the conversation</p>
                            </div>
                        ) : (
                            filteredMessages.map((msg) => {
                                const isInternal = msg.is_internal_note;
                                const isAgent = Boolean(msg.is_agent);

                                return (
                                    <div key={msg.id} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[88%] sm:max-w-[80%] lg:max-w-[65%] flex flex-col ${msg.direction === 'outgoing' ? 'items-end' : 'items-start'}`}>
                                            <div className={`
                                                px-4 py-2.5 shadow-sm relative group
                                                ${msg.direction === 'outgoing'
                                                    ? isInternal
                                                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 rounded-2xl rounded-tr-sm border border-amber-200 dark:border-amber-800/50'
                                                        : isAgent
                                                            ? 'bg-teal-700 text-white rounded-2xl rounded-tr-sm border border-teal-600/50'
                                                            : 'bg-green-600 text-white rounded-2xl rounded-tr-sm'
                                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700/50'}
                                            `}>
                                                {isAgent && !isInternal && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">
                                                        <Bot className="w-3 h-3" /> AI Agent
                                                    </div>
                                                )}
                                                {msg.is_auto_reply && !isAgent && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                                                        <Bot className="w-3 h-3" /> Auto-reply
                                                    </div>
                                                )}
                                                {isInternal && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70 text-amber-700 dark:text-amber-400">
                                                        <Shield className="w-3 h-3" /> Internal Note
                                                    </div>
                                                )}
                                                {msg.media_url && (
                                                    <WhatsAppMessageMedia
                                                        messageId={msg.id}
                                                        messageType={msg.message_type}
                                                        mediaUrl={msg.media_url}
                                                    />
                                                )}
                                                {msg.content && <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>}
                                                <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${msg.direction === 'outgoing' ? (isInternal ? 'opacity-60' : isAgent ? 'text-teal-100' : 'text-green-100') : 'text-slate-400'}`}>
                                                    {formatTime(msg.created_at)}
                                                    {msg.direction === 'outgoing' && <MessageStatusIcon status={msg.status} isInternal={isInternal} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies Popover */}
                    {showQuickReplies && quickReplies.length > 0 && (
                        <div className="mx-4 mb-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto z-30">
                            {quickReplies
                                .filter(qr => {
                                    if (newMessage === '/') return true;
                                    const query = newMessage.slice(1).toLowerCase();
                                    return qr.shortcut.toLowerCase().includes(query) || qr.title.toLowerCase().includes(query);
                                })
                                .map(qr => (
                                    <button
                                        key={qr.id}
                                        onClick={() => handleSelectQuickReply(qr)}
                                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-start gap-3 border-b dark:border-slate-700/50 last:border-b-0"
                                    >
                                        <div className="flex-shrink-0 mt-0.5">
                                            <Zap className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm text-slate-900 dark:text-white">{qr.title}</span>
                                                <span className="text-xs text-slate-400 font-mono">{qr.shortcut}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{qr.content}</p>
                                        </div>
                                    </button>
                                ))
                            }
                        </div>
                    )}

                    {/* Composer Area */}
                    <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 z-20 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        <div className={`flex flex-col border-2 rounded-2xl overflow-hidden transition-colors duration-200 ${isInternalNote ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:border-green-500'}`}>
                            {isInternalNote && (
                                <div className="px-3 sm:px-4 py-1.5 bg-amber-400 dark:bg-amber-600 text-amber-900 dark:text-amber-50 text-xs font-bold flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5 shrink-0" />
                                        <span>Internal Note</span>
                                    </div>
                                    <span className="opacity-80 hidden sm:inline">Visible only to team members</span>
                                </div>
                            )}

                            <div className="flex items-end gap-2 p-2">
                                <input ref={mediaInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleMediaUpload} />
                                <button
                                    type="button"
                                    onClick={handleAttachMedia}
                                    className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors flex-shrink-0"
                                    title="Attach file (via URL)"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>

                                <textarea
                                    ref={composerRef}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (showQuickReplies) return;
                                            handleSendMessage();
                                        }
                                        if (e.key === 'Escape') {
                                            setShowQuickReplies(false);
                                        }
                                    }}
                                    placeholder={isInternalNote ? "Type an internal note..." : "Type a message... (/ for quick replies)"}
                                    className="flex-1 max-h-32 bg-transparent outline-none py-3 resize-none scrollbar-hide"
                                    rows={1}
                                    style={{ minHeight: '44px' }}
                                />

                                <div className="flex items-center gap-1 flex-shrink-0 mb-1 mr-1">
                                    <button
                                        type="button"
                                        onClick={handleAiDraft}
                                        disabled={aiDraftLoading}
                                        className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-purple-600"
                                        title="AI draft reply"
                                    >
                                        {aiDraftLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={openTemplatePicker}
                                        className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-green-600"
                                        title="Send template"
                                    >
                                        <LayoutTemplate className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsInternalNote(!isInternalNote)}
                                        className={`p-2 rounded-full transition-colors ${isInternalNote ? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-amber-500'}`}
                                        title="Toggle Internal Note"
                                    >
                                        <Shield className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || sendingMessage}
                                        className={`p-2.5 rounded-full flex items-center justify-center transition-all ${!newMessage.trim() ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : isInternalNote ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md' : 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-500/20'}`}
                                    >
                                        {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-2 hidden sm:block">
                            <p className="text-[10px] text-slate-400">Enter to send · j/k inbox · / search · Esc close</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 border dark:border-slate-700">
                            <Bot className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">WhatsApp Shared Inbox</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">Select a conversation from the left to start messaging, assigning agents, or adding internal notes.</p>
                    </div>
                </div>
            )}

            {/* Right Pane: Contact Details & Context */}
            {selectedContact && showRightSidebar && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 z-40 md:hidden"
                        onClick={() => setShowRightSidebar(false)}
                        aria-hidden
                    />
                    <div className="w-full sm:w-80 lg:w-80 xl:w-96 flex-shrink-0 border-l dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto fixed inset-y-0 right-0 z-50 md:relative md:inset-auto md:z-30 shadow-2xl md:shadow-none animate-in slide-in-from-right-8 duration-300 max-w-full">
                    <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                        <h3 className="font-bold text-slate-900 dark:text-white">Contact Info</h3>
                        <button onClick={() => setShowRightSidebar(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-6 text-center border-b dark:border-slate-800">
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarFileChange}
                        />
                        <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="relative mx-auto block group"
                            title="Change photo"
                        >
                            <ContactAvatar contact={selectedContact} size="xl" />
                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                {uploadingAvatar ? (
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-6 h-6 text-white" />
                                )}
                            </div>
                        </button>
                        {selectedContact.avatar_url && (
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                className="mt-2 text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                            >
                                Remove photo
                            </button>
                        )}
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 mt-4">
                            {selectedContact.name || selectedContact.profile_name || selectedContact.phone_number}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> +{selectedContact.phone_number}
                        </p>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* Status Section */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Status</h4>
                            <select
                                value={contactStatus}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className={`w-full text-sm rounded-xl px-4 py-2.5 outline-none cursor-pointer border ${currentStatusConfig.bg} ${currentStatusConfig.color} border-slate-200 dark:border-slate-700`}
                            >
                                {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                                    <option key={key} value={key}>{conf.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Assignment Section */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Assignment</h4>
                            <select
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                value={selectedContact.assigned_to_id || ''}
                                onChange={(e) => handleAssignAgent(e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {teamMembers.map(member => (
                                    <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                                ))}
                            </select>
                        </div>

                        {/* Order & payment context */}
                        {commerceContext && (commerceContext.has_cart || commerceContext.order_id || commerceContext.payment_status) && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                    <ShoppingCart className="w-3.5 h-3.5" /> Order context
                                </h4>
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-3 text-sm space-y-2">
                                    {commerceContext.cart_summary && (
                                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap text-xs">{commerceContext.cart_summary}</p>
                                    )}
                                    {commerceContext.order_id && (
                                        <p className="text-slate-500">Order: <span className="font-mono text-slate-800 dark:text-slate-200">{commerceContext.order_id}</span></p>
                                    )}
                                    {commerceContext.payment_status && (
                                        <p className="flex items-center gap-1 text-slate-500">
                                            <CreditCard className="w-3.5 h-3.5" />
                                            Payment: <span className="font-medium capitalize">{commerceContext.payment_status}</span>
                                            {commerceContext.payment_amount != null && ` · KES ${commerceContext.payment_amount}`}
                                        </p>
                                    )}
                                    {commerceContext.order_timeline?.length > 0 && (
                                        <div className="pt-1 space-y-1 border-t border-slate-200 dark:border-slate-700">
                                            <p className="text-[10px] font-bold uppercase text-slate-400">Timeline</p>
                                            {commerceContext.order_timeline.slice(0, 5).map((ev: { type: string; label: string; at?: string; status?: string }, idx: number) => (
                                                <p key={idx} className="text-xs text-slate-500 flex justify-between gap-2">
                                                    <span>{ev.label}{ev.status ? ` · ${ev.status}` : ''}</span>
                                                    {ev.at && <span className="text-slate-400 shrink-0">{formatTime(ev.at)}</span>}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {commerceContext.order_id && (
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(String(commerceContext.order_id));
                                                    toast.success('Order ID copied');
                                                }}
                                                className="text-xs px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                                            >
                                                View order in Hub
                                            </button>
                                        )}
                                        {(commerceContext.can_retry_payment || commerceContext.payment_status === 'pending') && (
                                            <button
                                                onClick={handleResendPaymentLink}
                                                className="text-xs px-2 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                            >
                                                Resend payment link
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Agent actions (MCP) */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                <Wrench className="w-3.5 h-3.5" /> Agent actions
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    type="button"
                                    disabled={mcpRunning}
                                    onClick={() => runMcpAction('get_account_info')}
                                    className="text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                                >
                                    Check WhatsApp account
                                </button>
                                <button
                                    type="button"
                                    disabled={mcpRunning}
                                    onClick={() => runMcpAction('send_message')}
                                    className="text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                                >
                                    Run send test (MCP)
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleToggleStar}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedContact.is_starred ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                                >
                                    <Star className={`w-3.5 h-3.5 ${selectedContact.is_starred ? 'fill-amber-500' : ''}`} />
                                    {selectedContact.is_starred ? 'Starred' : 'Star'}
                                </button>
                                <button
                                    onClick={() => handleSnooze(4)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                    <Moon className="w-3.5 h-3.5" /> Snooze 4h
                                </button>
                                {selectedContact.snoozed_until && new Date(selectedContact.snoozed_until) > new Date() && (
                                    <button
                                        onClick={handleUnsnooze}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    >
                                        <Bell className="w-3.5 h-3.5" /> Unsnooze
                                    </button>
                                )}
                                <button
                                    onClick={handleToggleOptOut}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedContact.opted_out ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    <BellOff className="w-3.5 h-3.5" />
                                    {selectedContact.opted_out ? 'Opted out' : 'Opt out'}
                                </button>
                                <button
                                    onClick={handleToggleBlock}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedContact.is_blocked ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                                >
                                    <Ban className="w-3.5 h-3.5" />
                                    {selectedContact.is_blocked ? 'Unblock' : 'Block'}
                                </button>
                            </div>
                            <button
                                onClick={() => openDeleteModal('single')}
                                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete contact
                            </button>
                        </div>

                        {/* About Section */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">About</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">First contact</span>
                                    <span className="text-slate-900 dark:text-slate-200">{formatTime(selectedContact.first_message_at)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Messages</span>
                                    <span className="text-slate-900 dark:text-slate-200">{selectedContact.message_count}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</h4>
                                {!editingNotes ? (
                                    <button onClick={() => setEditingNotes(true)} className="text-green-600 hover:text-green-700 dark:text-green-400 p-1"><Edit3 className="w-3.5 h-3.5" /></button>
                                ) : (
                                    <button onClick={handleSaveNotes} className="text-green-600 hover:text-green-700 dark:text-green-400 p-1"><Save className="w-3.5 h-3.5" /></button>
                                )}
                            </div>
                            {editingNotes ? (
                                <textarea
                                    value={notesValue}
                                    onChange={(e) => setNotesValue(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                    rows={3}
                                    placeholder="Add notes about this contact..."
                                />
                            ) : (
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                    {selectedContact.notes || 'No notes yet. Click edit to add.'}
                                </p>
                            )}
                        </div>

                        {/* Tags Section */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tags</h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedContact.tags?.length ? selectedContact.tags.map(tag => (
                                    <span key={tag} className="pl-2.5 pr-1 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1 group">
                                        <Tag className="w-3 h-3 text-slate-400" />
                                        {tag}
                                        <button onClick={() => handleRemoveTag(tag)} className="p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )) : (
                                    <span className="text-sm text-slate-500 italic">No tags</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
                                    placeholder="Add tag..."
                                    className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <button onClick={handleAddTag} className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                </>
            )}

            {/* New Contact Modal */}
            {showNewContactModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowNewContactModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md sm:mx-4 p-6 max-h-[90dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Contact</h3>
                            <button onClick={() => setShowNewContactModal(false)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                                <input
                                    type="tel"
                                    value={newContactPhone}
                                    onChange={(e) => setNewContactPhone(e.target.value)}
                                    placeholder="254712345678"
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">Include country code without +</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newContactName}
                                    onChange={(e) => setNewContactName(e.target.value)}
                                    placeholder="Contact name"
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowNewContactModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleNewContact} disabled={!newContactPhone.trim()} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Create Contact
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Reply Manager Modal */}
            {showQuickReplyManager && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowQuickReplyManager(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg sm:mx-4 p-6 max-h-[90dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Replies</h3>
                            <button onClick={() => setShowQuickReplyManager(false)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Create Form */}
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-4">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Add Quick Reply</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    value={qrTitle}
                                    onChange={(e) => setQrTitle(e.target.value)}
                                    placeholder="Title (e.g. Thanks)"
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <input
                                    value={qrShortcut}
                                    onChange={(e) => setQrShortcut(e.target.value)}
                                    placeholder="Shortcut (e.g. /thanks)"
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                />
                            </div>
                            <textarea
                                value={qrContent}
                                onChange={(e) => setQrContent(e.target.value)}
                                placeholder="Message content..."
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                rows={2}
                            />
                            <button onClick={handleCreateQuickReply} disabled={!qrTitle.trim() || !qrShortcut.trim() || !qrContent.trim()} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Create Quick Reply
                            </button>
                        </div>

                        {/* Existing Replies */}
                        <div className="space-y-2">
                            {quickReplies.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No quick replies yet. Create one above!</p>
                            ) : (
                                quickReplies.map(qr => (
                                    <div key={qr.id} className="flex items-start justify-between p-3 bg-white dark:bg-slate-700/50 rounded-xl border dark:border-slate-600">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                <span className="font-medium text-sm text-slate-900 dark:text-white">{qr.title}</span>
                                                <span className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-600 px-1.5 py-0.5 rounded">{qr.shortcut}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{qr.content}</p>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0 ml-2">
                                            <button onClick={() => setEditingQuickReply(qr)} className="p-1.5 text-slate-400 hover:text-green-600 rounded-lg">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteQuickReply(qr.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {editingQuickReply && (
                            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                                <h4 className="text-sm font-semibold">Edit quick reply</h4>
                                <input value={editingQuickReply.title} onChange={(e) => setEditingQuickReply({ ...editingQuickReply, title: e.target.value })} className="w-full text-sm px-3 py-2 rounded-lg border dark:bg-slate-800" />
                                <input value={editingQuickReply.shortcut} onChange={(e) => setEditingQuickReply({ ...editingQuickReply, shortcut: e.target.value })} className="w-full text-sm px-3 py-2 rounded-lg border dark:bg-slate-800 font-mono" />
                                <textarea value={editingQuickReply.content} onChange={(e) => setEditingQuickReply({ ...editingQuickReply, content: e.target.value })} className="w-full text-sm px-3 py-2 rounded-lg border dark:bg-slate-800" rows={2} />
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingQuickReply(null)} className="flex-1 py-2 text-sm border rounded-lg">Cancel</button>
                                    <button onClick={handleSaveQuickReplyEdit} className="flex-1 py-2 text-sm bg-green-600 text-white rounded-lg">Save</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showTemplatePicker && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTemplatePicker(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Send template</h3>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="w-full mb-4 text-sm bg-slate-50 dark:bg-slate-700 border rounded-xl px-3 py-2"
                        >
                            <option value="">Select template...</option>
                            {templates.filter((t) => (t.status || '').toUpperCase() === 'APPROVED').map((t) => (
                                <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setShowTemplatePicker(false)} className="flex-1 py-2 border rounded-xl">Cancel</button>
                            <button onClick={handleSendTemplate} disabled={!selectedTemplate} className="flex-1 py-2 bg-green-600 text-white rounded-xl disabled:opacity-50">Send</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !deleting && setShowDeleteModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Delete {deleteModalCount === 1 ? 'contact' : `${deleteModalCount} contacts`}?
                            </h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                            {deleteTarget === 'single' && selectedContact ? (
                                <>
                                    <span className="font-medium text-slate-900 dark:text-white">{getContactLabel(selectedContact)}</span>
                                    {' '}and all conversation history will be permanently removed. This cannot be undone.
                                </>
                            ) : (
                                <>The selected contacts and all their messages will be permanently removed. This cannot be undone.</>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showFilterMenu && filterMenuPos && createPortal(
                <div
                    ref={filterPortalRef}
                    style={{
                        position: 'fixed',
                        top: filterMenuPos.top,
                        left: filterMenuPos.left,
                        width: FLOATING_MENU_WIDTH,
                    }}
                    className="z-[200] bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-2xl p-4 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Filters</h4>
                        <button type="button" onClick={() => { clearSegmentFilters(); }} className="text-xs text-green-600 hover:text-green-700">Clear all</button>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Assigned Agent</label>
                        <select
                            value={filterAgent}
                            onChange={(e) => setFilterAgent(e.target.value)}
                            className="w-full text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">All Agents</option>
                            <option value="unassigned">Unassigned</option>
                            {teamMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filterStarred} onChange={(e) => setFilterStarred(e.target.checked)} className="rounded border-slate-300 text-green-600 focus:ring-green-500" />
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Starred only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filterUnread} onChange={(e) => setFilterUnread(e.target.checked)} className="rounded border-slate-300 text-green-600 focus:ring-green-500" />
                        <MessageSquare className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Has unread</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filterSlaBreached} onChange={(e) => setFilterSlaBreached(e.target.checked)} className="rounded border-slate-300 text-green-600 focus:ring-green-500" />
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">SLA breached</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => { setShowFilterMenu(false); setFilterMenuPos(null); }}
                        className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                        Apply
                    </button>
                </div>,
                document.body
            )}

            {showSegmentsMenu && segmentsMenuPos && createPortal(
                <div
                    ref={segmentsPortalRef}
                    style={{
                        position: 'fixed',
                        top: segmentsMenuPos.top,
                        left: segmentsMenuPos.left,
                        width: FLOATING_MENU_WIDTH,
                    }}
                    className="z-[200] bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-2xl p-3 space-y-2 max-h-80 overflow-y-auto"
                >
                    <div className="flex items-center justify-between px-1">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Segments</h4>
                        <button type="button" onClick={saveCurrentAsSegment} className="text-xs text-green-600 hover:text-green-700">Save current</button>
                    </div>
                    {[...BUILTIN_SEGMENTS, ...savedSegments].map((seg) => (
                        <button
                            key={seg.id}
                            type="button"
                            onClick={() => applySegment(seg)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeSegmentId === seg.id ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            {seg.name}
                        </button>
                    ))}
                    {activeSegmentId && (
                        <button
                            type="button"
                            onClick={() => { clearSegmentFilters(); setShowSegmentsMenu(false); setSegmentsMenuPos(null); }}
                            className="w-full text-xs text-slate-500 hover:text-slate-700 pt-1"
                        >
                            Clear segment
                        </button>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default ConversationsTab;
