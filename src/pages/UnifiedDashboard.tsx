import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import CommandPalette from '../components/dashboard/CommandPalette';
import apiService from '../services/api';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, CheckSquare, Calendar, ArrowRight, Mail, Video, Sparkles } from 'lucide-react';
import EnhancedBriefing from '../components/dashboard/EnhancedBriefing';
import { ClickUpLogo, TrelloLogo, JiraLogo, AsanaLogo, OutlookLogo } from '../components/BrandIcons';

interface DashboardItem {
    id: string;
    title: string;
    subtitle?: string;
    time?: string;
    icon?: any;
    platform?: 'clickup' | 'jira' | 'trello' | 'asana' | 'gmail' | 'slack' | 'outlook' | 'teams' | 'google';
}

const UnifiedDashboard: React.FC = () => {
    const { user } = useAuth();
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [showBriefing, setShowBriefing] = useState(false);

    const [data, setData] = useState<{
        messages: DashboardItem[],
        tasks: DashboardItem[],
        events: DashboardItem[]
    }>({
        messages: [],
        tasks: [],
        events: []
    });
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Get Connections to know what to fetch
                const connectionsRes = await apiService.getConnections();
                const activePlatforms = connectionsRes.data?.map((c: any) => c.platform) || [];

                const promises = [];

                // --- INBOX FETCHING ---
                if (activePlatforms.includes('google_workspace')) {
                    promises.push(apiService.executeMCPTool('google_workspace_gmail', { operation: 'read_emails', max_results: 5 }).then(res => ({ type: 'gmail', res })));
                }
                if (activePlatforms.includes('slack')) {
                    promises.push(apiService.executeMCPTool('slack_search', { action: 'get_channel_history', channel: 'general', limit: 5 }).then(res => ({ type: 'slack', res })));
                }
                if (activePlatforms.includes('outlook')) {
                    promises.push(apiService.executeMCPTool('outlook_email_management', { action: 'read_emails', limit: 5 }).then(res => ({ type: 'outlook', res })));
                }
                if (activePlatforms.includes('teams')) {
                    promises.push(apiService.executeMCPTool('teams_message_search', { action: 'get_recent_chats', limit: 5 }).then(res => ({ type: 'teams', res })));
                }

                // --- TASKS FETCHING ---
                if (activePlatforms.includes('clickup')) {
                    promises.push((async () => {
                        try {
                            const teamsRes = await apiService.executeMCPTool('clickup_task_management', { operation: 'get_teams' });
                            const teams = teamsRes.data?.teams || teamsRes.result?.teams || [];
                            if (teams.length > 0) {
                                return { type: 'clickup', res: await apiService.executeMCPTool('clickup_task_management', { operation: 'get_team_tasks', team_id: teams[0].id, include_closed: false }) };
                            }
                        } catch (e) { return { type: 'clickup', error: e }; }
                        return { type: 'clickup', res: null };
                    })());
                }
                if (activePlatforms.includes('jira')) {
                    promises.push(apiService.executeMCPTool('jira_issue_tracking', { action: 'search_issues', jql: 'statusCategory = "In Progress" order by updated DESC' }).then(res => ({ type: 'jira', res })));
                }
                if (activePlatforms.includes('trello')) {
                    promises.push(apiService.executeMCPTool('trello_project_management', { action: 'search_cards', query: 'is:open' }).then(res => ({ type: 'trello', res })));
                }
                if (activePlatforms.includes('asana')) {
                    promises.push(apiService.executeMCPTool('asana_task_management', {
                        operation: 'list',
                        limit: 20,
                        opt_fields: ['name', 'completed']
                    }).then(res => ({ type: 'asana', res })));
                }

                // --- CALENDAR FETCHING ---
                if (activePlatforms.includes('google_calendar') || activePlatforms.includes('google_workspace')) {
                    const now = new Date();
                    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
                    const nextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

                    console.log('[UnifiedDashboard] Fetching calendar events:', { time_min: startOfDay, time_max: nextWeek });

                    promises.push(apiService.executeMCPTool('google_workspace_calendar', {
                        operation: 'list_events',
                        time_min: startOfDay,
                        time_max: nextWeek,
                        max_results: 10
                    }).then(res => {
                        console.log('[UnifiedDashboard] Calendar Response:', res);
                        return { type: 'calendar', res };
                    }));
                }

                // Execute all
                const results = await Promise.allSettled(promises);

                const newMessages: DashboardItem[] = [];
                const newTasks: DashboardItem[] = []; // In Progress only
                const newEvents: DashboardItem[] = [];

                for (const result of results) {
                    if (result.status === 'fulfilled' && result.value) {
                        const { type, res } = result.value;
                        if (!res || (!res.success && !res.data && !res.result)) continue;

                        const data = res.data || res.result || res;

                        // Process based on type
                        if (type === 'gmail') {
                            const emails = data.emails || [];
                            newMessages.push(...emails.map((e: any) => ({
                                id: e.id, title: e.from || 'Unknown', subtitle: e.subject || 'No Subject',
                                time: new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                platform: 'gmail'
                            })));
                        } else if (type === 'slack') {
                            const msgs = data.data?.messages || data.messages || [];
                            newMessages.push(...msgs.map((m: any) => ({
                                id: m.timestamp, title: m.user || 'Unknown', subtitle: m.text || 'Message',
                                time: new Date(parseFloat(m.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                platform: 'slack'
                            })));
                        } else if (type === 'outlook') {
                            const msgs = data.messages || [];
                            newMessages.push(...msgs.map((m: any) => ({
                                id: m.id, title: m.from || 'Unknown', subtitle: m.subject || 'No Subject',
                                time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                platform: 'outlook'
                            })));
                        } else if (type === 'teams') {
                            const msgs = data.messages || [];
                            newMessages.push(...msgs.map((m: any) => ({
                                id: m.id, title: m.from || 'Unknown', subtitle: m.subject || 'Chat',
                                time: m.created_date ? new Date(m.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
                                platform: 'teams'
                            })));
                        } else if (type === 'clickup') {
                            const tasks = data.tasks || [];
                            tasks.forEach((t: any) => {
                                const status = (t.status?.status || '').toLowerCase();
                                if (status.includes('progress') || status.includes('doing') || status.includes('active')) {
                                    newTasks.push({
                                        id: t.id, title: t.name, subtitle: t.list?.name || 'ClickUp', platform: 'clickup'
                                    });
                                }
                            });
                        } else if (type === 'jira') {
                            const issues = data.issues || data.data?.issues || [];
                            issues.forEach((i: any) => {
                                // JQL already filtered for In Progress, but let's be safe
                                newTasks.push({
                                    id: i.key, title: i.summary, subtitle: i.project || 'Jira', platform: 'jira'
                                });
                            });
                        } else if (type === 'trello') {
                            const cards = data.cards || data.data?.cards || [];
                            cards.forEach((c: any) => {
                                const list = (c.list?.name || c.listName || '').toLowerCase();
                                if (list.includes('progress') || list.includes('doing') || list.includes('working')) {
                                    newTasks.push({
                                        id: c.id, title: c.name, subtitle: c.board?.name || 'Trello', platform: 'trello'
                                    });
                                }
                            });
                        } else if (type === 'asana') {
                            const tasks = data.data || [];
                            tasks.forEach((t: any) => {
                                if (!t.completed) { // Asana list endpoint is simple, assume incomplete = todo/in-progress
                                    // Asana doesn't give status name easily in list view without extra calls, 
                                    // but we can just show them. Or maybe filter if we had section info.
                                    // For now, include all incomplete.
                                    newTasks.push({
                                        id: t.gid, title: t.name, subtitle: 'Asana', platform: 'asana'
                                    });
                                }
                            });
                        } else if (type === 'calendar') {
                            const events = data.events || [];
                            newEvents.push(...events.map((e: any) => ({
                                id: e.id, title: e.summary || 'No Title',
                                subtitle: e.start?.dateTime ?
                                    `${new Date(e.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${e.location || 'Online'}` :
                                    'All Day',
                                time: e.start?.dateTime || '',
                                platform: 'google'
                            })));
                        }
                    }
                }

                // Sort
                newMessages.sort((a, b) => (b.time && a.time ? (new Date('2000/01/01 ' + b.time).getTime() - new Date('2000/01/01 ' + a.time).getTime()) : 0));

                // For tasks, we don't have good sorting, just slice

                // For events, sort by time
                newEvents.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

                // Fallback / Mock only if absolutely empty and connection check failed (to prevent looking broken)
                // But user asked for REAL data. So if empty, let it be empty?
                // Actually, if connections are empty, maybe show empty state.

                setData({
                    messages: newMessages,
                    tasks: newTasks,
                    events: newEvents
                });

            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getPlatformIcon = (platform?: string) => {
        switch (platform) {
            case 'clickup': return <ClickUpLogo className="w-3.5 h-3.5" />;
            case 'jira': return <JiraLogo className="w-3.5 h-3.5" />;
            case 'trello': return <TrelloLogo className="w-3.5 h-3.5" />;
            case 'asana': return <AsanaLogo className="w-3.5 h-3.5" />;
            case 'slack': return <MessageSquare className="w-3.5 h-3.5 text-blue-500" />;
            case 'gmail': return <Mail className="w-3.5 h-3.5 text-red-500" />;
            case 'outlook': return <OutlookLogo className="w-3.5 h-3.5" />;
            case 'google': return <Video className="w-3.5 h-3.5 text-blue-500" />;
            default: return null;
        }
    };

    const ListCard = ({
        title,
        items,
        icon: Icon,
        color,
        path,
        delay,
        actionLabel,
        tutorialClass = ''
    }: {
        title: string,
        items: DashboardItem[],
        icon: any,
        color: string,
        path: string,
        delay: string,
        actionLabel: string,
        tutorialClass?: string
    }) => (
        <div
            className={`bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700 ${delay} ${tutorialClass}`}
        >
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${color} bg-opacity-10 backdrop-blur-sm`}>
                        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-').replace('text-white', '')}`} style={{ color: color.includes('text-white') ? undefined : 'currentColor' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{items.length} Items</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate(path)}
                    className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4 p-4 border-b border-gray-50 last:border-0">
                            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded" />
                                <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded" />
                            </div>
                        </div>
                    ))
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300">
                        <Icon className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm font-medium">No items found</span>
                        <span className="text-xs text-center mt-1 text-gray-400 px-6">Check your connections in Settings</span>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => navigate(path)}
                                className="group flex items-start gap-3 p-4 hover:bg-gray-50/80 transition-colors cursor-pointer"
                            >
                                {/* Icon/Avatar Placeholder */}
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-500 text-xs font-bold">
                                    {item.platform ? getPlatformIcon(item.platform) : item.title.charAt(0)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate pr-2 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                        {item.time && !item.time.includes('T') && <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">{item.time}</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                <button
                    onClick={() => navigate(path)}
                    className="w-full py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                >
                    {actionLabel}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed top-0 left-0 w-full h-[800px] bg-gradient-to-b from-indigo-50/40 via-purple-50/20 to-transparent pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8 relative z-10 mt-4">
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <DashboardHeader
                        userName={user?.name || 'User'}
                        isFocusMode={isFocusMode}
                        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                    />
                    <button
                        onClick={() => setShowBriefing(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-lg shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-105 transition-all font-semibold text-sm"
                    >
                        <Sparkles className="w-4 h-4" />
                        Launch My Briefing
                    </button>
                </div>

                {/* Detailed Overview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

                    <ListCard
                        title="Unified Inbox"
                        items={data.messages}
                        icon={Mail}
                        color="bg-indigo-500 text-indigo-600"
                        path="/unified/inbox"
                        delay="delay-100"
                        actionLabel="View All Messages"
                        tutorialClass="unified-inbox-tut"
                    />

                    <ListCard
                        title="In Progress Tasks"
                        items={data.tasks}
                        icon={CheckSquare}
                        color="bg-emerald-500 text-emerald-600"
                        path="/unified/tasks"
                        delay="delay-200"
                        actionLabel="View Task Board"
                        tutorialClass="task-hub-tut"
                    />

                    <ListCard
                        title="Upcoming Events"
                        items={data.events}
                        icon={Calendar}
                        color="bg-orange-500 text-orange-600"
                        path="/unified/calendar"
                        delay="delay-300"
                        actionLabel="Open Calendar"
                        tutorialClass="calendar-hub-tut"
                    />

                </div>

                {/* Welcome / Context Section */}
                <div className="mt-12 text-center animate-in fade-in zoom-in duration-1000 delay-500">
                    <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">Workspace Overview</p>
                </div>
            </div>

            {/* Global Command Palette */}
            <CommandPalette
                onCreateTask={() => navigate('/unified/tasks')}
                onComposeMessage={() => navigate('/unified/inbox')}
            />

            {/* My Briefing Modal */}
            {showBriefing && <EnhancedBriefing onClose={() => setShowBriefing(false)} />}
        </div>
    );
};

export default UnifiedDashboard;
