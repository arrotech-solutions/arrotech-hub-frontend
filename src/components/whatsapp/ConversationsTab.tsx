import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, Phone, MoreVertical, Send, User, Shield, Info, Image as ImageIcon,
    Paperclip, CheckCheck, Check, Clock, Plus, Bot, Tag, Filter, UserCircle, Star, ArrowLeft, Loader2,
    X, MessageSquare, CircleDot, Archive, SlidersHorizontal, Zap, FileText, Ban, StarOff, Edit3, Save, Trash2
} from 'lucide-react';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

export interface Contact {
    id: number;
    phone_number: string;
    name: string | null;
    profile_name: string | null;
    tags: string[];
    notes: string | null;
    message_count: number;
    unread_count: number;
    first_message_at: string | null;
    last_message_at: string | null;
    is_blocked: boolean;
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
    is_internal_note?: boolean;
    created_at: string;
    delivered_at: string | null;
    read_at: string | null;
}

interface QuickReply {
    id: number;
    title: string;
    shortcut: string;
    content: string;
    category: string | null;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface ConversationsTabProps {
    contacts: Contact[];
    selectedContact: Contact | null;
    setSelectedContact: (contact: Contact | null) => void;
    messages: Message[];
    setMessages: (messages: Message[]) => void;
    fetchContacts: () => void;
    fetchMessages: (contactId: number) => void;
}

type StatusFilter = 'all' | 'open' | 'pending' | 'resolved' | 'closed';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    open: { label: 'Open', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', dot: 'bg-emerald-500' },
    pending: { label: 'Pending', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', dot: 'bg-amber-500' },
    resolved: { label: 'Resolved', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', dot: 'bg-blue-500' },
    closed: { label: 'Closed', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-400' },
};

export const ConversationsTab: React.FC<ConversationsTabProps> = ({
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    setMessages,
    fetchContacts,
    fetchMessages
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(true);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filterAgent, setFilterAgent] = useState<string>('');
    const [filterStarred, setFilterStarred] = useState(false);
    const [filterUnread, setFilterUnread] = useState(false);
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

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const composerRef = useRef<HTMLTextAreaElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load team members from API
    useEffect(() => {
        const loadTeamMembers = async () => {
            try {
                const response = await apiService.getWhatsAppTeamMembers();
                if (response.success) {
                    setTeamMembers(response.data);
                }
            } catch (error) {
                console.error('Error fetching team members:', error);
            }
        };
        loadTeamMembers();
    }, []);

    // Load quick replies
    useEffect(() => {
        const loadQuickReplies = async () => {
            try {
                const response = await apiService.getWhatsAppQuickReplies();
                if (response.success) {
                    setQuickReplies(response.data);
                }
            } catch (error) {
                console.error('Error fetching quick replies:', error);
            }
        };
        loadQuickReplies();
    }, []);

    // Mark conversation as read when selected
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

    // Message polling (every 10 seconds)
    useEffect(() => {
        if (selectedContact) {
            pollRef.current = setInterval(() => {
                fetchMessages(selectedContact.id);
            }, 10000);
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [selectedContact, fetchMessages]);

    // Contacts list polling (every 10 seconds)
    useEffect(() => {
        const contactsPoll = setInterval(() => {
            fetchContacts();
        }, 10000);
        return () => clearInterval(contactsPoll);
    }, [fetchContacts]);

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

    const handleAttachMedia = async () => {
        if (!selectedContact) return;
        
        // For now, since we don't have a backend S3 upload flow, prompt for a public URL
        const url = window.prompt("Enter a public image URL to send (e.g. https://example.com/image.jpg):");
        if (!url) return;
        
        try {
            await apiService.sendWhatsAppMedia(selectedContact.id, {
                media_url: url,
                media_type: 'image',
                caption: newMessage.trim() || undefined
            });
            setNewMessage('');
            fetchMessages(selectedContact.id);
            toast.success('Media message sent');
        } catch (error) {
            console.error("Failed to send media:", error);
            toast.error("Failed to send media message.");
        }
    };

    const handleAssignAgent = async (agentId: string) => {
        if (!selectedContact) return;
        try {
            const response = await apiService.updateWhatsAppContact(selectedContact.id, {
                assigned_to_id: agentId || null
            });
            if (response.success) {
                toast.success('Agent assigned');
                fetchContacts();
                setSelectedContact({ ...selectedContact, assigned_to_id: agentId || null });
            }
        } catch (error) {
            toast.error('Failed to assign agent');
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
                setQuickReplies([...quickReplies, response.data]);
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
            setQuickReplies(quickReplies.filter(qr => qr.id !== id));
            toast.success('Quick reply deleted');
        } catch {
            toast.error('Failed to delete');
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

    const filteredContacts = contacts.filter(c => {
        const searchTarget = `${c.name || ''} ${c.profile_name || ''} ${c.phone_number || ''}`.toLowerCase();
        const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || (c.status || 'open') === statusFilter;
        const matchesAgent = !filterAgent || c.assigned_to_id === filterAgent;
        const matchesStarred = !filterStarred || c.is_starred;
        const matchesUnread = !filterUnread || (c.unread_count > 0);
        return matchesSearch && matchesStatus && matchesAgent && matchesStarred && matchesUnread;
    });

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
        <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Left Pane: Conversations List */}
            <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r dark:border-slate-800 flex flex-col transition-transform duration-300 ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-4 border-b dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inbox</h2>
                        <div className="flex gap-1.5">
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                                    className={`p-2 rounded-lg transition-colors ${(filterAgent || filterStarred || filterUnread) ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    title="Filters"
                                >
                                    <SlidersHorizontal className="w-5 h-5" />
                                </button>
                                {/* Filter Dropdown */}
                                {showFilterMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-xl z-50 p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Filters</h4>
                                            <button onClick={() => { setFilterAgent(''); setFilterStarred(false); setFilterUnread(false); }} className="text-xs text-green-600 hover:text-green-700">Clear all</button>
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
                                        <button onClick={() => setShowFilterMenu(false)} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">Apply</button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowQuickReplyManager(!showQuickReplyManager)}
                                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Quick Replies"
                            >
                                <Zap className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowNewContactModal(true)}
                                className="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                                title="New Contact"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

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
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {filteredContacts.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No conversations found</p>
                        </div>
                    ) : (
                        <div className="divide-y dark:divide-slate-800/50">
                            {filteredContacts.map(contact => {
                                const cStatus = contact.status || 'open';
                                const statusConf = STATUS_CONFIG[cStatus] || STATUS_CONFIG.open;
                                return (
                                    <button
                                        key={contact.id}
                                        onClick={() => setSelectedContact(contact)}
                                        className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left ${selectedContact?.id === contact.id ? 'bg-green-50 dark:bg-slate-800 border-l-4 border-green-500' : 'border-l-4 border-transparent'}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                                {(contact.name || contact.profile_name || contact.phone_number).charAt(0).toUpperCase()}
                                            </div>
                                            {/* Status dot */}
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusConf.dot} border-2 border-white dark:border-slate-900 rounded-full`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {contact.is_starred && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
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
                                                    {contact.phone_number}
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
            </div>

            {/* Middle Pane: Chat Area */}
            {selectedContact ? (
                <div className="flex-1 flex flex-col relative z-10 bg-slate-50 dark:bg-slate-900/50">
                    {/* Chat Header */}
                    <div className="h-16 border-b dark:border-slate-800 flex items-center justify-between px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold shadow-sm">
                                {(selectedContact.name || selectedContact.profile_name || selectedContact.phone_number).charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">
                                    {selectedContact.name || selectedContact.profile_name || selectedContact.phone_number}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">+{selectedContact.phone_number}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            <select
                                value={contactStatus}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className={`text-xs font-medium rounded-lg px-2.5 py-1.5 outline-none cursor-pointer border-0 ${currentStatusConfig.bg} ${currentStatusConfig.color}`}
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

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Bot className="w-16 h-16 mb-4 opacity-20" />
                                <p>Start the conversation</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isInternal = msg.is_internal_note;

                                return (
                                    <div key={msg.id} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] lg:max-w-[65%] flex flex-col ${msg.direction === 'outgoing' ? 'items-end' : 'items-start'}`}>
                                            <div className={`
                                                px-4 py-2.5 shadow-sm relative group
                                                ${msg.direction === 'outgoing'
                                                    ? isInternal
                                                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 rounded-2xl rounded-tr-sm border border-amber-200 dark:border-amber-800/50'
                                                        : 'bg-green-600 text-white rounded-2xl rounded-tr-sm'
                                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700/50'}
                                            `}>
                                                {msg.is_auto_reply && (
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
                                                    <div className="mb-2">
                                                        {msg.message_type === 'image' ? (
                                                            <img src={msg.media_url} alt="Media" className="rounded-lg max-w-full max-h-64 object-cover" />
                                                        ) : (
                                                            <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white/20 dark:bg-slate-700/50 rounded-lg hover:bg-white/30 transition-colors">
                                                                <FileText className="w-5 h-5" />
                                                                <span className="text-sm underline">View attachment</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                {msg.content && <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>}
                                                <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${msg.direction === 'outgoing' ? (isInternal ? 'opacity-60' : 'text-green-100') : 'text-slate-400'}`}>
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
                    <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 z-20">
                        <div className={`flex flex-col border-2 rounded-2xl overflow-hidden transition-colors duration-200 ${isInternalNote ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:border-green-500'}`}>
                            {isInternalNote && (
                                <div className="px-4 py-1.5 bg-amber-400 dark:bg-amber-600 text-amber-900 dark:text-amber-50 text-xs font-bold flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>Internal Note Mode</span>
                                    </div>
                                    <span className="opacity-80">Visible only to team members</span>
                                </div>
                            )}

                            <div className="flex items-end gap-2 p-2">
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
                        <div className="text-center mt-2">
                            <p className="text-[10px] text-slate-400">Press <span className="font-bold">Enter</span> to send · <span className="font-bold">Shift + Enter</span> for new line · Type <span className="font-bold">/</span> for quick replies</p>
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
                <div className="w-72 lg:w-80 flex-shrink-0 border-l dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto absolute right-0 top-0 bottom-0 z-30 shadow-2xl md:shadow-none md:relative animate-in slide-in-from-right-8 duration-300">
                    <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                        <h3 className="font-bold text-slate-900 dark:text-white">Contact Info</h3>
                        <button onClick={() => setShowRightSidebar(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-6 text-center border-b dark:border-slate-800">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4 ring-4 ring-green-50 dark:ring-slate-800">
                            {(selectedContact.name || selectedContact.profile_name || selectedContact.phone_number).charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
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
                                    onClick={handleToggleBlock}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedContact.is_blocked ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                                >
                                    <Ban className="w-3.5 h-3.5" />
                                    {selectedContact.is_blocked ? 'Unblock' : 'Block'}
                                </button>
                            </div>
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
            )}

            {/* New Contact Modal */}
            {showNewContactModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewContactModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQuickReplyManager(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Replies</h3>
                            <button onClick={() => setShowQuickReplyManager(false)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Create Form */}
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-4">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Add Quick Reply</h4>
                            <div className="grid grid-cols-2 gap-3">
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
                                        <button onClick={() => handleDeleteQuickReply(qr.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0 ml-2">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConversationsTab;
