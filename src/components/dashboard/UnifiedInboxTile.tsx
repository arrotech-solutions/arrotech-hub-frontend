import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, MessageCircle, RefreshCw, Star, Trash, ArrowRight, Loader2, PenSquare } from 'lucide-react';
import apiService from '../../services/api';
import { OutlookLogo } from '../BrandIcons';

interface Message {
    id: string;
    source: 'gmail' | 'slack' | 'teams' | 'outlook';
    sender: string;
    subject: string;
    preview: string;
    time: string;
    read: boolean;
    starred: boolean;
}

interface UnifiedInboxTileProps {
    onCompose: () => void;
}

const UnifiedInboxTile: React.FC<UnifiedInboxTileProps> = ({ onCompose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

    const fetchMessages = async () => {
        setLoading(true);
        try {
            // Execute requests in parallel
            const [gmailRes, slackRes, teamsRes, outlookRes] = await Promise.all([
                apiService.executeMCPTool('google_workspace_gmail', { operation: 'read_emails', max_results: 10 }),
                apiService.executeMCPTool('slack_search', { action: 'get_channel_history', channel: 'general', limit: 10 }),
                apiService.executeMCPTool('teams_message_search', { action: 'get_recent_chats', limit: 10 }), // Assuming this action exists/works
                apiService.executeMCPTool('outlook_email_management', { action: 'read_emails', limit: 10 })
            ]);

            let allMessages: Message[] = [];

            // Gmail
            if (gmailRes.success && (gmailRes.data?.emails || gmailRes.result?.emails)) {
                const raw = gmailRes.data?.emails || gmailRes.result?.emails;
                allMessages.push(...raw.map((e: any) => ({
                    id: e.id, source: 'gmail',
                    sender: e.from || 'Unknown', subject: e.subject || 'No Subject',
                    preview: e.snippet || '',
                    time: new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: !e.label_ids?.includes('UNREAD'), starred: e.label_ids?.includes('STARRED')
                })));
            }

            // Slack
            const slackData = slackRes.result?.data || slackRes.data?.data || slackRes.result || slackRes.data;
            if (slackRes.success && slackData?.messages) {
                allMessages.push(...slackData.messages.map((m: any) => ({
                    id: m.timestamp, source: 'slack',
                    sender: m.user || 'Unknown', subject: '#general',
                    preview: m.text || '',
                    time: new Date(parseFloat(m.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: true, starred: false
                })));
            }

            // Teams
            const teamsData = teamsRes.result?.data || teamsRes.data?.data || teamsRes.result || teamsRes.data;
            if (teamsRes.success && teamsData?.messages) {
                allMessages.push(...teamsData.messages.map((m: any) => ({
                    id: m.id, source: 'teams',
                    sender: m.from || 'Unknown', subject: m.subject || 'Chat',
                    preview: m.preview || '',
                    time: m.created_date ? new Date(m.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
                    read: !m.is_read, starred: false
                })));
            }

            // Outlook
            if (outlookRes.success && (outlookRes.data?.messages || outlookRes.result?.messages)) {
                const rawOutlook = outlookRes.data?.messages || outlookRes.result?.messages;
                allMessages.push(...rawOutlook.map((e: any) => ({
                    id: e.id, source: 'outlook',
                    sender: e.from || 'Unknown', subject: e.subject || 'No Subject',
                    preview: e.preview || '',
                    time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: e.is_read, starred: false
                })));
            }

            // Mock Data Fallback if API fails or returns empty (for demo purposes if keys aren't set)
            if (allMessages.length === 0) {
                allMessages = [
                    { id: '1', source: 'gmail', sender: 'Sarah Connor', subject: 'Re: Q1 Goals', preview: 'Please review the attached...', time: '5m', read: false, starred: true },
                    { id: '2', source: 'slack', sender: '#dev-team', subject: 'API Deployment', preview: 'Deployment successful!', time: '12m', read: false, starred: false },
                    { id: '3', source: 'teams', sender: 'Alex Chen', subject: 'Sync Check', preview: 'Are we still on for 2pm?', time: '1h', read: true, starred: false },
                ];
            }

            setMessages(allMessages.sort((a, b) => b.time.localeCompare(a.time))); // Simple sort

        } catch (err) {
            console.error("Failed to fetch messages", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const getIcon = (source: string) => {
        switch (source) {
            case 'gmail': return <Mail className="w-4 h-4 text-red-500" />;
            case 'slack': return <MessageCircle className="w-4 h-4 text-purple-500" />;
            case 'teams': return <MessageSquare className="w-4 h-4 text-indigo-500" />;
            case 'outlook': return <OutlookLogo className="w-4 h-4" />;
            default: return <Mail className="w-4 h-4 text-gray-500" />;
        }
    };

    const filteredMessages = activeFilter === 'all' ? messages : messages.filter((m: Message) => !m.read);

    return (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl flex flex-col h-full overflow-hidden group transition-all hover:shadow-2xl relative">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/20 flex items-center justify-between z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Inbox
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${activeFilter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-white/50'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveFilter('unread')}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${activeFilter === 'unread' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-white/50'}`}
                        >
                            Unread
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onCompose} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg hover:shadow-indigo-200 transition-all" title="Compose">
                        <PenSquare className="w-5 h-5" />
                    </button>
                    <div
                        onClick={fetchMessages}
                        className="p-2 bg-white/50 rounded-xl hover:bg-white transition-colors cursor-pointer text-gray-500 hover:text-indigo-600"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative z-0">
                {filteredMessages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Mail className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm font-medium">No messages found</span>
                    </div>
                )}

                {filteredMessages.map((msg: Message) => (
                    <div key={msg.id} className="group/item relative bg-white/40 hover:bg-white/70 border border-white/40 hover:border-indigo-100 rounded-2xl p-4 transition-all cursor-pointer transform hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                    {getIcon(msg.source)}
                                </div>
                                <span className={`text-sm font-bold ${!msg.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                    {msg.sender}
                                </span>
                            </div>
                            <span className="text-xs font-medium text-gray-400">{msg.time}</span>
                        </div>

                        <h3 className={`text-sm mb-1 line-clamp-1 ${!msg.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {msg.subject}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1 group-hover/item:text-gray-600">
                            {msg.preview}
                        </p>

                        {/* Hover Actions */}
                        <div className="absolute right-4 bottom-4 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity transform translate-x-2 group-hover/item:translate-x-0">
                            <div className="p-1.5 bg-white rounded-lg text-gray-400 hover:text-yellow-500 shadow-sm hover:shadow">
                                <Star className="w-3.5 h-3.5" />
                            </div>
                            <div className="p-1.5 bg-white rounded-lg text-gray-400 hover:text-red-500 shadow-sm hover:shadow">
                                <Trash className="w-3.5 h-3.5" />
                            </div>
                            <div className="p-1.5 bg-indigo-500 rounded-lg text-white shadow-sm hover:bg-indigo-600">
                                <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        {/* Unread Indicator */}
                        {!msg.read && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50" />
                        )}
                    </div>
                ))}
            </div>
            <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(0,0,0,0.1);
                border-radius: 4px;
            }
            `}</style>
        </div>
    );
};

export default UnifiedInboxTile;
