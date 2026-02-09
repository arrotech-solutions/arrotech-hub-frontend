import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, Inbox,
    PenSquare, Paperclip, Reply, Archive, X, Send, Tag,
    Menu, ArrowLeft, Star, Trash, Clock, Sparkles
} from 'lucide-react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

// Brand Assets
import gmailLogo from '../assets/apps/gmail.png';
import slackLogo from '../assets/apps/slack.jpg';
import teamsLogo from '../assets/apps/microsoft_teams.png';
import outlookLogo from '../assets/apps/outlook.png';

interface Message {
    id: string;
    source: 'gmail' | 'slack' | 'teams' | 'outlook';
    sender: string;
    senderEmail?: string; // For Gmail/Outlook reply-to
    channelId?: string; // For Slack channel replies
    threadTs?: string; // For Slack thread replies
    subject: string;
    preview: string;
    fullContent?: string;
    time: string;
    timestamp?: number;
    read: boolean;
    starred: boolean;
    avatar?: string;
    labels?: string[];
}

// Phase 3: Intelligent Inbox++ Types
interface EnrichedMessageData {
    priority: number; // 1-5
    labels: string[];
    summary?: string;
    quick_replies?: string[];
}

// Priority Badge Component
const PriorityBadge: React.FC<{ level: number }> = ({ level }) => {
    const configs: Record<number, { bg: string; text: string; label: string }> = {
        5: { bg: 'bg-red-500', text: 'text-white', label: 'Critical' },
        4: { bg: 'bg-orange-500', text: 'text-white', label: 'High' },
        3: { bg: 'bg-yellow-400', text: 'text-yellow-900', label: 'Medium' },
        2: { bg: 'bg-green-500', text: 'text-white', label: 'Low' },
        1: { bg: 'bg-gray-300', text: 'text-gray-700', label: 'Info' }
    };
    const config = configs[level] || configs[3];
    return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${config.bg} ${config.text}`}>
            P{level}
        </span>
    );
};

// Smart Label Component
const SmartLabel: React.FC<{ label: string }> = ({ label }) => {
    const styles: Record<string, string> = {
        'Action Required': 'bg-red-50 text-red-700 border-red-200',
        'Waiting': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'FYI': 'bg-blue-50 text-blue-700 border-blue-200',
        'Marketing': 'bg-purple-50 text-purple-700 border-purple-200',
        'Personal': 'bg-green-50 text-green-700 border-green-200',
        'Financial': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Meeting': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'Newsletter': 'bg-gray-50 text-gray-600 border-gray-200'
    };
    return (
        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${styles[label] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {label}
        </span>
    );
};

const parseGmailBody = (payload: any): string => {
    if (!payload) return '';
    console.log('🔍 Parsing Payload Structure:', payload.mimeType);

    let htmlBody = '';
    let plainBody = '';

    const decode = (data: string) => {
        try {
            return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
        } catch (e) {
            console.error('Base64 decode error', e);
            return '';
        }
    };

    const traverse = (p: any) => {
        // console.log('➡️ Visiting part:', p.mimeType); // Verbose traversal log

        if (p.mimeType === 'text/html' && p.body?.data) {
            console.log('✅ Found HTML part. Size:', p.body.size);
            htmlBody = decode(p.body.data);
        }
        else if (p.mimeType === 'text/plain' && p.body?.data) {
            console.log('📄 Found Plain text part. Size:', p.body.size);
            if (!plainBody) plainBody = decode(p.body.data);
        }

        if (p.parts) {
            p.parts.forEach((part: any) => traverse(part));
        }
    };

    traverse(payload);

    // Check root if not found in parts
    if (!htmlBody && !plainBody) {
        if (payload.body?.data) {
            console.log('📦 Found root body data. Mime:', payload.mimeType);
            const decoded = decode(payload.body.data);
            if (payload.mimeType === 'text/html') htmlBody = decoded;
            else if (payload.mimeType === 'text/plain') plainBody = decoded;
        }
    }

    const result = htmlBody || plainBody || payload.snippet || '';
    if (!htmlBody && !plainBody) console.warn('⚠️ No body found, falling back to snippet');
    return result;
};

const UnifiedInbox: React.FC = () => {
    // State
    const [activeTab, setActiveTab] = useState<'all' | 'gmail' | 'slack' | 'teams' | 'outlook'>('all');
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // UI State
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    // Phase 3: Intelligent Inbox++ State
    const [enrichments, setEnrichments] = useState<Record<string, EnrichedMessageData>>({});
    const [analyzingMessages, setAnalyzingMessages] = useState(false);
    const [snoozedMessages, setSnoozedMessages] = useState<Set<string>>(new Set());
    const [snoozeDropdownOpen, setSnoozeDropdownOpen] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Compose/Reply State
    const [composeChannel, setComposeChannel] = useState<'gmail' | 'slack' | 'teams' | 'outlook'>('gmail');
    const [replyText, setReplyText] = useState('');
    const replyInputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [composeTo, setComposeTo] = useState('');
    const [composeCc, setComposeCc] = useState('');
    const [composeBcc, setComposeBcc] = useState('');
    const [showCcBcc, setShowCcBcc] = useState(false);
    const [composeSubject, setComposeSubject] = useState('');

    const [composeBody, setComposeBody] = useState('');

    // Compose Attachment State
    const composeFileInputRef = useRef<HTMLInputElement>(null);
    const [composeAttachments, setComposeAttachments] = useState<File[]>([]);

    // Compose File Handlers
    const handleComposeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        console.log('Compose files selected:', files);
        if (files && files.length > 0) {
            const newFiles = Array.from(files);
            console.log('Adding compose files:', newFiles);
            setComposeAttachments(prev => [...prev, ...newFiles]);
            // Feedback
            toast.success(`Attached ${newFiles.length} file(s)`);
        }
        if (e.target) e.target.value = '';
    };

    const removeComposeAttachment = (index: number) => {
        setComposeAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // File attachment handler
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        console.log('Files selected:', files);
        if (files && files.length > 0) {
            const newFiles = Array.from(files);
            console.log('Adding files:', newFiles);
            setAttachments(prev => [...prev, ...newFiles]);
        }
        // Reset input so same file can be selected again
        if (e.target) {
            e.target.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // --- Actions (Moved & Memoized) ---
    const handleArchive = useCallback((id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
    }, [selectedMessage]);

    const handleDelete = useCallback((id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
    }, [selectedMessage]);

    const handleStar = useCallback((id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMessages(prev => prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
        if (selectedMessage?.id === id) setSelectedMessage(prev => prev ? { ...prev, starred: !prev.starred } : null);
    }, [selectedMessage]);

    const handleSelectMessage = useCallback(async (msg: Message) => {
        console.log('👆 Message Selected:', msg);
        if (!msg.read) setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
        setSelectedMessage({ ...msg, read: true });
    }, []);

    // --- Mock Data & Fetching ---
    const stats = {
        all: messages.filter(m => !m.read).length,
        gmail: messages.filter(m => !m.read && m.source === 'gmail').length,
        slack: messages.filter(m => !m.read && m.source === 'slack').length,
        teams: messages.filter(m => !m.read && m.source === 'teams').length,
        outlook: messages.filter(m => !m.read && m.source === 'outlook').length,
    };

    const tabs = [
        { id: 'all', label: 'All', icon: Inbox, color: 'text-gray-900', bg: 'bg-gray-100' },
        { id: 'gmail', label: 'Gmail', logo: gmailLogo, bg: 'bg-white' }, // Logos have their own colors
        { id: 'slack', label: 'Slack', logo: slackLogo, bg: 'bg-white' },
        { id: 'teams', label: 'Teams', logo: teamsLogo, bg: 'bg-white' },
        { id: 'outlook', label: 'Outlook', logo: outlookLogo, bg: 'bg-white' },
    ];

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const [gmailRes, slackRes, teamsRes, outlookRes] = await Promise.allSettled([
                apiService.executeMCPTool('google_workspace_gmail', { operation: 'read_emails', max_results: 20 }),
                apiService.executeMCPTool('slack_search', { action: 'get_channel_history', channel: 'general', limit: 20 }),
                apiService.executeMCPTool('teams_message_search', { action: 'get_recent_chats', limit: 20 }),
                apiService.executeMCPTool('outlook_email_management', { action: 'read_emails', limit: 20 })
            ]);

            let allMessages: Message[] = [];
            // Helper to extract data from various MCP return structures
            const unwrap = (res: PromiseSettledResult<any>) => {
                if (res.status === 'fulfilled' && res.value?.success) {
                    return res.value;
                }
                return null;
            };

            const gmailRaw = unwrap(gmailRes);
            const gmailEmails = gmailRaw?.emails || gmailRaw?.messages || gmailRaw?.data?.emails || gmailRaw?.result?.emails || gmailRaw?.result?.messages;
            if (gmailEmails) {
                allMessages.push(...gmailEmails.map((e: any) => {
                    const dateMs = new Date(e.date).getTime() || Date.now();
                    // Extract email from "Name <email@example.com>" format
                    const emailMatch = e.from?.match(/<(.+?)>/);
                    const senderEmail = emailMatch ? emailMatch[1] : e.from?.trim();
                    return {
                        id: e.id, source: 'gmail' as const,
                        sender: e.from?.replace(/<.*>/, '').trim() || 'Unknown',
                        senderEmail: senderEmail,
                        subject: e.subject || 'No Subject',
                        preview: e.snippet || '',
                        time: new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        timestamp: dateMs,
                        read: !e.label_ids?.includes('UNREAD'),
                        starred: e.label_ids?.includes('STARRED'),
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(e.from || 'U')}&background=random`
                    };
                }));
            }

            const slackRaw = unwrap(slackRes);

            // Unpacking logic matching UnifiedDashboard
            const slackData = slackRaw?.data || slackRaw?.result || slackRaw;
            const slackMessages = slackData?.messages || slackData?.data?.messages || []; // Dashboard logic

            if (slackMessages && Array.isArray(slackMessages)) {
                allMessages.push(...slackMessages.map((m: any) => {
                    const ts = m.timestamp || m.ts;
                    console.log('Slack Message:', m, 'TS:', ts); // Debug
                    return {
                        id: ts || Math.random().toString(),
                        source: 'slack' as const,
                        sender: m.user || 'Slack User',
                        channelId: m.channel || m.channel_id || m.channel_name,
                        threadTs: m.thread_ts || ts,
                        subject: m.channel ? `#${m.channel}` : 'Direct Message',
                        preview: m.text || '',
                        fullContent: m.text || 'No content.',
                        time: ts ? new Date(parseFloat(ts) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
                        timestamp: ts ? parseFloat(ts) * 1000 : Date.now(),
                        read: true,
                        starred: false,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user || 'S')}&background=E0E7FF&color=4338CA`
                    };
                }));
            }

            const teamsRaw = unwrap(teamsRes);

            // Check connection status
            // If teamsRaw contains an error message or success: false, treat as disconnected
            if (!teamsRaw || teamsRaw.success === false || teamsRaw.error) {
                console.error('Teams Error:', teamsRaw?.error); // Keep this for debugging
                // Optionally store the error text to show the user
                if (teamsRaw?.error) {
                    toast.error(`Teams Error: ${typeof teamsRaw.error === 'string' ? teamsRaw.error : JSON.stringify(teamsRaw.error)}`);
                }
            }

            const teamsMessages = teamsRaw?.chats || teamsRaw?.messages || teamsRaw?.data?.messages || teamsRaw?.data?.chats || teamsRaw?.data;
            if (teamsMessages && Array.isArray(teamsMessages)) {
                allMessages.push(...teamsMessages.map((c: any) => ({
                    id: c.id || Math.random().toString(),
                    source: 'teams' as const,
                    sender: c.from?.user?.displayName || c.from || 'Teams User',
                    subject: c.subject || 'Chat Message',
                    preview: c.body?.content || c.preview || '',
                    fullContent: c.body?.content || c.preview || 'No content.',
                    time: new Date(c.createdDateTime || c.created_date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: !c.is_read,
                    starred: false,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.from?.user?.displayName || c.from || 'T')}&background=DCFCE7&color=15803D`
                })));
            }

            const outlookRaw = unwrap(outlookRes);
            const outlookEmails = outlookRaw?.emails || outlookRaw?.messages || outlookRaw?.data?.emails || outlookRaw?.data?.messages;
            if (outlookEmails && Array.isArray(outlookEmails)) {
                allMessages.push(...outlookEmails.map((e: any) => ({
                    id: e.id, source: 'outlook' as const,
                    sender: e.from?.emailAddress?.name || e.from?.emailAddress?.address || e.from || 'Outlook User',
                    subject: e.subject || 'No Subject',
                    preview: e.bodyPreview || e.preview || '',
                    fullContent: e.body?.content || e.bodyPreview || 'No content.',
                    time: new Date(e.receivedDateTime || e.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: e.isRead || e.is_read,
                    starred: e.flag?.flagStatus === 'flagged',
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(e.from?.emailAddress?.name || e.from || 'O')}&background=F3E8FF&color=7E22CE`
                })));
            }

            if (allMessages.length === 0) {
                allMessages = [
                    { id: '1', source: 'gmail', sender: 'Elara Vantage', subject: 'Q2 Design Systems Sync', preview: 'The updated FIGMA files are ready for review. Please check the attachment.', fullContent: 'Hi Team,\n\nThe updated FIGMA files are ready for review. I have incorporated the feedback from the last design critique. Please check the attachment and let me know your thoughts.\n\nBest,\nElara', time: '10:42 AM', read: false, starred: true, avatar: 'https://ui-avatars.com/api/?name=Elara+Vantage&background=FFEDD5&color=C2410C' },
                    { id: '2', source: 'slack', sender: '#engineering', subject: 'Deployment Alert', preview: 'Production deployment started by @alex.', fullContent: 'Production deployment started by @alex. Monitoring logs for anomalies.', time: '10:30 AM', read: true, starred: false, avatar: 'https://ui-avatars.com/api/?name=Eng&background=E0E7FF&color=4338CA' },
                    { id: '3', source: 'teams', sender: 'Sarah Connor', subject: 'Budget Approval', preview: 'Can we quickly sync on the Q3 budget items?', fullContent: 'Can we quickly sync on the Q3 budget items? I need to finalize the spreadsheet by EOD.', time: '09:15 AM', read: false, starred: false, avatar: 'https://ui-avatars.com/api/?name=Sarah+Connor&background=DCFCE7&color=15803D' },
                    { id: '4', source: 'outlook', sender: 'Jason Fried', subject: 'Re: Project Roadmap', preview: 'I think we should reconsider the timeline for...', fullContent: 'I think we should reconsider the timeline for the mobile app launch. We need more time for QA.', time: 'Yesterday', read: true, starred: true, avatar: 'https://ui-avatars.com/api/?name=Jason+Fried&background=F3E8FF&color=7E22CE' },
                    { id: '5', source: 'gmail', sender: 'Stripe', subject: 'Receipt #1923-4421', preview: 'Your subscription has been renewed.', fullContent: 'Your subscription has been renewed. Amount: $29.00', time: 'Yesterday', read: true, starred: false, avatar: 'https://ui-avatars.com/api/?name=Stripe&background=F1F5F9&color=475569' },
                ] as any;
            }
            // Sort by timestamp descending (most recent first)
            allMessages.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
            setMessages(allMessages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    // Phase 3: Analyze messages with AI after fetching
    useEffect(() => {
        const analyzeWithAI = async () => {
            if (messages.length === 0 || analyzingMessages) return;

            // Check if we already have enrichments for most messages
            const unenrichedCount = messages.filter(m => !enrichments[m.id]).length;
            if (unenrichedCount === 0) return;

            setAnalyzingMessages(true);
            try {
                const toAnalyze = messages.slice(0, 20).map(m => ({
                    id: m.id,
                    source: m.source,
                    sender: m.sender,
                    subject: m.subject,
                    preview: m.preview,
                    full_content: m.fullContent
                }));

                const result = await apiService.analyzeMessages(toAnalyze);
                if (result.success && result.enriched) {
                    setEnrichments(prev => ({ ...prev, ...result.enriched }));
                }
            } catch (error) {
                console.error('AI message analysis failed:', error);
            } finally {
                setAnalyzingMessages(false);
            }
        };

        // Delay analysis slightly to not block initial render
        const timer = setTimeout(analyzeWithAI, 500);
        return () => clearTimeout(timer);
    }, [messages, analyzingMessages, enrichments]); // Only re-run when message count changes

    // Phase 3: Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle if typing in input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Compute filtered list inside handler to avoid hoisting issues
            const currentMessages = messages
                .filter(msg => {
                    const matchTab = activeTab === 'all' || msg.source === activeTab;
                    const matchSearch = msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        msg.subject.toLowerCase().includes(searchTerm.toLowerCase());
                    return matchTab && matchSearch && !snoozedMessages.has(msg.id);
                });

            const currentIndex = selectedMessage
                ? currentMessages.findIndex(m => m.id === selectedMessage.id)
                : -1;

            switch (e.key) {
                case 'j': // Next message
                    e.preventDefault();
                    if (currentIndex < currentMessages.length - 1) {
                        handleSelectMessage(currentMessages[currentIndex + 1]);
                    }
                    break;
                case 'k': // Previous message
                    e.preventDefault();
                    if (currentIndex > 0) {
                        handleSelectMessage(currentMessages[currentIndex - 1]);
                    }
                    break;
                case 'r': // Reply
                    e.preventDefault();
                    if (selectedMessage) {
                        replyInputRef.current?.focus();
                    }
                    break;
                case 'a': // Archive
                    e.preventDefault();
                    if (selectedMessage) {
                        handleArchive(selectedMessage.id);
                    }
                    break;
                case 's': // Snooze
                    e.preventDefault();
                    if (selectedMessage) {
                        setSnoozeDropdownOpen(selectedMessage.id);
                    }
                    break;
                case '/': // Search
                    e.preventDefault();
                    searchInputRef.current?.focus();
                    break;
                case 'Escape':
                    e.preventDefault();
                    setSelectedMessage(null);
                    setSnoozeDropdownOpen(null);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedMessage, messages, activeTab, searchTerm, snoozedMessages, handleArchive, handleSelectMessage]);

    // Phase 3: Snooze handler
    const handleSnooze = useCallback((messageId: string, duration: string) => {
        setSnoozedMessages(prev => new Set(Array.from(prev).concat(messageId)));
        setSnoozeDropdownOpen(null);
        if (selectedMessage?.id === messageId) {
            setSelectedMessage(null);
        }

        const durationText: Record<string, string> = {
            '1h': '1 hour',
            '4h': '4 hours',
            'tomorrow': 'tomorrow morning',
            'nextweek': 'next week'
        };
        toast.success(`Snoozed until ${durationText[duration] || duration}`, { icon: '😴' });

        // For demo: un-snooze after specified time (in production, this would be server-side)
        const delays: Record<string, number> = {
            '1h': 3600000,
            '4h': 14400000,
            'tomorrow': 86400000,
            'nextweek': 604800000
        };
        const delay = delays[duration] || 3600000;

        // For demo purposes, use shorter delays
        const demoDelay = Math.min(delay, 30000); // Max 30s for demo
        setTimeout(() => {
            setSnoozedMessages(prev => {
                const newSet = new Set(prev);
                newSet.delete(messageId);
                return newSet;
            });
            toast(`Message unsnoozed`, { icon: '📬' });
        }, demoDelay);
    }, [selectedMessage]);

    // --- Actions ---
    // --- Actions definitions moved to top ---

    // New state for message specific loading
    const [messageLoading, setMessageLoading] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            console.log('🔄 Effect Triggered. Selected:', selectedMessage?.id, 'Source:', selectedMessage?.source);

            if (!selectedMessage) return;
            if (selectedMessage.source !== 'gmail') {
                console.log('⏭️ Skipping fetch for source:', selectedMessage.source);
                return;
            }

            // Skip if already loaded
            if (selectedMessage.fullContent && selectedMessage.fullContent.length > 200) {
                console.log('✅ Already have full content, skipping fetch');
                return;
            }

            console.log('🚀 Fetching details for Gmail message:', selectedMessage.id);
            setMessageLoading(true);

            try {
                const res = await apiService.executeMCPTool('google_workspace_gmail', {
                    operation: 'get_email_details',
                    message_id: selectedMessage.id
                }) as any;

                console.log('📧 API Response:', res);

                // API wraps response in 'result' - check both structures
                const emailData = res.result?.email || res.email;

                if (res && res.success && emailData) {
                    console.log('📧 Full Email Payload:', emailData.payload);
                    const fullBody = parseGmailBody(emailData.payload);
                    console.log('📝 Parsed Body Length:', fullBody?.length);
                    console.log('📜 FULL BODY CONTENT:', fullBody);

                    if (fullBody && fullBody.length > 0) {
                        // Use functional update with the message ID to avoid stale closure
                        const messageId = selectedMessage.id;
                        setSelectedMessage(prev => {
                            if (prev && prev.id === messageId) {
                                console.log('✅ Setting fullContent on selectedMessage');
                                return { ...prev, fullContent: fullBody };
                            }
                            return prev;
                        });
                        setMessages(prev => prev.map(m =>
                            m.id === messageId ? { ...m, fullContent: fullBody } : m
                        ));
                    } else {
                        console.warn('⚠️ Parsed body was empty!');
                    }
                } else {
                    console.error('❌ API call failed or missing email:', res);
                }
            } catch (err) {
                console.error("Failed to fetch full email body", err);
                toast.error("Could not load full email content");
            } finally {
                setMessageLoading(false);
            }
        };

        if (selectedMessage?.source === 'gmail') {
            fetchDetails();
        }
    }, [selectedMessage]);

    const [replySending, setReplySending] = useState(false);

    // Helper to convert File to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the data URL prefix (e.g., "data:image/png;base64,")
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedMessage) return;

        setReplySending(true);
        try {
            let result: any = null;

            if (selectedMessage.source === 'gmail') {
                // Gmail reply - use send_email with Re: subject
                const replyTo = selectedMessage.senderEmail || selectedMessage.sender;
                const replySubject = selectedMessage.subject?.startsWith('Re:')
                    ? selectedMessage.subject
                    : `Re: ${selectedMessage.subject}`;

                // Convert attachments to base64 format
                let emailAttachments: Array<{ filename: string, content: string }> = [];
                if (attachments.length > 0) {
                    emailAttachments = await Promise.all(
                        attachments.map(async (file) => ({
                            filename: file.name,
                            content: await fileToBase64(file)
                        }))
                    );
                }

                result = await apiService.executeMCPTool('google_workspace_gmail', {
                    operation: 'send_email',
                    to: replyTo,
                    subject: replySubject,
                    body: replyText,
                    attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
                });
            } else if (selectedMessage.source === 'slack') {
                // Slack reply - send message as thread reply
                const channel = selectedMessage.channelId ||
                    selectedMessage.subject?.replace('#', '') ||
                    'general';

                // Use the message timestamp (threadTs or id) for threaded reply
                const threadTs = selectedMessage.threadTs || selectedMessage.id;

                // Convert attachments to base64 format for Slack
                let slackAttachments: Array<{ filename: string, content: string }> = [];
                if (attachments.length > 0) {
                    slackAttachments = await Promise.all(
                        attachments.map(async (file) => ({
                            filename: file.name,
                            content: await fileToBase64(file)
                        }))
                    );
                }

                result = await apiService.executeMCPTool('slack_team_communication', {
                    action: 'send_message',
                    channel: channel,
                    message: replyText,
                    thread_ts: threadTs, // Reply in thread
                    attachments: slackAttachments.length > 0 ? slackAttachments : undefined,
                });
            } else if (selectedMessage.source === 'outlook') {
                // Outlook reply
                const replyTo = selectedMessage.senderEmail || selectedMessage.sender;
                const replySubject = selectedMessage.subject?.startsWith('Re:')
                    ? selectedMessage.subject
                    : `Re: ${selectedMessage.subject}`;

                result = await apiService.executeMCPTool('outlook_email_management', {
                    action: 'send_email',
                    to_email: replyTo,
                    subject: replySubject,
                    content: replyText,
                });
            } else if (selectedMessage.source === 'teams') {
                // Teams reply
                const channel = selectedMessage.channelId || selectedMessage.subject;

                result = await apiService.executeMCPTool('teams_team_communication', {
                    action: 'send_message',
                    channel: channel,
                    message: replyText,
                });
            }


            // Check for blocked operation (upgrade required)
            const innerResult = result?.result;
            if (innerResult?.upgrade_required || innerResult?.success === false) {
                toast.error(innerResult?.error || 'This feature requires an upgrade. Please upgrade your plan.');
                return;
            }

            if (result && (result.success || result.status === 'ok' || (innerResult && innerResult.success !== false))) {
                toast.success(`Reply sent via ${selectedMessage.source}!` + (attachments.length > 0 ? ` (${attachments.length} file${attachments.length > 1 ? 's' : ''} attached)` : ''));
                setReplyText('');
                setAttachments([]);
            } else {
                toast.error('Failed to send reply: ' + (innerResult?.error || result?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Reply error:', error);
            toast.error('An error occurred while sending the reply.');
        } finally {
            setReplySending(false);
        }
    };

    const handleSendCompose = async () => {
        // Validation per channel
        let isValid = !!composeBody;
        if (composeChannel === 'gmail' || composeChannel === 'outlook') {
            isValid = isValid && !!composeTo && !!composeSubject;
        } else {
            // Slack/Teams need a channel/target
            isValid = isValid && !!composeTo;
        }

        if (!isValid) {
            alert('Please fill in all required fields (Recipient/Channel + Message).');
            return;
        }

        setLoading(true);
        console.log(`Sending compose message via ${composeChannel} with ${composeAttachments.length} attachments`);
        try {
            let result: any = null;

            if (composeChannel === 'gmail') {
                // Convert attachments to base64 format
                let emailAttachments: Array<{ filename: string, content: string }> = [];
                if (composeAttachments.length > 0) {
                    console.log('Processing Gmail attachments...');
                    emailAttachments = await Promise.all(
                        composeAttachments.map(async (file) => ({
                            filename: file.name,
                            content: await fileToBase64(file)
                        }))
                    );
                    console.log(`Processed ${emailAttachments.length} Gmail attachments`);
                }

                result = await apiService.executeMCPTool('google_workspace_gmail', {
                    operation: 'send_email',
                    to: composeTo,
                    subject: composeSubject,
                    body: composeBody,
                    cc: composeCc,
                    bcc: composeBcc,
                    attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
                });
            } else if (composeChannel === 'outlook') {
                result = await apiService.executeMCPTool('outlook_email_management', {
                    action: 'send_email',
                    to_email: composeTo,
                    subject: composeSubject,
                    content: composeBody,
                    cc: composeCc,
                    bcc: composeBcc
                });
            } else if (composeChannel === 'slack') {
                // ComposeTo is treated as Channel Name here
                // Maps to slack_team_communication tool

                // For Slack, we need to upload files first or with the message
                // The tool_executor handles attachments for send_message by uploading them

                // Convert attachments to base64 format for Slack
                let slackAttachments: Array<{ filename: string, content: string }> = [];
                if (composeAttachments.length > 0) {
                    console.log('Processing Slack attachments...');
                    slackAttachments = await Promise.all(
                        composeAttachments.map(async (file) => ({
                            filename: file.name,
                            content: await fileToBase64(file)
                        }))
                    );
                    console.log(`Processed ${slackAttachments.length} Slack attachments`);
                }

                result = await apiService.executeMCPTool('slack_team_communication', {
                    action: 'send_message',
                    channel: composeTo.replace('#', ''), // ensure no double #
                    message: composeBody,
                    attachments: slackAttachments.length > 0 ? slackAttachments : undefined,
                });
            } else if (composeChannel === 'teams') {
                // Maps to teams_team_communication tool
                result = await apiService.executeMCPTool('teams_team_communication', {
                    action: 'send_message',
                    channel: composeTo,
                    message: composeBody
                });
            }

            // Check for blocked operation (upgrade required)
            const innerResult = result?.result;
            if (innerResult?.upgrade_required || innerResult?.success === false) {
                toast.error(innerResult?.error || 'This feature requires an upgrade. Please upgrade your plan.');
                return;
            }

            if (result && (result.success || result.status === 'ok' || (innerResult && innerResult.success !== false))) {
                // Optimistic UI update
                setMessages(prev => [{
                    id: Date.now().toString(),
                    source: composeChannel,
                    sender: 'Me',
                    subject: composeSubject || (composeChannel === 'slack' || composeChannel === 'teams' ? `Msg to ${composeTo}` : 'No Subject'),
                    preview: composeBody.substring(0, 50) + '...',
                    fullContent: composeBody,
                    time: 'Just now',
                    read: true,
                    starred: false,
                    avatar: 'https://ui-avatars.com/api/?name=Me&background=000&color=fff'
                }, ...prev]);

                setIsComposeOpen(false);
                setComposeTo('');
                setComposeCc('');
                setComposeBcc('');
                setShowCcBcc(false);
                setComposeSubject('');
                setComposeBody('');
                setComposeAttachments([]);
                // Simple success feedback
                setTimeout(() => toast.success(`Message sent via ${composeChannel}!` + (composeAttachments.length > 0 ? ` (${composeAttachments.length} file${composeAttachments.length > 1 ? 's' : ''} attached)` : '')), 100);
            } else {
                toast.error('Failed to send message: ' + (innerResult?.error || result?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while sending the message.');
        } finally {
            setLoading(false);
        }
    };

    const filteredMessages = messages.filter(msg => {
        const matchTab = activeTab === 'all' || msg.source === activeTab;
        const matchSearch = msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.subject.toLowerCase().includes(searchTerm.toLowerCase());
        return matchTab && matchSearch;
    });

    const getSourceStyle = (source: string) => {
        switch (source) {
            case 'gmail': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'slack': return 'text-purple-600 bg-purple-50 border-purple-100';
            case 'teams': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
            case 'outlook': return 'text-sky-600 bg-sky-50 border-sky-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    }

    return (
        <div className="flex h-screen bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-indigo-50/20 to-slate-50 overflow-hidden font-sans text-slate-900 relative">

            {/* Compose Modal */}
            {isComposeOpen && (
                <div className="absolute inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <h3 className="font-bold text-lg text-gray-800">New Message</h3>
                            <button onClick={() => setIsComposeOpen(false)} className="p-2 hover:bg-gray-200/50 rounded-full text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            {/* Channel Selector */}
                            <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                                <span className="text-gray-400 text-sm font-medium">Via:</span>
                                <div className="flex gap-2">
                                    {(['gmail', 'outlook', 'slack', 'teams'] as const).map(channel => (
                                        <button
                                            key={channel}
                                            onClick={() => setComposeChannel(channel)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${composeChannel === channel
                                                ? (channel === 'gmail' ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-500/20' :
                                                    channel === 'slack' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500/20' :
                                                        channel === 'teams' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/20' :
                                                            'bg-blue-100 text-blue-700 ring-2 ring-blue-500/20')
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            {channel === 'gmail' && <img src={gmailLogo} alt="Gmail" className="w-4 h-4 object-contain" />}
                                            {channel === 'slack' && <img src={slackLogo} alt="Slack" className="w-4 h-4 object-contain" />}
                                            {channel === 'teams' && <img src={teamsLogo} alt="Teams" className="w-4 h-4 object-contain" />}
                                            {channel === 'outlook' && <img src={outlookLogo} alt="Outlook" className="w-4 h-4 object-contain" />}
                                            <span className="capitalize">{channel}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Fields */}
                            <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 transition-colors">
                                <span className="text-gray-400 text-sm font-medium mr-2">
                                    {composeChannel === 'slack' || composeChannel === 'teams' ? 'Channel:' : 'To:'}
                                </span>
                                <input
                                    type="text" value={composeTo} onChange={(e) => setComposeTo(e.target.value)}
                                    placeholder={composeChannel === 'slack' ? '#general or @user' : composeChannel === 'teams' ? 'Channel ID or User' : 'recipient@example.com'}
                                    className="flex-1 text-sm font-medium py-2 focus:outline-none" autoFocus

                                />
                                {(composeChannel === 'gmail' || composeChannel === 'outlook') && (
                                    <button
                                        onClick={() => setShowCcBcc(!showCcBcc)}
                                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                    >
                                        Cc/Bcc
                                    </button>
                                )}
                            </div>

                            {showCcBcc && (composeChannel === 'gmail' || composeChannel === 'outlook') && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 transition-colors">
                                        <span className="text-gray-400 text-sm font-medium mr-2">Cc:</span>
                                        <input
                                            type="text" value={composeCc} onChange={(e) => setComposeCc(e.target.value)}
                                            className="flex-1 text-sm font-medium py-2 focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 transition-colors">
                                        <span className="text-gray-400 text-sm font-medium mr-2">Bcc:</span>
                                        <input
                                            type="text" value={composeBcc} onChange={(e) => setComposeBcc(e.target.value)}
                                            className="flex-1 text-sm font-medium py-2 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {(composeChannel === 'gmail' || composeChannel === 'outlook') && (
                                <input
                                    type="text" placeholder="Subject" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)}
                                    className="w-full text-lg font-bold border-b border-gray-200 py-2 focus:outline-none focus:border-blue-500 placeholder:text-gray-300"
                                />
                            )}
                            <textarea
                                placeholder="Write your message..." value={composeBody} onChange={(e) => setComposeBody(e.target.value)}
                                className="w-full h-48 md:h-64 resize-none focus:outline-none text-slate-700 leading-relaxed placeholder:text-gray-300"
                            />

                            {/* Compose Attachments Preview */}
                            {composeAttachments.length > 0 && (
                                <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/30 mx-[-24px] px-[24px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-medium text-slate-500">
                                            📎 {composeAttachments.length} file{composeAttachments.length > 1 ? 's' : ''} ready to send
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {composeAttachments.map((file, index) => {
                                            const isImage = file.type.startsWith('image/');
                                            return (
                                                <div
                                                    key={index}
                                                    className="group relative flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                                                >
                                                    {isImage ? (
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                alt={file.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                                                            <Paperclip className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col min-w-0 pr-6">
                                                        <span className="text-xs font-medium text-slate-700 truncate max-w-[100px] md:max-w-[150px]">
                                                            {file.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {formatFileSize(file.size)}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeComposeAttachment(index)}
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
                            <div className="flex gap-2 text-gray-400">
                                <input
                                    type="file"
                                    ref={composeFileInputRef}
                                    onChange={handleComposeFileSelect}
                                    multiple
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                />
                                <button
                                    type="button"
                                    onClick={() => composeFileInputRef.current?.click()}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-indigo-600"
                                    title="Attach file"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-indigo-600">
                                    <Tag className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                onClick={handleSendCompose}
                                disabled={loading}
                                className="relative isolate overflow-hidden rounded-xl px-8 py-3 font-semibold text-white transition-all duration-300
                                bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700
                                before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-100
                                after:absolute after:inset-0 after:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]
                                shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
                                flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? 'Sending...' : (
                                        <>
                                            Send Message <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Menu Backdrop */}
            {mobileMenuOpen && (
                <div className="absolute inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* 1. Sidebar (Navigation) */}
            <div className={`
                absolute md:relative inset-y-0 left-0 z-40 bg-white/70 backdrop-blur-2xl border-r border-indigo-50/50 flex flex-col transition-all duration-300 shadow-2xl md:shadow-none
                ${sidebarCollapsed ? 'w-20' : 'w-64'}
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="h-16 flex items-center px-4 justify-between border-b border-transparent">
                    {/* Header Removed */}
                    <button
                        onClick={() => window.innerWidth < 768 ? setMobileMenuOpen(false) : setSidebarCollapsed(!sidebarCollapsed)}
                        className={`p-2 hover:bg-white/80 rounded-xl text-slate-400 hover:text-indigo-600 transition-all duration-200 border border-transparent hover:border-slate-100/50 hover:shadow-sm ${sidebarCollapsed ? 'mx-auto' : ''}`}
                    >
                        {window.innerWidth < 768 ? <X className="w-5 h-5" /> : sidebarCollapsed ? <Menu className="w-5 h-5" /> : <div className="p-0.5"><Menu className="w-4 h-4" /></div>}
                    </button>
                </div>

                <div className="px-3 flex-1 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
                    {/* Compose Button */}
                    <button
                        onClick={() => { setIsComposeOpen(true); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center group relative overflow-hidden transition-all duration-300 mb-8
                        ${sidebarCollapsed
                                ? 'justify-center h-12 w-12 rounded-2xl mx-auto bg-indigo-600 shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95'
                                : 'px-4 py-3.5 rounded-2xl bg-white shadow-[0_2px_10px_rgba(99,102,241,0.15)] hover:shadow-[0_4px_15px_rgba(99,102,241,0.25)] border border-indigo-50 text-indigo-600 hover:border-indigo-100 hover:-translate-y-0.5'
                            }`}
                    >
                        {sidebarCollapsed ? (
                            <PenSquare className="w-5 h-5 text-white" />
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                    <PenSquare className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="ml-3 font-bold text-[15px] tracking-wide">Compose</span>
                            </>
                        )}
                    </button>

                    {/* Navigation Items */}
                    <div className="space-y-1.5">
                        {tabs.map(tab => {
                            const Icon = (tab as any).icon;
                            // Update icon color logic for active state
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id as any); setMobileMenuOpen(false); }}
                                    className={`w-full flex items-center transition-all duration-200 group
                                    ${sidebarCollapsed ? 'justify-center px-0 h-10 w-10 mx-auto rounded-xl' : 'px-3 py-2.5 justify-between rounded-xl'}
                                    ${isActive
                                            ? 'bg-white shadow-sm ring-1 ring-slate-100 z-10'
                                            : 'hover:bg-white/60 hover:ring-1 hover:ring-slate-100/50 text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                                            ${isActive ? 'bg-indigo-50 scale-100' : 'bg-transparent group-hover:bg-slate-50 scale-95 group-hover:scale-100'}
                                        `}>
                                            {(tab as any).logo ? (
                                                <img src={(tab as any).logo} alt={tab.label} className={`w-4 h-4 object-contain transition-all ${!isActive && 'opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0'}`} />
                                            ) : (
                                                Icon && <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                            )}
                                        </div>

                                        {!sidebarCollapsed && (
                                            <span className={`ml-3 text-[14px] ${isActive ? 'font-bold text-slate-800' : 'font-medium text-slate-500 group-hover:text-slate-700'}`}>
                                                {tab.label}
                                            </span>
                                        )}
                                    </div>

                                    {!sidebarCollapsed && (stats as any)[tab.id] > 0 && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors
                                            ${isActive
                                                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                                : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                                            }
                                        `}>
                                            {(stats as any)[tab.id]}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 2. Message List */}
            <div className={`
                flex flex-col border-r border-white/40 bg-white/30 backdrop-blur-xl transition-all
                ${selectedMessage ? 'hidden md:flex' : 'flex w-full'} 
                md:w-[450px] relative z-0
            `}>
                {/* Modern Glass Header */}
                <div className="h-16 px-4 flex items-center justify-between border-b border-indigo-50/50 bg-white/80 backdrop-blur-xl sticky top-0 z-20 transition-all duration-300">
                    <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex-1 relative group max-w-sm mx-auto md:mx-0 md:max-w-none md:w-full">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search inbox..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100/60 border-none hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:shadow-sm rounded-xl text-sm font-medium transition-all duration-200 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {loading && filteredMessages.length === 0 ? (
                        <div className="space-y-2 mt-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-4 p-4 mx-1 rounded-xl bg-white shimmer-effect">
                                    <div className="w-10 h-10 rounded-full bg-slate-200/50 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200/50 rounded w-1/3" />
                                        <div className="h-3 bg-slate-200/50 rounded w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                                <Inbox className="w-8 h-8" />
                            </div>
                            <p className="font-semibold text-slate-600">All caught up!</p>
                            <p className="text-sm text-slate-400 mt-1">No messages found</p>
                        </div>
                    ) : (
                        <div className="space-y-1 pb-20 md:pb-2">
                            {/* AI Analysis Indicator */}
                            {analyzingMessages && (
                                <div className="flex items-center gap-2 px-4 py-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg mx-2 mb-2">
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                    <span>AI analyzing messages...</span>
                                </div>
                            )}

                            {filteredMessages
                                .filter(msg => !snoozedMessages.has(msg.id))
                                .map(msg => {
                                    // Resolve Source Logo
                                    const sourceLogo =
                                        msg.source === 'gmail' ? gmailLogo :
                                            msg.source === 'slack' ? slackLogo :
                                                msg.source === 'teams' ? teamsLogo :
                                                    msg.source === 'outlook' ? outlookLogo : undefined;

                                    // Get AI enrichment data
                                    const enrichment = enrichments[msg.id];

                                    return (
                                        <div
                                            key={msg.id}
                                            onClick={() => handleSelectMessage(msg)}
                                            className={`group relative p-3 mx-1 rounded-xl cursor-pointer transition-all duration-200 ease-out border border-transparent
                                        ${selectedMessage?.id === msg.id
                                                    ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]'
                                                    : !msg.read
                                                        ? 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5'
                                                        : 'hover:bg-slate-50/80 hover:border-slate-200/50'
                                                }`}
                                        >
                                            {/* Selection Indicator */}
                                            {selectedMessage?.id === msg.id && (
                                                <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full" />
                                            )}

                                            {/* Unread Dot */}
                                            {!msg.read && selectedMessage?.id !== msg.id && (
                                                <div className="absolute left-2 top-4 w-2 h-2 bg-indigo-500 rounded-full ring-4 ring-white shadow-sm z-10" />
                                            )}

                                            <div className="flex gap-3 relative pl-3">
                                                {/* Avatar Area */}
                                                <div className="relative shrink-0 mt-1">
                                                    {msg.avatar ? (
                                                        <img src={msg.avatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm bg-slate-100" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm ring-2 ring-white">
                                                            {msg.sender[0]}
                                                        </div>
                                                    )}
                                                    {/* App Icon Badge */}
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-50">
                                                        <img src={sourceLogo} alt={msg.source} className="w-3.5 h-3.5 object-contain" />
                                                    </div>
                                                </div>

                                                {/* Content Area */}
                                                <div className="flex-1 min-w-0 pr-1">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <h3 className={`text-[15px] truncate max-w-[140px] leading-tight ${!msg.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                                {msg.sender}
                                                            </h3>
                                                            {/* Priority Badge */}
                                                            {enrichment && <PriorityBadge level={enrichment.priority} />}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-[11px] font-medium whitespace-nowrap ${!msg.read ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                                {msg.time}
                                                            </span>
                                                            {/* Snooze Button */}
                                                            <div className="relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSnoozeDropdownOpen(snoozeDropdownOpen === msg.id ? null : msg.id);
                                                                    }}
                                                                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all"
                                                                    title="Snooze"
                                                                >
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                </button>

                                                                {/* Snooze Dropdown */}
                                                                {snoozeDropdownOpen === msg.id && (
                                                                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[140px]">
                                                                        {[
                                                                            { id: '1h', label: '1 hour' },
                                                                            { id: '4h', label: '4 hours' },
                                                                            { id: 'tomorrow', label: 'Tomorrow' },
                                                                            { id: 'nextweek', label: 'Next week' }
                                                                        ].map(opt => (
                                                                            <button
                                                                                key={opt.id}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleSnooze(msg.id, opt.id);
                                                                                }}
                                                                                className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 text-slate-700"
                                                                            >
                                                                                {opt.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p className={`text-[13px] leading-snug truncate mb-0.5 ${!msg.read ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                                                        {msg.subject}
                                                    </p>

                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[12px] text-slate-400 line-clamp-1 leading-relaxed flex-1">
                                                            {msg.preview}
                                                        </p>
                                                        {/* Smart Labels */}
                                                        {enrichment?.labels && enrichment.labels.length > 0 && (
                                                            <div className="flex gap-1 shrink-0">
                                                                {enrichment.labels.slice(0, 2).map((label, idx) => (
                                                                    <SmartLabel key={idx} label={label} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Reading Pane (Detail) */}
            <div className={`
                flex-1 bg-white flex-col h-full overflow-hidden relative z-20 
                ${selectedMessage ? 'flex fixed inset-0 md:static' : 'hidden md:flex'}
            `}>
                {selectedMessage ? (
                    <>
                        <div className="h-20 px-4 md:px-10 border-b border-white/50 flex items-center justify-between bg-white/60 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSelectedMessage(null)} className="md:hidden p-2 mr-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-xl transition-all">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="flex items-center bg-white/50 p-1 rounded-xl border border-white/60 shadow-sm">
                                    <button onClick={() => handleArchive(selectedMessage.id)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-all" title="Archive"><Archive className="w-5 h-5" /></button>
                                    <button onClick={() => handleStar(selectedMessage.id)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-white rounded-lg transition-all" title="Star"><Star className={`w-5 h-5 ${selectedMessage.starred ? 'fill-amber-500 text-amber-500' : ''}`} /></button>
                                    <button onClick={() => handleDelete(selectedMessage.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all" title="Delete"><Trash className="w-5 h-5" /></button>
                                </div>
                                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />
                                <button
                                    onClick={() => {
                                        replyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        setTimeout(() => replyInputRef.current?.focus(), 300);
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 hover:shadow-sm transition-all"
                                ><Reply className="w-5 h-5" /></button>
                            </div>
                            <button onClick={() => setSelectedMessage(null)} className="hidden md:block p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                            <div className="max-w-3xl mx-auto">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
                                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{selectedMessage.subject}</h1>
                                    <span className={`self-start px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getSourceStyle(selectedMessage.source)}`}>{selectedMessage.source}</span>
                                </div>
                                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                                    <img src={selectedMessage.avatar} alt="" className="w-12 h-12 rounded-xl shadow-sm object-cover" />
                                    <div>
                                        <div className="font-bold text-slate-900 text-lg">{selectedMessage.sender}</div>
                                        <div className="text-sm text-slate-400 font-medium">To: Me • {selectedMessage.time}</div>
                                    </div>
                                </div>

                                {messageLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        <span className="ml-3 text-slate-500 font-medium">Loading full message...</span>
                                    </div>
                                ) : (
                                    <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {/* Dangerous HTML rendering if source is trusted (Gmail), otherwise text */}
                                        {['gmail', 'outlook', 'teams'].includes(selectedMessage.source) ? (
                                            <div dangerouslySetInnerHTML={{ __html: selectedMessage.fullContent || selectedMessage.preview }} />
                                        ) : (
                                            selectedMessage.fullContent || selectedMessage.preview
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modern Reply Input Section */}
                        <div className="p-3 md:p-5 bg-gradient-to-t from-slate-100 via-slate-50 to-white border-t border-slate-200/60 sticky bottom-0">
                            <div className="max-w-3xl mx-auto">
                                {/* Reply Context Badge */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${selectedMessage.source === 'gmail' ? 'bg-red-50 text-red-600' :
                                        selectedMessage.source === 'slack' ? 'bg-purple-50 text-purple-600' :
                                            selectedMessage.source === 'outlook' ? 'bg-blue-50 text-blue-600' :
                                                'bg-green-50 text-green-600'
                                        }`}>
                                        <Reply className="w-3 h-3" />
                                        Replying to {selectedMessage.source === 'slack' ? selectedMessage.subject : selectedMessage.sender}
                                    </div>
                                </div>

                                {/* Phase 3: Quick Reply Suggestions */}
                                {enrichments[selectedMessage.id]?.quick_replies && enrichments[selectedMessage.id].quick_replies!.length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                            <Sparkles className="w-3 h-3 text-indigo-500" />
                                            <span>Quick replies</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {enrichments[selectedMessage.id].quick_replies!.map((reply, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setReplyText(reply)}
                                                    className="px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors"
                                                >
                                                    {reply}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Input Card */}
                                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/80 overflow-hidden transition-all duration-200 focus-within:shadow-xl focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
                                    {/* Textarea */}
                                    <textarea
                                        ref={replyInputRef}
                                        placeholder="Write your reply..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="w-full px-4 pt-4 pb-2 min-h-[80px] md:min-h-[100px] resize-none border-none focus:ring-0 text-sm md:text-base text-slate-700 placeholder:text-slate-400 bg-transparent leading-relaxed"
                                        disabled={replySending}
                                        rows={3}
                                    />

                                    {/* Attachments Preview */}
                                    {attachments.length > 0 && (
                                        <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-medium text-slate-500">
                                                    📎 {attachments.length} file{attachments.length > 1 ? 's' : ''} ready to send
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {attachments.map((file, index) => {
                                                    const isImage = file.type.startsWith('image/');
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="group relative flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                                                        >
                                                            {/* Image thumbnail or file icon */}
                                                            {isImage ? (
                                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                                                    <img
                                                                        src={URL.createObjectURL(file)}
                                                                        alt={file.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                                                                    <Paperclip className="w-4 h-4 text-indigo-600" />
                                                                </div>
                                                            )}

                                                            {/* File info */}
                                                            <div className="flex flex-col min-w-0 pr-6">
                                                                <span className="text-xs font-medium text-slate-700 truncate max-w-[100px] md:max-w-[150px]">
                                                                    {file.name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {formatFileSize(file.size)}
                                                                </span>
                                                            </div>

                                                            {/* Remove button */}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAttachment(index)}
                                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Bar */}
                                    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50/50 border-t border-slate-100">
                                        {/* Left Actions */}
                                        <div className="flex items-center gap-1">
                                            {/* Hidden file input */}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                multiple
                                                className="hidden"
                                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150"
                                                title="Attach file"
                                            >
                                                <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                            <div className="hidden sm:block h-4 w-px bg-slate-200 mx-1" />
                                            <span className="hidden sm:flex items-center text-xs text-slate-400 px-2">
                                                Press <kbd className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono border border-slate-200">⌘</kbd> + <kbd className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono border border-slate-200">↵</kbd> to send
                                            </span>
                                        </div>

                                        {/* Right Actions */}
                                        <div className="flex items-center gap-2">
                                            {/* Character count */}
                                            {replyText.length > 0 && (
                                                <span className="hidden sm:inline text-xs text-slate-400">
                                                    {replyText.length} chars
                                                </span>
                                            )}

                                            {/* Send Button */}
                                            <button
                                                onClick={handleSendReply}
                                                disabled={replySending || !replyText.trim()}
                                                className={`
                                                    group relative inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-sm font-semibold
                                                    transition-all duration-200 transform
                                                    ${replyText.trim() && !replySending
                                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98]'
                                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    }
                                                `}
                                            >
                                                {replySending ? (
                                                    <>
                                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span className="hidden sm:inline">Sending...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="hidden sm:inline">Send</span>
                                                        <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-50/50">
                        <Inbox className="w-16 h-16 text-slate-200 mb-4" />
                        <p className="text-slate-500 font-medium">Select a message to view</p>
                    </div>
                )}
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
            `}</style>
        </div >
    );
};

export default UnifiedInbox;
