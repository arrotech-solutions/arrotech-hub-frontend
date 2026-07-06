
import React, { useState, useEffect, useCallback } from 'react';
import {
    MessageCircle, Users, Search, Plus, Settings, Send,
    Phone, Clock, MoreVertical, Bot, Zap,
    CheckCheck, Check, X, Loader2, ArrowLeft,
    Megaphone, Calendar, Play, Pause, Trash2, Key, AlertCircle,
    Sparkles, ArrowRight, Pencil, BarChart3
} from 'lucide-react';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import { Connection } from '../types';
import { Link } from 'react-router-dom';
import ConversationsTab, { type TeamMember, type QuickReply } from '../components/whatsapp/ConversationsTab';
import CreateBroadcastModal from '../components/whatsapp/CreateBroadcastModal';
import BroadcastDetailModal from '../components/whatsapp/BroadcastDetailModal';
import AutoReplyRuleModal, { AutoReplyRule, AutoReplyRuleDraft } from '../components/whatsapp/AutoReplyRuleModal';
import WhatsAppAnalyticsTab from '../components/whatsapp/WhatsAppAnalyticsTab';
import { useWebSocket } from '../hooks/useWebSocket';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

type DayHours = { open: string; close: string; is_open: boolean };

const createDefaultBusinessHours = (): Record<string, DayHours> => ({
    monday: { open: '08:00', close: '18:00', is_open: true },
    tuesday: { open: '08:00', close: '18:00', is_open: true },
    wednesday: { open: '08:00', close: '18:00', is_open: true },
    thursday: { open: '08:00', close: '18:00', is_open: true },
    friday: { open: '08:00', close: '18:00', is_open: true },
    saturday: { open: '09:00', close: '14:00', is_open: false },
    sunday: { open: '09:00', close: '14:00', is_open: false },
});

const parseBusinessHoursFromApi = (
    apiHours: Record<string, { open?: string; close?: string }> | null | undefined
): Record<string, DayHours> => {
    const defaults = createDefaultBusinessHours();
    if (!apiHours) return defaults;
    WEEKDAYS.forEach((day) => {
        const h = apiHours[day];
        if (h?.open && h?.close) {
            defaults[day] = { open: h.open, close: h.close, is_open: true };
        } else {
            defaults[day] = { ...defaults[day], is_open: false };
        }
    });
    return defaults;
};

const businessHoursToApi = (hours: Record<string, DayHours>) => {
    const out: Record<string, { open: string; close: string }> = {};
    WEEKDAYS.forEach((day) => {
        if (hours[day]?.is_open) {
            out[day] = { open: hours[day].open, close: hours[day].close };
        }
    });
    return out;
};

const formatDayLabel = (day: string) => day.charAt(0).toUpperCase() + day.slice(1);

const REAL_ESTATE_TEMPLATES: AutoReplyRuleDraft[] = [
    {
        name: 'Property Inquiry Bot',
        trigger_type: 'first_message',
        response_type: 'text',
        response_content: '👋 Hello {{name}}! Welcome to {{business_name}} Real Estate. Are you looking to Buy or Rent?\n\n1️⃣ Rent\n2️⃣ Buy\n\nPlease reply with a number.',
        priority: 10,
    },
    {
        name: 'Viewing Confirmation',
        trigger_type: 'keyword',
        trigger_value: 'view|site visit|book',
        response_type: 'text',
        response_content: "Thanks! We've received your viewing request. A property manager will contact you shortly to confirm the time. 🏠",
        priority: 5,
    },
    {
        name: 'New Listing Alert',
        trigger_type: 'keyword',
        trigger_value: 'listing|new property|pics',
        response_type: 'text',
        response_content: '🚨 New Property Alert! 🚨\n\n📌 Location: [Area]\n💰 Price: [Amount]\n🛏️ Beds: [Count]\n\nReply "PICS" to see photos or "BOOK" to schedule a viewing.',
        priority: 3,
    },
];

interface Contact {
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
    assigned_to_id?: string | null;
    status?: string;
    is_starred?: boolean;
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
    is_agent?: boolean;
    is_internal_note?: boolean;
    created_at: string;
    delivered_at: string | null;
    read_at: string | null;
}

interface Stats {
    total_contacts: number;
    total_messages: number;
    messages_today: number;
    active_auto_replies: number;
}

interface BroadcastStats {
    total_campaigns: number;
    total_sent: number;
    total_delivered: number;
    total_read: number;
    total_failed: number;
    delivery_rate: number;
    read_rate: number;
}

