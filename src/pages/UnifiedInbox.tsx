import React, { useState, useEffect } from 'react';
import {
    Mail, MessageCircle, MessageSquare, Search, Inbox,
    Star, Trash, PenSquare, Paperclip, Reply, Archive, X, Send, Tag,
    Menu, ArrowLeft
} from 'lucide-react';
import apiService from '../services/api';
import { OutlookLogo } from '../components/BrandIcons';
import toast from 'react-hot-toast';

interface Message {
    id: string;
    source: 'gmail' | 'slack' | 'teams' | 'outlook';
    sender: string;
    subject: string;
    preview: string;
    fullContent?: string;
    time: string;
    read: boolean;
    starred: boolean;
    avatar?: string;
    labels?: string[];
}

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

    // Compose/Reply State
    const [composeChannel, setComposeChannel] = useState<'gmail' | 'slack' | 'teams' | 'outlook'>('gmail');
    const [replyText, setReplyText] = useState('');
    const [composeTo, setComposeTo] = useState('');
    const [composeCc, setComposeCc] = useState('');
    const [composeBcc, setComposeBcc] = useState('');
    const [showCcBcc, setShowCcBcc] = useState(false);
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');

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
        { id: 'gmail', label: 'Gmail', icon: Mail, color: 'text-rose-500', bg: 'bg-rose-50' },
        { id: 'slack', label: 'Slack', icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-50' },
        { id: 'teams', label: 'Teams', icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'outlook', label: 'Outlook', icon: OutlookLogo, color: 'text-blue-500', bg: 'bg-blue-50' },
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
                    const val = res.value;
                    // Attempt to find the data payload: could be .data, .result, or nested
                    if (val.data) return val.data;
                    if (val.result) return val.result;
                    return val;
                }
                return null;
            };

            const gmailRaw = unwrap(gmailRes);
            const gmailEmails = gmailRaw?.emails || gmailRaw?.data?.emails || gmailRaw?.result?.emails;
            if (gmailEmails) {
                allMessages.push(...gmailEmails.map((e: any) => ({
                    id: e.id, source: 'gmail' as const,
                    sender: e.from?.replace(/<.*>/, '').trim() || 'Unknown',
                    subject: e.subject || 'No Subject',
                    preview: e.snippet || '',
                    fullContent: e.snippet ? e.snippet.repeat(5) : 'No content available.',
                    time: new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: !e.label_ids?.includes('UNREAD'),
                    starred: e.label_ids?.includes('STARRED'),
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(e.from || 'U')}&background=random`
                })));
            }

            const slackRaw = unwrap(slackRes);
            console.log('Slack Raw Response:', slackRaw, 'Full Res:', slackRes);
            // Handle various levels of nesting for Slack
            const slackMessages = slackRaw?.messages || slackRaw?.data?.messages || slackRaw?.result?.messages || slackRaw?.data;
            if (slackMessages && Array.isArray(slackMessages)) {
                allMessages.push(...slackMessages.map((m: any) => {
                    const ts = m.timestamp || m.ts;
                    console.log('Slack Message:', m, 'TS:', ts); // Debug
                    return {
                        id: ts || Math.random().toString(),
                        source: 'slack' as const,
                        sender: m.user || 'Slack User',
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
            setMessages(allMessages.sort((a, b) => b.time.localeCompare(a.time)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    // --- Actions ---
    const handleArchive = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
    };

    const handleStar = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMessages(prev => prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
        if (selectedMessage?.id === id) setSelectedMessage(prev => prev ? { ...prev, starred: !prev.starred } : null);
    };

    const handleSelectMessage = (msg: Message) => {
        if (!msg.read) setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
        setSelectedMessage({ ...msg, read: true });
        // On mobile, this will trigger the view change via CSS classes
    };

    const handleSendReply = () => {
        if (!replyText.trim()) return;
        setReplyText('');
        alert('Reply sent! (Mock implementation)');
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
        try {
            let result: any = null;

            if (composeChannel === 'gmail') {
                result = await apiService.executeMCPTool('google_workspace_gmail', {
                    operation: 'send_email',
                    to: composeTo,
                    subject: composeSubject,
                    body: composeBody,
                    cc: composeCc,
                    bcc: composeBcc
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
                result = await apiService.executeMCPTool('slack_team_communication', {
                    action: 'send_message',
                    channel: composeTo.replace('#', ''), // ensure no double #
                    message: composeBody
                });
            } else if (composeChannel === 'teams') {
                // Maps to teams_team_communication tool
                result = await apiService.executeMCPTool('teams_team_communication', {
                    action: 'send_message',
                    channel: composeTo,
                    message: composeBody
                });
            }

            if (result && (result.success || result.status === 'ok')) {
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
                // Simple success feedback
                setTimeout(() => toast.success(`Message sent via ${composeChannel}!`), 100);
            } else {
                alert('Failed to send message: ' + (result?.error || JSON.stringify(result) || 'Unknown error'));
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
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-gray-900 relative">

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
                                            {channel === 'gmail' && <Mail className="w-4 h-4" />}
                                            {channel === 'slack' && <MessageCircle className="w-4 h-4" />}
                                            {channel === 'teams' && <MessageSquare className="w-4 h-4" />}
                                            {channel === 'outlook' && <OutlookLogo className="w-4 h-4" />}
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
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
                            <div className="flex gap-2 text-gray-400">
                                <Paperclip className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                                <Tag className="w-5 h-5 cursor-pointer hover:text-gray-600" />
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
                absolute md:relative inset-y-0 left-0 z-40 bg-white border-r border-slate-200/60 flex flex-col transition-all duration-300 shadow-xl md:shadow-sm
                ${sidebarCollapsed ? 'w-20' : 'w-64'}
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="h-16 flex items-center px-4 justify-between border-b border-transparent">
                    {(!sidebarCollapsed || mobileMenuOpen) && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">H</div>
                            <span className="font-bold text-lg tracking-tight text-slate-900">Hub</span>
                        </div>
                    )}
                    <button onClick={() => window.innerWidth < 768 ? setMobileMenuOpen(false) : setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        {window.innerWidth < 768 ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                <div className="px-3 flex-1 space-y-1 mt-4 overflow-y-auto">
                    <button
                        onClick={() => { setIsComposeOpen(true); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center h-14 w-14 rounded-full' : 'px-6 py-4 rounded-xl'} mb-8 
                        relative isolate overflow-hidden font-semibold text-white transition-all duration-300
                        bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700
                        before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-100
                        after:absolute after:inset-0 after:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]
                        shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
                        group`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-sm z-0" />
                        <PenSquare className="w-5 h-5 flex-shrink-0 relative z-10" />
                        {!sidebarCollapsed && <span className="ml-3 font-bold text-lg tracking-wide relative z-10">Compose</span>}
                    </button>

                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setMobileMenuOpen(false); }}
                            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-3 justify-between'} py-2.5 rounded-xl transition-all duration-200 group relative ${activeTab === tab.id ? tab.bg + ' ' + tab.color + ' font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <div className="flex items-center">
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                                {!sidebarCollapsed && <span className="ml-3">{tab.label}</span>}
                            </div>
                            {!sidebarCollapsed && (stats as any)[tab.id] > 0 && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/50' : 'bg-slate-100 text-slate-500'}`}>
                                    {(stats as any)[tab.id]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Message List */}
            <div className={`
                flex flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-md transition-all
                ${selectedMessage ? 'hidden md:flex' : 'flex w-full'} 
                md:w-[420px]
            `}>
                <div className="h-16 px-4 flex items-center gap-2 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <button className="md:hidden p-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading && filteredMessages.length === 0 ? (
                        <div className="p-3 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white animate-pulse">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="w-5 h-5 rounded-full bg-slate-200" />
                                            <div className="h-4 bg-slate-200 rounded w-1/3" />
                                        </div>
                                        <div className="h-3 bg-slate-200 rounded w-10" />
                                    </div>
                                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-slate-200 rounded w-full mb-1" />
                                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                                </div>
                            ))}
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 px-6 text-center">
                            <Inbox className="w-12 h-12 mb-4 text-slate-200" />
                            <p className="font-medium text-slate-600">All caught up!</p>
                        </div>
                    ) : (
                        <div className="p-3 space-y-2">
                            {filteredMessages.map(msg => (
                                <div
                                    key={msg.id}
                                    onClick={() => handleSelectMessage(msg)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedMessage?.id === msg.id ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-500/10' : !msg.read ? 'bg-white border-gray-200 shadow-sm hover:shadow-md' : 'bg-transparent border-transparent hover:bg-white/60 hover:border-gray-100'}`}
                                >
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex items-center gap-2">
                                            {msg.avatar && <img src={msg.avatar} alt="" className="w-5 h-5 rounded-full" />}
                                            <h3 className={`text-sm truncate max-w-[140px] ${!msg.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{msg.sender}</h3>
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{msg.time}</span>
                                    </div>
                                    <p className={`text-sm mb-1.5 truncate ${!msg.read ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>{msg.subject}</p>
                                    <p className="text-xs text-slate-400 line-clamp-2">{msg.preview}</p>
                                    <div className="flex items-center gap-2 mt-3 opacity-80">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wider ${getSourceStyle(msg.source)}`}>{msg.source}</span>
                                        {msg.starred && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                                    </div>
                                </div>
                            ))}
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
                        <div className="h-16 px-4 md:px-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                            <div className="flex items-center gap-1">
                                <button onClick={() => setSelectedMessage(null)} className="md:hidden p-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleArchive(selectedMessage.id)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg"><Archive className="w-5 h-5" /></button>
                                <button onClick={() => handleStar(selectedMessage.id)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-50 rounded-lg"><Star className={`w-5 h-5 ${selectedMessage.starred ? 'fill-amber-500 text-amber-500' : ''}`} /></button>
                                <button onClick={() => handleDelete(selectedMessage.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 rounded-lg"><Trash className="w-5 h-5" /></button>
                                <div className="h-4 w-px bg-slate-200 mx-2 hidden md:block" />
                                <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg"><Reply className="w-5 h-5" /></button>
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
                                <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedMessage.fullContent || selectedMessage.preview}</div>
                            </div>
                        </div>

                        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200/60 sticky bottom-0">
                            <div className="max-w-3xl mx-auto flex gap-4">
                                <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:border-blue-400 overflow-hidden relative">
                                    <textarea
                                        placeholder="Reply..."
                                        value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                        className="w-full p-4 h-20 resize-none border-none focus:ring-0 text-sm"
                                    />
                                    <div className="flex justify-end px-2 pb-2">
                                        <button onClick={handleSendReply} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                                            Send <Send className="w-3.5 h-3.5" />
                                        </button>
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
        </div>
    );
};

export default UnifiedInbox;
