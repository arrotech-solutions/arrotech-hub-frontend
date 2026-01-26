import React, { useState, useEffect, useCallback } from 'react';
import {
    MessageCircle, Users, Search, Plus, Settings, Send,
    Phone, Clock, MoreVertical, Bot, Zap,
    CheckCheck, Check, X, Loader2, ArrowLeft,
    Megaphone, Calendar, Play, Pause, Trash2
} from 'lucide-react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

interface Contact {
    id: number;
    phone_number: string;
    name: string | null;
    profile_name: string | null;
    tags: string[];
    notes: string | null;
    message_count: number;
    first_message_at: string | null;
    last_message_at: string | null;
    is_blocked: boolean;
    created_at: string;
}

interface Message {
    id: number;
    direction: 'incoming' | 'outgoing';
    message_type: string;
    content: string | null;
    media_url: string | null;
    status: string;
    is_auto_reply: boolean;
    created_at: string;
    delivered_at: string | null;
    read_at: string | null;
}

interface AutoReply {
    id: number;
    name: string;
    description: string | null;
    trigger_type: string;
    trigger_value: string | null;
    response_type: string;
    response_content: string | null;
    is_active: boolean;
    priority: number;
    times_triggered: number;
    last_triggered_at: string | null;
    created_at: string;
}

interface Stats {
    total_contacts: number;
    total_messages: number;
    messages_today: number;
    active_auto_replies: number;
}

interface Broadcast {
    id: number;
    name: string;
    description: string | null;
    message_type: string;
    template_id: number | null;
    target_type: string;
    target_tag: string | null;
    status: string;
    scheduled_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    total_recipients: number;
    sent_count: number;
    delivered_count: number;
    read_count: number;
    failed_count: number;
    created_at: string;
}

type TabType = 'contacts' | 'auto-reply' | 'broadcast' | 'settings';

const WhatsAppDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('contacts');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showNewRuleModal, setShowNewRuleModal] = useState(false);
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

    // Fetch contacts
    const fetchContacts = useCallback(async () => {
        try {
            const response = await apiService.getWhatsAppContacts({ search: searchQuery || undefined });
            if (response.success) {
                setContacts(response.data);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    }, [searchQuery]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const response = await apiService.getWhatsAppStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    // Fetch auto-reply rules
    const fetchAutoReplies = useCallback(async () => {
        try {
            const response = await apiService.getWhatsAppAutoReplies();
            if (response.success) {
                setAutoReplies(response.data);
            }
        } catch (error) {
            console.error('Error fetching auto-replies:', error);
        }
    }, []);

    // Fetch broadcasts
    const fetchBroadcasts = useCallback(async () => {
        try {
            const response = await apiService.getWhatsAppBroadcasts();
            if (response.success) {
                setBroadcasts(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
        }
    }, []);

    // Fetch messages for selected contact
    const fetchMessages = useCallback(async (contactId: number) => {
        try {
            const response = await apiService.getWhatsAppMessages(contactId);
            if (response.success) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, []);

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchContacts(), fetchStats(), fetchAutoReplies(), fetchBroadcasts()]);
            setLoading(false);
        };
        loadData();
    }, [fetchContacts, fetchStats, fetchAutoReplies, fetchBroadcasts]);

    // Refresh contacts when search changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchContacts();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchContacts]);

    // Load messages when contact selected
    useEffect(() => {
        if (selectedContact) {
            fetchMessages(selectedContact.id);
        }
    }, [selectedContact, fetchMessages]);

    // Send message
    const handleSendMessage = async () => {
        if (!selectedContact || !newMessage.trim()) return;

        setSendingMessage(true);
        try {
            const response = await apiService.sendWhatsAppMessage(
                selectedContact.id,
                { content: newMessage.trim(), message_type: 'text' }
            );
            if (response.success) {
                setMessages([...messages, response.data]);
                setNewMessage('');
                toast.success('Message sent!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    // Toggle auto-reply rule
    const handleToggleRule = async (ruleId: number) => {
        try {
            await apiService.toggleWhatsAppAutoReply(ruleId);
            await fetchAutoReplies();
            toast.success('Rule updated');
        } catch (error) {
            toast.error('Failed to update rule');
        }
    };

    // Delete auto-reply rule
    const handleDeleteRule = async (ruleId: number) => {
        if (!window.confirm('Delete this rule?')) return;
        try {
            await apiService.deleteWhatsAppAutoReply(ruleId);
            await fetchAutoReplies();
            toast.success('Rule deleted');
        } catch (error) {
            toast.error('Failed to delete rule');
        }
    };

    // Format time
    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    // Message status icon
    const MessageStatus = ({ status }: { status: string }) => {
        switch (status) {
            case 'read':
                return <CheckCheck className="w-4 h-4 text-blue-500" />;
            case 'delivered':
                return <CheckCheck className="w-4 h-4 text-gray-400" />;
            case 'sent':
                return <Check className="w-4 h-4 text-gray-400" />;
            case 'failed':
                return <X className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-300" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3 whatsapp-header-tut">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">WhatsApp Business</h1>
                                <p className="text-sm text-gray-500">Manage conversations & automation</p>
                            </div>
                        </div>

                        {/* Stats */}
                        {stats && (
                            <div className="hidden md:flex items-center gap-6 whatsapp-stats-tut">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{stats.total_contacts}</div>
                                    <div className="text-xs text-gray-500">Contacts</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{stats.messages_today}</div>
                                    <div className="text-xs text-gray-500">Today</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{stats.active_auto_replies}</div>
                                    <div className="text-xs text-gray-500">Auto-Replies</div>
                                </div>
                            </div>
                        )}
                        {/* Mobile Stats */}
                        {stats && (
                            <div className="flex md:hidden items-center justify-around w-full border-t pt-3 mt-2">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900">{stats.total_contacts}</div>
                                    <div className="text-xs text-gray-500">Contacts</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900">{stats.messages_today}</div>
                                    <div className="text-xs text-gray-500">Today</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">{stats.active_auto_replies}</div>
                                    <div className="text-xs text-gray-500">Auto-Replies</div>
                                </div>
                            </div>
                        )}

                        {/* Tabs - Scrollable on mobile */}
                        <div className="flex gap-2 sm:gap-4 mt-4 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 whatsapp-tabs-tut scrollbar-hide">
                            {[
                                { id: 'contacts', label: 'Conversations', icon: Users },
                                { id: 'auto-reply', label: 'Auto-Reply', icon: Bot },
                                { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
                                { id: 'settings', label: 'Settings', icon: Settings },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                        ? 'bg-green-100 text-green-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="whitespace-nowrap">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {activeTab === 'contacts' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Contact List */}
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="p-4 border-b">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search contacts..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="overflow-y-auto max-h-[400px] sm:max-h-[500px] lg:max-h-[600px]">
                                {contacts.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No contacts yet</p>
                                        <p className="text-sm">Contacts appear when customers message you</p>
                                    </div>
                                ) : (
                                    contacts.map((contact) => (
                                        <button
                                            key={contact.id}
                                            onClick={() => setSelectedContact(contact)}
                                            className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b ${selectedContact?.id === contact.id ? 'bg-green-50' : ''
                                                }`}
                                        >
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-green-700 font-semibold">
                                                    {(contact.name || contact.profile_name || contact.phone_number).charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {contact.name || contact.profile_name || contact.phone_number}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    +{contact.phone_number}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-xs text-gray-400">
                                                    {formatTime(contact.last_message_at)}
                                                </div>
                                                {contact.message_count > 0 && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {contact.message_count} msgs
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Chat View - Full screen on mobile when contact selected */}
                        <div className={`lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col h-[calc(100vh-200px)] sm:h-[500px] lg:h-[700px] ${selectedContact ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden lg:flex'}`}>
                            {selectedContact ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedContact(null)}
                                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-green-700 font-semibold">
                                                {(selectedContact.name || selectedContact.profile_name || selectedContact.phone_number).charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {selectedContact.name || selectedContact.profile_name || selectedContact.phone_number}
                                            </div>
                                            <div className="text-sm text-gray-500">+{selectedContact.phone_number}</div>
                                        </div>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                                            <Phone className="w-5 h-5 text-gray-600" />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                                            <MoreVertical className="w-5 h-5 text-gray-600" />
                                        </button>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                        {messages.length === 0 ? (
                                            <div className="text-center text-gray-500 py-8">
                                                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                <p>No messages yet</p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.direction === 'outgoing'
                                                            ? 'bg-green-500 text-white rounded-br-md'
                                                            : 'bg-white border rounded-bl-md'
                                                            }`}
                                                    >
                                                        {msg.is_auto_reply && (
                                                            <div className={`text-xs mb-1 flex items-center gap-1 ${msg.direction === 'outgoing' ? 'text-green-100' : 'text-gray-400'
                                                                }`}>
                                                                <Bot className="w-3 h-3" /> Auto-reply
                                                            </div>
                                                        )}
                                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                                        <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${msg.direction === 'outgoing' ? 'text-green-100' : 'text-gray-400'
                                                            }`}>
                                                            {formatTime(msg.created_at)}
                                                            {msg.direction === 'outgoing' && <MessageStatus status={msg.status} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t bg-white">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                placeholder="Type a message..."
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={!newMessage.trim() || sendingMessage}
                                                className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {sendingMessage ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Send className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg font-medium">Select a conversation</p>
                                        <p className="text-sm">Choose a contact to view messages</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'auto-reply' && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Auto-Reply Rules</h2>
                                <p className="text-sm text-gray-500">Automate responses to incoming messages</p>
                            </div>
                            <button
                                onClick={() => setShowNewRuleModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                <Plus className="w-4 h-4" />
                                New Rule
                            </button>
                        </div>

                        {/* Rules List */}
                        <div className="grid gap-4">
                            {autoReplies.length === 0 ? (
                                <div className="bg-white rounded-xl border p-8 text-center">
                                    <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No auto-reply rules yet</h3>
                                    <p className="text-gray-500 mb-4">
                                        Create rules to automatically respond to customer messages
                                    </p>
                                    <button
                                        onClick={() => setShowNewRuleModal(true)}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                    >
                                        Create First Rule
                                    </button>
                                </div>
                            ) : (
                                autoReplies.map((rule) => (
                                    <div
                                        key={rule.id}
                                        className={`bg-white rounded-xl border p-6 ${rule.is_active ? '' : 'opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${rule.trigger_type === 'keyword' ? 'bg-blue-100 text-blue-700' :
                                                        rule.trigger_type === 'first_message' ? 'bg-green-100 text-green-700' :
                                                            rule.trigger_type === 'business_hours' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {rule.trigger_type.replace('_', ' ')}
                                                    </span>
                                                    {rule.response_type === 'ai' && (
                                                        <span className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                                                            AI Powered
                                                        </span>
                                                    )}
                                                </div>

                                                {rule.description && (
                                                    <p className="text-sm text-gray-500 mb-2">{rule.description}</p>
                                                )}

                                                {rule.trigger_value && (
                                                    <div className="text-sm text-gray-600 mb-2">
                                                        <span className="font-medium">Triggers:</span>{' '}
                                                        {rule.trigger_value.split('|').map((t, i) => (
                                                            <span key={i} className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs mr-1">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-2">
                                                    <span className="font-medium">Response:</span>{' '}
                                                    {rule.response_content?.substring(0, 100)}
                                                    {(rule.response_content?.length || 0) > 100 && '...'}
                                                </div>

                                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Zap className="w-3 h-3" />
                                                        Triggered {rule.times_triggered} times
                                                    </span>
                                                    {rule.last_triggered_at && (
                                                        <span>
                                                            Last: {formatTime(rule.last_triggered_at)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => handleToggleRule(rule.id)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.is_active ? 'bg-green-500' : 'bg-gray-300'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.is_active ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Quick Templates */}
                        <div className="bg-white rounded-xl border p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Templates</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    {
                                        name: 'Welcome Message',
                                        trigger: 'first_message',
                                        response: '👋 Hello {{name}}! Welcome to {{business_name}}. How can we help you today?'
                                    },
                                    {
                                        name: 'Away Message',
                                        trigger: 'business_hours',
                                        response: "Thanks for reaching out! We're currently closed but will respond first thing tomorrow. 🙏"
                                    },
                                    {
                                        name: 'Price Inquiry',
                                        trigger: 'keyword',
                                        keywords: 'price|cost|bei|how much',
                                        response: 'Thanks for asking! Here are our prices:\n\n📦 Product A - KES 500\n📦 Product B - KES 1,000\n\nWant more details?'
                                    },
                                ].map((template, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            // Would open modal with pre-filled values
                                            toast.success(`Template "${template.name}" - Coming soon!`);
                                        }}
                                        className="p-4 border rounded-lg text-left hover:border-green-500 hover:bg-green-50 transition-colors"
                                    >
                                        <div className="font-medium text-gray-900 mb-1">{template.name}</div>
                                        <div className="text-xs text-gray-500 mb-2">
                                            Trigger: {template.trigger.replace('_', ' ')}
                                        </div>
                                        <div className="text-sm text-gray-600 line-clamp-2">
                                            {template.response}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'broadcast' && (
                    <div className="space-y-6">
                        {/* Create Broadcast Button */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Broadcast Campaigns</h2>
                                <p className="text-sm text-gray-500">Send bulk messages to your contacts</p>
                            </div>
                            <button
                                onClick={() => toast('Create campaign coming soon!')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                <Plus className="w-4 h-4" />
                                Create Campaign
                            </button>
                        </div>

                        {/* Broadcast Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                { label: 'Total Campaigns', value: broadcasts.length, icon: Megaphone, color: 'bg-blue-100 text-blue-600' },
                                { label: 'Sent', value: broadcasts.filter(b => b.status === 'completed').length, icon: CheckCheck, color: 'bg-green-100 text-green-600' },
                                { label: 'Scheduled', value: broadcasts.filter(b => b.status === 'scheduled').length, icon: Calendar, color: 'bg-yellow-100 text-yellow-600' },
                                { label: 'Draft', value: broadcasts.filter(b => b.status === 'draft').length, icon: Clock, color: 'bg-gray-100 text-gray-600' },
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white rounded-xl border p-4">
                                    <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                    <div className="text-sm text-gray-500">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Campaigns List */}
                        <div className="bg-white rounded-xl border overflow-hidden">
                            <div className="p-4 border-b">
                                <h3 className="font-semibold text-gray-900">All Campaigns</h3>
                            </div>
                            <div className="divide-y">
                                {broadcasts.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No broadcast campaigns yet</p>
                                        <p className="text-sm text-gray-400 mt-1">Create your first campaign to reach all your contacts at once</p>
                                    </div>
                                ) : (
                                    broadcasts.map((broadcast) => (
                                        <div key={broadcast.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-gray-900">{broadcast.name}</h4>
                                                        <span className={`px-2 py-0.5 text-xs rounded-full ${broadcast.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            broadcast.status === 'sending' ? 'bg-blue-100 text-blue-700' :
                                                                broadcast.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                                                                    broadcast.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {broadcast.status}
                                                        </span>
                                                    </div>
                                                    {broadcast.description && (
                                                        <p className="text-sm text-gray-500 mt-1">{broadcast.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                        <span>{broadcast.total_recipients} recipients</span>
                                                        <span>{broadcast.sent_count} sent</span>
                                                        <span>{broadcast.delivered_count} delivered</span>
                                                        <span>{broadcast.read_count} read</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {broadcast.status === 'draft' && (
                                                        <>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await apiService.sendWhatsAppBroadcast(broadcast.id);
                                                                        toast.success('Broadcast sending started!');
                                                                        fetchBroadcasts();
                                                                    } catch (e) {
                                                                        toast.error('Failed to start broadcast');
                                                                    }
                                                                }}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                                title="Send now"
                                                            >
                                                                <Play className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await apiService.deleteWhatsAppBroadcast(broadcast.id);
                                                                        toast.success('Broadcast deleted');
                                                                        fetchBroadcasts();
                                                                    } catch (e) {
                                                                        toast.error('Failed to delete');
                                                                    }
                                                                }}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {(broadcast.status === 'sending' || broadcast.status === 'scheduled') && (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await apiService.cancelWhatsAppBroadcast(broadcast.id);
                                                                    toast.success('Broadcast cancelled');
                                                                    fetchBroadcasts();
                                                                } catch (e) {
                                                                    toast.error('Failed to cancel');
                                                                }
                                                            }}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                            title="Cancel"
                                                        >
                                                            <Pause className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="max-w-2xl space-y-6">
                        <div className="bg-white rounded-xl border p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Business Profile</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                This information helps AI generate better responses for your customers.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Your Business Name"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="What does your business do?"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Industry
                                    </label>
                                    <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500">
                                        <option value="">Select industry</option>
                                        <option value="retail">Retail & E-commerce</option>
                                        <option value="food">Food & Beverage</option>
                                        <option value="services">Professional Services</option>
                                        <option value="health">Health & Beauty</option>
                                        <option value="tech">Technology</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                    Save Profile
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Business Hours</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Set your operating hours to send away messages when you're closed.
                            </p>

                            <div className="space-y-3">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                    <div key={day} className="flex items-center gap-4">
                                        <div className="w-24 font-medium text-gray-700">{day}</div>
                                        <input
                                            type="time"
                                            defaultValue="08:00"
                                            className="px-3 py-1 border rounded-lg"
                                        />
                                        <span className="text-gray-500">to</span>
                                        <input
                                            type="time"
                                            defaultValue="18:00"
                                            className="px-3 py-1 border rounded-lg"
                                        />
                                        <label className="flex items-center gap-2 text-sm text-gray-600">
                                            <input type="checkbox" defaultChecked className="rounded" />
                                            Open
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                Save Hours
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* New Rule Modal - Placeholder */}
            {showNewRuleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Create Auto-Reply Rule</h3>
                            <button onClick={() => setShowNewRuleModal(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Welcome Message"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
                                <select className="w-full px-4 py-2 border rounded-lg">
                                    <option value="first_message">First Message (New contacts)</option>
                                    <option value="keyword">Keyword Match</option>
                                    <option value="business_hours">Outside Business Hours</option>
                                    <option value="all">All Messages (AI Mode)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Keywords (separate with |)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., hi|hello|hey"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
                                <textarea
                                    rows={4}
                                    placeholder="Your auto-reply message..."
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Available variables: {'{{name}}'}, {'{{greeting}}'}, {'{{business_name}}'}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowNewRuleModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        toast.success('Rule created! (Demo)');
                                        setShowNewRuleModal(false);
                                        fetchAutoReplies();
                                    }}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                >
                                    Create Rule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppDashboard;