interface Broadcast {
    id: string;
    name: string;
    description: string | null;
    message_type: string;
    template_id: string | null;
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

type TabType = 'contacts' | 'auto-reply' | 'broadcast' | 'analytics' | 'settings';

const WhatsAppDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('contacts');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [autoReplies, setAutoReplies] = useState<AutoReplyRule[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
    const [rulePrefill, setRulePrefill] = useState<Partial<AutoReplyRuleDraft> | null>(null);
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [broadcastStats, setBroadcastStats] = useState<BroadcastStats | null>(null);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastStatusFilter, setBroadcastStatusFilter] = useState('');
    const [detailBroadcastId, setDetailBroadcastId] = useState<string | null>(null);
    const [waConnection, setWaConnection] = useState<Connection | null>(null);
    const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
    const [isSyncingNumbers, setIsSyncingNumbers] = useState(false);
    const [businessProfile, setBusinessProfile] = useState({
        business_name: '',
        description: '',
        industry: '',
        away_message: '',
        timezone: 'Africa/Nairobi',
        business_hours_ui: createDefaultBusinessHours(),
    });
    const [inboxSettings, setInboxSettings] = useState({
        round_robin_enabled: false,
        round_robin_agent_ids: [] as string[],
        sla_first_response_minutes: 5,
        notify_new_message_browser: true,
        notify_new_message_sound: true,
        notify_new_message_email: false,
        notify_sla_breach: true,
        csat_enabled: true,
    });
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingHours, setIsSavingHours] = useState(false);

    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [registrationPin, setRegistrationPin] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [showDeregisterModal, setShowDeregisterModal] = useState(false);
    const [isDeregistering, setIsDeregistering] = useState(false);

    const handleEmbeddedCode = async (code: string, wabaId?: string, phoneNumberId?: string) => {
        const tId = toast.loading("Verifying your account...");
        try {
            const res = await apiService.connectWhatsAppEmbedded(code, wabaId, phoneNumberId);
            if (res.success) {
                toast.success("Successfully connected!", { id: tId });
                fetchConnectionData();
            } else {
                toast.error("Failed to connect", { id: tId });
            }
        } catch (e) {
            toast.error("Failed to verify code", { id: tId });
        }
    };

    const handleRegisterPhone = async () => {
        if (!registrationPin || registrationPin.length !== 6 || !/^\d+$/.test(registrationPin)) {
            toast.error('PIN must be exactly 6 digits');
            return;
        }
        if (!waConnection?.config?.phone_number_id) {
            toast.error('Phone Number ID not found');
            return;
        }

        setIsRegistering(true);
        const tId = toast.loading('Registering phone number with Meta...');
        try {
            const res = await apiService.registerWhatsAppPhone(waConnection.config.phone_number_id, registrationPin);
            if (res.success) {
                toast.success('Phone number registered successfully!', { id: tId });
                setShowRegistrationModal(false);
                setRegistrationPin('');
                fetchConnectionData();
            } else {
                toast.error('Failed to register: ' + (res.message || 'Unknown error'), { id: tId });
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || 'Failed to register phone number', { id: tId });
        } finally {
            setIsRegistering(false);
        }
    };

    const handleDeregisterPhone = async () => {
        if (!waConnection?.config?.phone_number_id) {
            toast.error('Phone Number ID not found');
            return;
        }

        setIsDeregistering(true);
        const tId = toast.loading('Deregistering phone number...');
        try {
            const res = await apiService.deregisterWhatsAppPhone(waConnection.config.phone_number_id);
            if (res.success) {
                toast.success('Phone number deregistered successfully!', { id: tId });
                setShowDeregisterModal(false);
                fetchConnectionData();
            } else {
                toast.error('Failed to deregister: ' + (res.message || 'Unknown error'), { id: tId });
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || 'Failed to deregister phone number', { id: tId });
        } finally {
            setIsDeregistering(false);
        }
    };

    const launchWhatsAppSignup = () => {
        const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
        const configId = import.meta.env.VITE_FACEBOOK_CONFIG_ID;

        const fallbackToRedirect = async () => {
            try {
                toast('Redirecting to Meta login...', { icon: '🔄' });
                const { url } = await apiService.getWhatsAppAuthUrl(configId);
                window.location.href = url;
            } catch (e) {
                toast.error('Failed to initiate WhatsApp connection');
            }
        };

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            console.warn('Mobile browser detected — using redirect OAuth flow instead of popup to prevent close_window issues');
            fallbackToRedirect();
            return;
        }

        if (!appId) {
            console.warn('VITE_FACEBOOK_APP_ID not set — falling back to redirect OAuth');
            fallbackToRedirect();
            return;
        }

        const FB = (window as any).FB;
        if (!FB) {
            // If SDK isn't loaded, fall back to redirect OAuth
            fallbackToRedirect();
            return;
        }

        try {
            // Re-init is usually ignored by the SDK, but we wrap in try-catch just in case
            FB.init({
                appId: appId,
                cookie: true,
                version: 'v22.0'
            });
        } catch (e) {
            console.log("FB SDK init warning:", e);
        }

        const loginOptions: any = {
            response_type: 'code',
            override_default_response_type: true,
            extras: {
                setup: {},
                featureType: '',
                sessionInfoVersion: '3'
            }
        };

        // Always request scope explicitly so Meta's permission consent screen is visible
        // (required for App Review screencast — reviewers must see users granting each permission)
        loginOptions.scope = 'business_management,whatsapp_business_management,whatsapp_business_messaging';
        if (configId) {
            loginOptions.config_id = configId;
        }

        let setupData: any = null;
        const messageHandler = (event: MessageEvent) => {
            if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data && data.type === 'whatsapp_embedded_signup') {
                    setupData = data.data || {};
                }
            } catch (e) {}
        };
        window.addEventListener('message', messageHandler);

        FB.login((response: any) => {
            window.removeEventListener('message', messageHandler);
            if (response.authResponse) {
                const { code } = response.authResponse;
                // Check our captured setupData first, then fallback to authResponse extras
                const extras = setupData || response.authResponse.setup || response.authResponse || {};
                const wabaId = extras.waba_id || extras.whatsapp_business_account_id;
                const phoneNumberId = extras.phone_number_id;
                console.log('[WhatsApp Embedded] authResponse:', response.authResponse, 'Captured setup:', setupData, 'Extracted:', { code: !!code, wabaId, phoneNumberId });
                handleEmbeddedCode(code, wabaId, phoneNumberId);
            } else {
                console.log('User cancelled login or did not fully authorize.', response);
                toast.error("Setup cancelled or incomplete.");
            }
        }, loginOptions);
    };

    // Fetch contacts
    const fetchContacts = useCallback(async () => {
        try {
            const response = await apiService.getWhatsAppContacts();
            if (response.success) {
                setContacts(response.data);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    }, []);

    // Fetch messages for selected contact
    const fetchMessages = useCallback(async (contactId: number) => {
        setMessagesLoading(true);
        try {
            const response = await apiService.getWhatsAppMessages(contactId);
            if (response.success) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setMessagesLoading(false);
        }
    }, []);

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
            const response = await apiService.getWhatsAppBroadcasts({
                status: broadcastStatusFilter || undefined,
            });
            if (response.success) {
                setBroadcasts(Array.isArray(response.data) ? response.data : []);
            }
            const statsResp = await apiService.getWhatsAppBroadcastStats();
            if (statsResp.success && statsResp.data) {
                setBroadcastStats(statsResp.data);
            }
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
        }
    }, [broadcastStatusFilter]);

    useEffect(() => {
        if (activeTab === 'broadcast') {
            fetchBroadcasts();
        }
    }, [activeTab, broadcastStatusFilter, fetchBroadcasts]);

    const { lastEvent } = useWebSocket();

    useEffect(() => {
        if (lastEvent?.type === 'broadcast_progress') {
            const data = lastEvent.data;
            setBroadcasts(prev => prev.map(b => b.id.toString() === data.broadcast_id ? {
                ...b,
                sent_count: data.sent,
                failed_count: data.failed,
                total_recipients: data.total,
                status: (data.sent + data.failed) >= data.total ? 'completed' : 'sending'
            } : b));
        }
        if (
            lastEvent?.type === 'whatsapp_new_message' ||
            lastEvent?.type === 'whatsapp_contact_updated'
        ) {
            fetchContacts();
            if (selectedContact && lastEvent.data?.contact_id === String(selectedContact.id)) {
                fetchMessages(selectedContact.id);
            }
        }
    }, [lastEvent, selectedContact, fetchContacts, fetchMessages]);

    // Fetch connection details
    const fetchConnectionData = useCallback(async () => {
        try {
            const [connsRes, profileRes, numbersRes] = await Promise.all([
                apiService.getConnections().catch(() => null),
                apiService.getWhatsAppBusinessProfile().catch(() => null),
                apiService.getWhatsAppPhoneNumbers().catch(() => null)
            ]);

            if (connsRes && connsRes.success) {
                const waConn = connsRes.data.find((c: any) => c.platform === 'whatsapp');
                if (waConn) setWaConnection(waConn);
            }
            if (profileRes && profileRes.success && profileRes.data) {
                const d = profileRes.data;
                setBusinessProfile({
                    business_name: d.business_name || '',
                    description: d.description || '',
                    industry: d.industry || '',
                    away_message: d.away_message || '',
                    timezone: d.timezone || 'Africa/Nairobi',
                    business_hours_ui: parseBusinessHoursFromApi(d.business_hours),
                });
            }
            if (numbersRes && numbersRes.success && numbersRes.data) {
                setPhoneNumbers(numbersRes.data);
            }
            const [inboxRes, teamRes, quickRepliesRes] = await Promise.all([
                apiService.getWhatsAppInboxSettings().catch(() => null),
                apiService.getWhatsAppTeamMembers().catch(() => null),
                apiService.getWhatsAppQuickReplies().catch(() => null),
            ]);
            if (inboxRes?.success && inboxRes.data) setInboxSettings(inboxRes.data);
            if (teamRes?.success && teamRes.data) setTeamMembers(teamRes.data);
            if (quickRepliesRes?.success && quickRepliesRes.data) {
                setQuickReplies(quickRepliesRes.data);
            }
        } catch (error) {
            console.error('Error fetching connection data:', error);
        }
    }, []);

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchContacts(), fetchStats(), fetchAutoReplies(), fetchBroadcasts(), fetchConnectionData()]);
            setLoading(false);
        };
        loadData();
    }, [fetchContacts, fetchStats, fetchAutoReplies, fetchBroadcasts, fetchConnectionData]);

    // Load messages when contact selected
    useEffect(() => {
        if (selectedContact) {
            setMessages([]);
            fetchMessages(selectedContact.id);
        } else {
            setMessages([]);
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

    const openNewRuleModal = () => {
        setEditingRule(null);
        setRulePrefill(null);
        setShowRuleModal(true);
    };

    const openEditRuleModal = (rule: AutoReplyRule) => {
        setEditingRule(rule);
        setRulePrefill(null);
        setShowRuleModal(true);
    };

    const openTemplateModal = (template: AutoReplyRuleDraft) => {
        setEditingRule(null);
        setRulePrefill(template);
        setShowRuleModal(true);
    };

    const closeRuleModal = () => {
        setShowRuleModal(false);
        setEditingRule(null);
        setRulePrefill(null);
    };

    // Toggle auto-reply rule
    const handleToggleRule = async (ruleId: string) => {
        try {
            await apiService.toggleWhatsAppAutoReply(ruleId);
            await fetchAutoReplies();
            toast.success('Rule updated');
        } catch (error) {
            toast.error('Failed to update rule');
        }
    };

    // Delete auto-reply rule
    const handleDeleteRule = async (ruleId: string) => {
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
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div
            className={`bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col ${
                activeTab === 'contacts'
                    ? 'h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] overflow-hidden lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)]'
                    : 'min-h-0'
            }`}
        >
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-20 transition-colors shrink-0">
                <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    {/* Title row */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 whatsapp-header-tut min-w-0">
                            <div className="relative group shrink-0">
                                <div className="absolute inset-0 bg-green-500 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative w-9 h-9 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">WhatsApp Business</h1>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate hidden sm:block">Manage conversations & automation</p>
                            </div>
                        </div>

                        {/* Desktop stats */}
                        {stats && (
                            <div className="hidden lg:flex items-center gap-6 whatsapp-stats-tut shrink-0">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_contacts}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Contacts</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.messages_today}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Today</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active_auto_replies}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Auto-Replies</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tablet stats — hidden on inbox tab to maximize chat height */}
                    {stats && activeTab !== 'contacts' && (
                        <div className="hidden md:flex lg:hidden items-center justify-around w-full border-t dark:border-slate-800 pt-3 mt-3">
                            <div className="text-center">
                                <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.total_contacts}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Contacts</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.messages_today}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Today</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.active_auto_replies}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Auto-Replies</div>
                            </div>
                        </div>
                    )}

                    {/* Mobile stats — hidden on inbox tab to maximize chat height */}
                    {stats && activeTab !== 'contacts' && (
                        <div className="flex md:hidden items-center justify-around w-full border-t dark:border-slate-800 pt-3 mt-3">
                            <div className="text-center">
                                <div className="text-base font-bold text-slate-900 dark:text-white">{stats.total_contacts}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">Contacts</div>
                            </div>
                            <div className="text-center">
                                <div className="text-base font-bold text-slate-900 dark:text-white">{stats.messages_today}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">Today</div>
                            </div>
                            <div className="text-center">
                                <div className="text-base font-bold text-green-600 dark:text-green-400">{stats.active_auto_replies}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">Auto-Replies</div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 whatsapp-tabs-tut scrollbar-hide">
                        {[
                            { id: 'contacts', label: 'Conversations', shortLabel: 'Inbox', icon: Users },
                            { id: 'auto-reply', label: 'Auto-Reply', shortLabel: 'Auto', icon: Bot },
                            { id: 'broadcast', label: 'Broadcast', shortLabel: 'Broadcast', icon: Megaphone },
                            { id: 'analytics', label: 'Analytics', shortLabel: 'Stats', icon: BarChart3 },
                            { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-medium transition-all whitespace-nowrap shrink-0 whatsapp-tab-${tab.id}-tut ${activeTab === tab.id
                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4 shrink-0" />
                                <span className="sm:hidden">{tab.shortLabel}</span>
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div
                className={`flex-1 flex flex-col min-h-0 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-3 sm:px-4 ${
                    activeTab === 'contacts'
                        ? 'overflow-hidden py-0 sm:py-3'
                        : 'overflow-y-auto overflow-x-hidden py-3 sm:py-6 pb-10'
                }`}
            >
                {/* Discovery: Catalog Builder — hidden on inbox tab (mobile) to maximize chat space */}
                {activeTab !== 'contacts' && (
                <Link
                    to="/catalog-builder"
                    className="group mb-4 sm:mb-5 flex items-center gap-3 sm:gap-4 rounded-2xl border border-purple-200 dark:border-purple-500/30 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/20 p-3 sm:p-5 hover:shadow-md transition-all"
                >
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                            Build your product catalog from photos
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Snap pictures of your products and we'll generate a Google Sheet your ordering agent can sell from.
                        </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1 text-purple-700 dark:text-purple-400 font-semibold text-sm">
                        <span className="hidden sm:inline">Open Catalog Builder</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
                )}

                {activeTab === 'contacts' && (
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden -mx-3 sm:mx-0">
                    <ConversationsTab
                        contacts={contacts}
                        selectedContact={selectedContact}
                        setSelectedContact={setSelectedContact}
                        messages={messages}
                        setMessages={setMessages}
                        setContacts={setContacts}
                        fetchContacts={fetchContacts}
                        fetchMessages={fetchMessages}
                        messagesLoading={messagesLoading}
                        sharedTeamMembers={teamMembers}
                        sharedInboxSettings={inboxSettings}
                        sharedQuickReplies={quickReplies}
                        onSharedQuickRepliesChange={setQuickReplies}
                    />
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <WhatsAppAnalyticsTab />
                )}

                {activeTab === 'auto-reply' && (
                    <div className="space-y-6 whatsapp-auto-reply-tut">
                        {!waConnection && (
                            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm text-orange-800 dark:text-orange-300">
                                Connect your WhatsApp Business account in Settings to create and manage auto-reply rules.
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Auto-Reply Rules</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Automate responses to incoming messages</p>
                            </div>
                            <button
                                onClick={openNewRuleModal}
                                disabled={!waConnection}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                New Rule
                            </button>
                        </div>

                        {/* Rules List */}
                        <div className="grid gap-4">
                            {autoReplies.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-8 text-center transition-colors">
                                    <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-700" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No auto-reply rules yet</h3>
                                    <p className="text-gray-500 dark:text-slate-400 mb-4">
                                        Create rules to automatically respond to customer messages
                                    </p>
                                    <button
                                        onClick={openNewRuleModal}
                                        disabled={!waConnection}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Create First Rule
                                    </button>
                                </div>
                            ) : (
                                autoReplies.map((rule) => (
                                    <div
                                        key={rule.id}
                                        className={`bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-6 transition-colors ${rule.is_active ? '' : 'opacity-60'
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${rule.trigger_type === 'keyword' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                                        rule.trigger_type === 'first_message' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                                            rule.trigger_type === 'business_hours' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                                                                'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                        }`}>
                                                        {rule.trigger_type.replace('_', ' ')}
                                                    </span>
                                                    {rule.response_type === 'ai' && (
                                                        <span className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                                                            AI Powered
                                                        </span>
                                                    )}
                                                </div>

                                                {rule.description && (
                                                    <p className="text-sm text-gray-500 mb-2">{rule.description}</p>
                                                )}

                                                {rule.trigger_value && (
                                                    <div className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                                                        <span className="font-medium">Triggers:</span>{' '}
                                                        {rule.trigger_value.split('|').map((t, i) => (
                                                            <span key={i} className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded text-xs mr-1">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 mt-2 border border-transparent dark:border-slate-800 transition-colors">
                                                    <span className="font-medium">Response:</span>{' '}
                                                    {rule.response_content?.substring(0, 100)}
                                                    {(rule.response_content?.length || 0) > 100 && '...'}
                                                </div>

                                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-slate-500">
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
                                                    onClick={() => openEditRuleModal(rule)}
                                                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    title="Edit rule"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleRule(rule.id)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-700'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.is_active ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-6 transition-colors">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Real Estate Templates</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Click a template to pre-fill a new rule — review and save before it goes live.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {REAL_ESTATE_TEMPLATES.map((template, i) => (
                                    <button
                                        key={i}
                                        onClick={() => openTemplateModal(template)}
                                        disabled={!waConnection}
                                        className="p-4 border dark:border-slate-800 rounded-lg text-left hover:border-green-500 dark:hover:border-green-900/50 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-green-600 transition-colors">{template.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                                            Trigger: {template.trigger_type.replace('_', ' ')}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">
                                            {template.response_content}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'broadcast' && (
                    <div className="space-y-6 whatsapp-broadcast-tut">
                        {!waConnection && (
                            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm text-orange-800 dark:text-orange-300">
                                Connect your WhatsApp Business account in Settings to create and send broadcast campaigns.
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Broadcast Campaigns</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Send bulk messages to your contacts</p>
                            </div>
                            <button
                                onClick={() => setShowBroadcastModal(true)}
                                disabled={!waConnection}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                Create Campaign
                            </button>
                        </div>

                        {/* Broadcast Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                { label: 'Total Campaigns', value: broadcastStats?.total_campaigns ?? broadcasts.length, icon: Megaphone, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                                { label: 'Total Sent', value: broadcastStats?.total_sent ?? 0, icon: Send, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
                                { label: 'Delivered', value: broadcastStats?.total_delivered ?? 0, icon: CheckCheck, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
                                { label: 'Delivery Rate', value: `${broadcastStats?.delivery_rate ?? 0}%`, icon: Sparkles, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-4 transition-colors">
                                    <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Campaigns List */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 overflow-hidden transition-colors">
                            <div className="p-4 border-b dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h3 className="font-semibold text-slate-900 dark:text-white">All Campaigns</h3>
                                <select
                                    value={broadcastStatusFilter}
                                    onChange={(e) => setBroadcastStatusFilter(e.target.value)}
                                    className="text-sm px-3 py-1.5 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-800"
                                >
                                    <option value="">All statuses</option>
                                    <option value="draft">Draft</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="sending">Sending</option>
                                    <option value="completed">Completed</option>
                                    <option value="failed">Failed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="divide-y dark:divide-slate-800">
                                {broadcasts.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                                        <p className="text-slate-500 dark:text-slate-400">No broadcast campaigns yet</p>
                                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Create your first campaign to reach all your contacts at once</p>
                                    </div>
                                ) : (
                                    broadcasts.map((broadcast) => (
                                        <div key={broadcast.id} className="p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDetailBroadcastId(broadcast.id)}>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="font-medium text-slate-900 dark:text-white truncate">{broadcast.name}</h4>
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${broadcast.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                            broadcast.status === 'sending' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                                broadcast.status === 'scheduled' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                                                    broadcast.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                                                        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                                                            }`}>
                                                            {broadcast.status}
                                                        </span>
                                                    </div>
                                                    {broadcast.description && (
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{broadcast.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-500">
                                                        <span>{broadcast.total_recipients} recipients</span>
                                                        <span>{broadcast.sent_count} sent</span>
                                                        <span>{broadcast.delivered_count} delivered</span>
                                                        <span>{broadcast.read_count} read</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await apiService.duplicateWhatsAppBroadcast(broadcast.id);
                                                                toast.success('Broadcast duplicated');
                                                                fetchBroadcasts();
                                                            } catch (e) {
                                                                toast.error('Failed to duplicate');
                                                            }
                                                        }}
                                                        className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                        title="Duplicate"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                    {broadcast.status === 'draft' && (
                                                        <>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await apiService.sendWhatsAppBroadcast(broadcast.id);
                                                                        toast.success('Broadcast sending started!');
                                                                        fetchBroadcasts();
                                                                    } catch (e: any) {
                                                                        const detail = e?.response?.data?.detail;
                                                                        toast.error(typeof detail === 'string' ? detail : detail?.message || 'Failed to start broadcast');
                                                                    }
                                                                }}
                                                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
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
                                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                        
                        <CreateBroadcastModal
                            isOpen={showBroadcastModal}
                            onClose={() => setShowBroadcastModal(false)}
                            onSuccess={fetchBroadcasts}
                            whatsappConnected={!!waConnection}
                            contacts={contacts}
                        />
                        <BroadcastDetailModal
                            broadcastId={detailBroadcastId}
                            onClose={() => setDetailBroadcastId(null)}
                        />
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">

                        {/* Connected Account Details */}
                        {waConnection ? (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6 sm:p-8 transition-colors shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
                                            <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Connected Account</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your active WhatsApp Business connection</p>
                                        </div>
                                    </div>
                                    {waConnection.config?.phone_status === 'PENDING' ? (
                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full flex items-center gap-1.5 self-start sm:self-auto border border-yellow-200 dark:border-yellow-800/50">
                                                <AlertCircle className="w-3.5 h-3.5" /> Pending Registration
                                            </span>
                                            <button
                                                onClick={() => setShowRegistrationModal(true)}
                                                className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                            >
                                                Complete Registration
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1.5 self-start sm:self-auto border border-green-200 dark:border-green-800/50">
                                                <Check className="w-3.5 h-3.5" /> Active
                                            </span>
                                            <button
                                                onClick={() => setShowDeregisterModal(true)}
                                                className="px-4 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-semibold rounded-lg transition-colors border border-red-200 dark:border-red-800/50"
                                            >
                                                Deregister Phone
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 sm:mb-0">Connection Name</span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{waConnection.name}</span>
                                    </div>
                                    {waConnection.config?.phone_number && (
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 sm:mb-0">Phone Number</span>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">+{waConnection.config.phone_number}</span>
                                        </div>
                                    )}
                                    {waConnection.config?.business_name && (
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 sm:mb-0">Business Display Name</span>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{waConnection.config.business_name}</span>
                                        </div>
                                    )}
                                    {waConnection.config?.waba_id && (
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 sm:mb-0">WABA ID</span>
                                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded">{waConnection.config.waba_id}</span>
                                        </div>
                                    )}
                                    {waConnection.config?.phone_number_id && (
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 sm:mb-0">Phone Number ID</span>
                                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded">{waConnection.config.phone_number_id}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3">
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 sm:mb-0">Connected Since</span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {new Date(waConnection.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-800/30 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors">
                                <div className="p-2 bg-orange-100 dark:bg-orange-800/30 rounded-full shrink-0">
                                    <Bot className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-orange-900 dark:text-orange-300">No Account Connected</h3>
                                    <p className="text-sm text-orange-700 dark:text-orange-400/80 mt-1">Please connect your WhatsApp Business account in the Connections tab to access full features.</p>
                                </div>
                                <button
                                    onClick={launchWhatsAppSignup}
                                    className="shrink-0 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors mt-2 sm:mt-0 whitespace-nowrap"
                                >
                                    Connect Using Meta
                                </button>
                            </div>
                        )}

                        {/* Phone Numbers Management */}
                        {waConnection && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6 sm:p-8 transition-colors shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
                                            <Phone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Phone Numbers</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                setIsSyncingNumbers(true);
                                                try {
                                                    const res = await apiService.syncWhatsAppPhoneNumbers();
                                                    if (res.success) setPhoneNumbers(res.data);
                                                    toast.success("Synced numbers");
                                                } catch (e) {
                                                    toast.error("Sync failed");
                                                }
                                                setIsSyncingNumbers(false);
                                            }}
                                            disabled={isSyncingNumbers}
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            {isSyncingNumbers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                            Sync
                                        </button>
                                        <button
                                            onClick={launchWhatsAppSignup}
                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                                        >
                                            Add Number
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    Manage your connected sending numbers via Meta Embedded Signup. The quality rating determines your daily messaging limits.
                                </p>

                                {phoneNumbers && phoneNumbers.length > 0 ? (
                                    <div className="space-y-3">
                                        {phoneNumbers.map((pn, i) => (
                                            <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
                                                <div>
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-white inline-block">+{String(pn.display_phone_number || pn.phone_number || pn.id).replace(/^\+/, '')}</span>
                                                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{pn.name_status || 'PENDING_REVIEW'} | Quality: {pn.quality_rating || 'UNKNOWN'}</span>
                                                </div>
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${pn.status === 'CONNECTED' || pn.status?.toUpperCase() === 'CONNECTED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                                                    {pn.status || 'PENDING'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                        No numbers fetched yet. Click "Add Number" to setup or "Sync" to refresh.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6 sm:p-8 transition-colors shadow-sm">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Business Profile</h3>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 border-b border-transparent">
                                This information helps AI generate better responses for your customers.
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        value={businessProfile.business_name || ''}
                                        onChange={(e) => setBusinessProfile({ ...businessProfile, business_name: e.target.value })}
                                        placeholder="Your Business Name"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder:text-slate-500 shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={businessProfile.description || ''}
                                        onChange={(e) => setBusinessProfile({ ...businessProfile, description: e.target.value })}
                                        placeholder="What does your business do?"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder:text-slate-500 shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Industry
                                    </label>
                                    <select
                                        value={businessProfile.industry || ''}
                                        onChange={(e) => setBusinessProfile({ ...businessProfile, industry: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white shadow-sm"
                                    >
                                        <option value="">Select industry</option>
                                        <option value="retail">Retail & E-commerce</option>
                                        <option value="food">Food & Beverage</option>
                                        <option value="services">Professional Services</option>
                                        <option value="health">Health & Beauty</option>
                                        <option value="tech">Technology</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <button
                                    onClick={async () => {
                                        setIsSavingProfile(true);
                                        try {
                                            const resp = await apiService.updateWhatsAppBusinessProfile({
                                                business_name: businessProfile.business_name,
                                                description: businessProfile.description,
                                                industry: businessProfile.industry,
                                            });
                                            if (resp.success) {
                                                toast.success('Profile saved successfully!');
                                            } else {
                                                toast.error(resp.message || 'Failed to save profile');
                                            }
                                        } catch (e: any) {
                                            toast.error(e?.response?.data?.detail || 'Failed to save profile');
                                        } finally {
                                            setIsSavingProfile(false);
                                        }
                                    }}
                                    disabled={isSavingProfile}
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Profile
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6 sm:p-8 transition-colors shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Team inbox</h3>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Round-robin assignment and SLA targets for open conversations.
                            </p>
                            <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={inboxSettings.round_robin_enabled}
                                    onChange={(e) => setInboxSettings({ ...inboxSettings, round_robin_enabled: e.target.checked })}
                                    className="rounded border-slate-300 text-green-600"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Auto-assign new conversations (round-robin)</span>
                            </label>
                            {inboxSettings.round_robin_enabled && (
                                <div className="mb-4 max-h-40 overflow-y-auto border dark:border-slate-700 rounded-xl p-3 space-y-2">
                                    {teamMembers.map((m) => (
                                        <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={inboxSettings.round_robin_agent_ids.includes(m.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...inboxSettings.round_robin_agent_ids, m.id]
                                                        : inboxSettings.round_robin_agent_ids.filter((id) => id !== m.id);
                                                    setInboxSettings({ ...inboxSettings, round_robin_agent_ids: ids });
                                                }}
                                            />
                                            {m.name}
                                        </label>
                                    ))}
                                </div>
                            )}
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                First response SLA (minutes)
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={120}
                                value={inboxSettings.sla_first_response_minutes}
                                onChange={(e) => setInboxSettings({ ...inboxSettings, sla_first_response_minutes: Number(e.target.value) })}
                                className="w-full max-w-xs px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 mb-4"
                            />
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notification preferences</p>
                            <div className="space-y-2 mb-4">
                                {([
                                    ['notify_new_message_browser', 'Browser notifications for new messages'],
                                    ['notify_new_message_sound', 'Sound alert for new messages'],
                                    ['notify_new_message_email', 'Email when SLA is breached (coming soon)'],
                                    ['notify_sla_breach', 'Highlight SLA breaches in inbox'],
                                    ['csat_enabled', 'Send CSAT survey when marking resolved'],
                                ] as const).map(([key, label]) => (
                                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Boolean((inboxSettings as Record<string, unknown>)[key])}
                                            onChange={(e) => setInboxSettings({ ...inboxSettings, [key]: e.target.checked })}
                                            className="rounded border-slate-300 text-green-600"
                                        />
                                        <span className="text-slate-700 dark:text-slate-300">{label}</span>
                                    </label>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const res = await apiService.updateWhatsAppInboxSettings(inboxSettings);
                                        if (res.success) toast.success('Inbox settings saved');
                                    } catch {
                                        toast.error('Failed to save inbox settings');
                                    }
                                }}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                            >
                                Save inbox settings
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6 sm:p-8 transition-colors shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Business Hours</h3>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Set your operating hours and away message. Used by &quot;Outside Business Hours&quot; auto-reply rules.
                            </p>

                            <div className="mb-5">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Timezone
                                </label>
                                <select
                                    value={businessProfile.timezone}
                                    onChange={(e) => setBusinessProfile({ ...businessProfile, timezone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white shadow-sm"
                                >
                                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                                    <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                                    <option value="UTC">UTC</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Away Message
                                </label>
                                <textarea
                                    rows={2}
                                    value={businessProfile.away_message}
                                    onChange={(e) => setBusinessProfile({ ...businessProfile, away_message: e.target.value })}
                                    placeholder="Thanks for reaching out! We're currently closed and will reply during business hours."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder:text-slate-500 shadow-sm"
                                />
                            </div>

                            <div className="space-y-4">
                                {WEEKDAYS.map((day) => {
                                    const dayHours = businessProfile.business_hours_ui[day];
                                    return (
                                    <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 group">
                                        <div className="w-28 font-semibold text-slate-700 dark:text-slate-300">{formatDayLabel(day)}</div>
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="time"
                                                value={dayHours.open}
                                                disabled={!dayHours.is_open}
                                                onChange={(e) => setBusinessProfile({
                                                    ...businessProfile,
                                                    business_hours_ui: {
                                                        ...businessProfile.business_hours_ui,
                                                        [day]: { ...dayHours, open: e.target.value },
                                                    },
                                                })}
                                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-40"
                                            />
                                            <span className="text-slate-400">to</span>
                                            <input
                                                type="time"
                                                value={dayHours.close}
                                                disabled={!dayHours.is_open}
                                                onChange={(e) => setBusinessProfile({
                                                    ...businessProfile,
                                                    business_hours_ui: {
                                                        ...businessProfile.business_hours_ui,
                                                        [day]: { ...dayHours, close: e.target.value },
                                                    },
                                                })}
                                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-40"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={dayHours.is_open}
                                                onChange={(e) => setBusinessProfile({
                                                    ...businessProfile,
                                                    business_hours_ui: {
                                                        ...businessProfile.business_hours_ui,
                                                        [day]: { ...dayHours, is_open: e.target.checked },
                                                    },
                                                })}
                                                className="rounded border-slate-300 dark:border-slate-700 text-green-600 focus:ring-green-500 dark:bg-slate-800"
                                            />
                                            <span className="font-medium">Open</span>
                                        </label>
                                    </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={async () => {
                                    setIsSavingHours(true);
                                    try {
                                        const resp = await apiService.updateWhatsAppBusinessProfile({
                                            business_hours: businessHoursToApi(businessProfile.business_hours_ui),
                                            away_message: businessProfile.away_message,
                                            timezone: businessProfile.timezone,
                                        });
                                        if (resp.success) {
                                            toast.success('Business hours saved!');
                                        } else {
                                            toast.error(resp.message || 'Failed to save hours');
                                        }
                                    } catch (e: any) {
                                        toast.error(e?.response?.data?.detail || 'Failed to save hours');
                                    } finally {
                                        setIsSavingHours(false);
                                    }
                                }}
                                disabled={isSavingHours}
                                className="mt-8 px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSavingHours && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save Hours
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AutoReplyRuleModal
                isOpen={showRuleModal}
                onClose={closeRuleModal}
                onSuccess={fetchAutoReplies}
                whatsappConnected={Boolean(waConnection)}
                editingRule={editingRule}
                prefilled={rulePrefill}
            />

            {/* Registration Modal */}
            {showRegistrationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                    <Key className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Register Phone Number</h2>
                            </div>
                            <button
                                onClick={() => setShowRegistrationModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Your number has been verified, but it needs to be registered with the WhatsApp Cloud API to start messaging.
                                Please create a secure 6-digit Two-Step Verification PIN.
                            </p>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    6-Digit PIN
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="e.g. 123456"
                                    value={registrationPin}
                                    onChange={(e) => setRegistrationPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-3 text-center tracking-widest text-lg font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all dark:text-white"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Remember this PIN. You will need it if you ever re-register this number.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowRegistrationModal(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRegisterPhone}
                                disabled={isRegistering || registrationPin.length !== 6}
                                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Register Number
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deregistration Modal */}
            {showDeregisterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Deregister Phone Number</h2>
                            </div>
                            <button
                                onClick={() => setShowDeregisterModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Are you sure you want to deregister this phone number? It will be completely disconnected from the WhatsApp Business API and you will no longer be able to send or receive messages until you register it again.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowDeregisterModal(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeregisterPhone}
                                disabled={isDeregistering}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                {isDeregistering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deregister'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppDashboard;
