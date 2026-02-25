import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, Sun, CheckCircle, AlertTriangle, ArrowRight, Coffee, Mail, Sparkles,
    Calendar, MessageSquare, Zap, BarChart3, Send,
    RefreshCw, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api';
import BriefingCard, { BriefingCardItem } from './BriefingCard';

// Enhanced types for Phase 2
interface EmailItem {
    id: string;
    sender: string;
    subject: string;
    snippet?: string;
    reason?: string;
    time?: string;
    isUrgent?: boolean;
}

interface TaskItem {
    id: string;
    title: string;
    source: string;
    dueDate?: string;
    priority?: 'high' | 'medium' | 'low';
    status?: string;
}

interface CalendarItem {
    id: string;
    title: string;
    startTime: string;
    endTime?: string;
    isNow?: boolean;
    meetingLink?: string;
    location?: string;
}

interface ConversationItem {
    id: string;
    platform: string;
    channel?: string;
    sender: string;
    preview: string;
    time?: string;
    unreadCount?: number;
}

interface WeeklyPulse {
    score: number;
    trend: 'up' | 'down' | 'stable' | 'neutral';
    completedTasks: number;
    focusHours: number;
    meetingHours: number;
}

interface EnhancedBriefingData {
    greeting: string;
    headline: string;
    summary: string;
    time_context: string;
    priorities: string[];
    urgent_emails?: { sender: string; subject: string; reason: string }[];
    risks: string[];
    suggested_actions: { label: string; action: string }[];
    // Enhanced structured sections (populated from priorities/emails when available)
    emails?: EmailItem[];
    tasks?: TaskItem[];
    calendar?: CalendarItem[];
    conversations?: ConversationItem[];
    weekly_pulse?: WeeklyPulse;
}

type TabId = 'overview' | 'email' | 'tasks' | 'calendar' | 'conversations';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
}

const EnhancedBriefing: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState<EnhancedBriefingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingAction, setProcessingAction] = useState<string | null>(null);
    const [zenMode, setZenMode] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [aiQuestion, setAiQuestion] = useState('');
    const [askingAI, setAskingAI] = useState(false);
    const [aiResponse, setAiResponse] = useState<{ answer: string; suggestions?: string[] } | null>(null);
    const [showFullReport, setShowFullReport] = useState(false);

    // Time-aware greeting
    const getGreetingPrefix = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        if (hour < 21) return 'Good evening';
        return 'Good night';
    };

    // Parse priorities into structured tasks
    const parsePrioritiesToTasks = (priorities: string[]): TaskItem[] => {
        return priorities.map((p, idx) => {
            const sourceMatch = p.match(/\[([^\]]+)\]/);
            const source = sourceMatch ? sourceMatch[1] : 'Task';
            const title = p.replace(/\[[^\]]+\]\s*/, '');

            return {
                id: `task-${idx}`,
                title,
                source,
                priority: idx < 2 ? 'high' : idx < 4 ? 'medium' : 'low',
            };
        });
    };

    // Parse urgent_emails to enhanced format
    const parseEmails = (emails: { sender: string; subject: string; reason: string }[]): EmailItem[] => {
        return emails.map((e, idx) => ({
            id: `email-${idx}`,
            sender: e.sender,
            subject: e.subject,
            reason: e.reason,
            isUrgent: true,
        }));
    };

    useEffect(() => {
        const loadBriefing = async () => {
            try {
                const res = await apiService.getMyBriefing();
                if (res) {
                    const briefingData = res as unknown as EnhancedBriefingData;

                    // Enhance with parsed structured data
                    if (briefingData.priorities) {
                        briefingData.tasks = parsePrioritiesToTasks(briefingData.priorities);
                    }
                    if (briefingData.urgent_emails) {
                        briefingData.emails = parseEmails(briefingData.urgent_emails);
                    }
                    // Map backend 'calendar_events' to frontend 'calendar'
                    // The API returns 'calendar_events', but our interface expects 'calendar'
                    if ((briefingData as any).calendar_events) {
                        briefingData.calendar = (briefingData as any).calendar_events;
                    }

                    setData(briefingData);
                }
            } catch (error) {
                console.error("Failed to load briefing", error);
            } finally {
                setLoading(false);
            }
        };
        loadBriefing();
    }, []);

    const handleAction = async (actionId: string, label: string) => {
        if (actionId.startsWith('nav-')) {
            const routes: Record<string, string> = {
                'nav-settings': '/settings',
                'nav-marketplace': '/marketplace',
                'nav-calendar': '/unified/calendar',
                'nav-tasks': '/unified/tasks',
                'nav-inbox': '/unified/inbox',
                'nav-profile': '/profile'
            };
            navigate(routes[actionId] || '/unified');
            onClose();
            return;
        }

        setProcessingAction(actionId);
        try {
            const res = await apiService.executeBriefingAction(actionId);
            if (res.success) {
                alert(res.message || `Action "${label}" executed successfully!`);
            } else {
                alert(`Action completed with warnings: ${res.message || 'Check logs for details.'}`);
            }
        } catch (error) {
            console.error("Action failed", error);
            alert("Failed to execute action. Please try again.");
        } finally {
            setProcessingAction(null);
        }
    };

    const handleItemAction = (itemId: string, action: string) => {
        setProcessingAction(`${itemId}-${action}`);

        // Handle specific actions
        if (action === 'join') {
            // Find the calendar item and open its meeting link
            const calendarItem = data?.calendar?.find(c => c.id === itemId);
            if (calendarItem?.meetingLink) {
                window.open(calendarItem.meetingLink, '_blank');
                setProcessingAction(null);
                return;
            } else {
                alert('No meeting link available for this event.');
                setProcessingAction(null);
                return;
            }
        }

        if (action === 'complete') {
            // TODO: Call backend to mark task complete in Jira/ClickUp/etc.
            // For now, show success feedback
            setTimeout(() => {
                setProcessingAction(null);
                alert('Task marked as complete! (Backend integration coming in Phase 3)');
            }, 500);
            return;
        }

        if (action === 'reply') {
            setProcessingAction(null);
            navigate('/unified/inbox');
            onClose();
            return;
        }

        if (action === 'view') {
            // Navigate to the appropriate view based on item type
            setProcessingAction(null);
            navigate('/unified/tasks');
            onClose();
            return;
        }

        if (action === 'archive') {
            // TODO: Call backend to archive email
            setTimeout(() => {
                setProcessingAction(null);
                alert('Email archived! (Backend integration coming in Phase 3)');
            }, 500);
            return;
        }

        // Default: clear processing state after delay
        setTimeout(() => {
            setProcessingAction(null);
        }, 500);
    };

    const handleAskAI = async () => {
        if (!aiQuestion.trim()) return;
        setAskingAI(true);
        setAiResponse(null);

        try {
            // Pass the current summary as context
            const context = data?.summary || '';
            const result = await apiService.askAI(aiQuestion, context);
            setAiResponse(result);
            setAiQuestion('');
        } catch (error) {
            console.error('Ask AI failed:', error);
            setAiResponse({ answer: 'Sorry, I had trouble processing your question. Please try again.' });
        } finally {
            setAskingAI(false);
        }
    };

    // Define tabs with counts
    const tabs: Tab[] = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'email', label: 'Emails', icon: Mail, count: data?.emails?.length },
        { id: 'tasks', label: 'Tasks', icon: CheckCircle, count: data?.tasks?.length },
        { id: 'calendar', label: 'Calendar', icon: Calendar, count: data?.calendar?.length },
        { id: 'conversations', label: 'Messages', icon: MessageSquare, count: data?.conversations?.length },
    ];

    // Convert tasks to BriefingCardItems
    const taskItems: BriefingCardItem[] = (data?.tasks || []).map(t => ({
        id: t.id,
        title: t.title,
        source: t.source,
        badge: t.priority === 'high'
            ? { text: 'High', color: 'red' as const }
            : t.priority === 'medium'
                ? { text: 'Medium', color: 'orange' as const }
                : undefined,
        meta: t.dueDate ? `Due: ${t.dueDate}` : undefined,
        actions: [
            { label: 'Complete', action: 'complete', variant: 'primary' as const },
            { label: 'View', action: 'view', variant: 'secondary' as const },
        ],
    }));

    // Convert emails to BriefingCardItems
    const emailItems: BriefingCardItem[] = (data?.emails || []).map(e => ({
        id: e.id,
        title: e.subject,
        subtitle: e.reason,
        badge: e.isUrgent ? { text: 'Urgent', color: 'red' as const } : undefined,
        meta: `From: ${e.sender}`,
        actions: [
            { label: 'Reply', action: 'reply', variant: 'primary' as const },
            { label: 'Archive', action: 'archive', variant: 'secondary' as const },
        ],
    }));

    // Convert calendar to BriefingCardItems
    const calendarItems: BriefingCardItem[] = (data?.calendar || []).map(c => ({
        id: c.id,
        title: c.title,
        subtitle: c.location,
        badge: c.isNow ? { text: 'Now', color: 'green' as const } : undefined,
        meta: `${c.startTime}${c.endTime ? ` - ${c.endTime}` : ''}`,
        actions: c.meetingLink ? [
            { label: 'Join', action: 'join', variant: 'primary' as const },
        ] : [],
    }));

    // Convert conversations to BriefingCardItems
    const conversationItems: BriefingCardItem[] = (data?.conversations || []).map(c => ({
        id: c.id,
        title: c.sender,
        subtitle: c.preview,
        badge: c.unreadCount ? { text: `${c.unreadCount} new`, color: 'blue' as const } : undefined,
        meta: `${c.platform} • ${c.time || 'Today'}`,
        actions: [
            { label: 'Reply', action: 'reply', variant: 'primary' as const },
        ],
    }));

    if (!data && !loading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Content Card */}
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col border border-gray-100 dark:border-slate-800">

                {/* Decorative Header */}
                <div className="h-2 bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-500 flex-shrink-0" />

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold tracking-wide uppercase text-xs mb-1">
                                <Sparkles className="w-4 h-4" />
                                <span>My Briefing</span>
                            </div>
                            {loading ? (
                                <div className="animate-pulse">
                                    <div className="h-8 w-64 bg-gray-200 dark:bg-slate-800 rounded mb-2" />
                                    <div className="h-5 w-48 bg-gray-100 dark:bg-slate-800/50 rounded" />
                                </div>
                            ) : (
                                <>
                                    <h1 className={`font-bold text-gray-900 dark:text-white mb-1 tracking-tight ${zenMode ? 'text-4xl' : 'text-3xl'}`}>
                                        {data?.greeting || getGreetingPrefix()}, {user?.name?.split(' ')[0] || 'Creator'}.
                                    </h1>
                                    <p className={`text-gray-500 dark:text-slate-400 font-light ${zenMode ? 'text-2xl' : 'text-xl'}`}>
                                        {data?.headline}
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setZenMode(!zenMode)}
                                className={`p-2 rounded-full transition-all ${zenMode ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                                title={zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}
                            >
                                <Coffee className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs - Only show in normal mode */}
                    {!zenMode && !loading && (
                        <div className="flex gap-1 mt-4 overflow-x-auto pb-1 custom-scrollbar">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                                        ${activeTab === tab.id
                                            ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-500/50'
                                            : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200'
                                        }
                                    `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className={`
                                            text-[10px] px-1.5 py-0.5 rounded-full font-bold
                                            ${activeTab === tab.id ? 'bg-indigo-200 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400'}
                                        `}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <BriefingCard
                                title="Tasks"
                                icon={CheckCircle}
                                items={[]}
                                loading={true}
                            />
                            <BriefingCard
                                title="Emails"
                                icon={Mail}
                                items={[]}
                                loading={true}
                            />
                        </div>
                    ) : zenMode ? (
                        /* ZEN MODE */
                        <div className="py-8 text-center space-y-8">
                            <p className="text-lg text-gray-600 dark:text-slate-300 font-light max-w-md mx-auto leading-relaxed italic">
                                "{data?.summary}"
                            </p>
                            <div className="space-y-4 max-w-md mx-auto">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                    Core Focus Today
                                </h3>
                                {data?.priorities.slice(0, 3).map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-5 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/20 shadow-sm">
                                        <span className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                            {i + 1}
                                        </span>
                                        <span className="text-gray-700 dark:text-slate-200 font-bold text-left tracking-tight">
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-6">
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full font-medium text-lg flex items-center gap-3 mx-auto transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Start My Focused Day
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* NORMAL MODE - Tab Content */
                        <div className="space-y-6">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <>
                                    {/* Summary Card */}
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
                                                <Sun className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-indigo-900 dark:text-white mb-1.5 text-sm uppercase tracking-wider">Daily Summary</h3>
                                                <p className="text-indigo-800/80 dark:text-slate-300 text-sm leading-relaxed font-medium">
                                                    {data?.summary}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Two-column grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Tasks */}
                                        <BriefingCard
                                            title="Top Priorities"
                                            icon={CheckCircle}
                                            iconColor="text-emerald-500"
                                            items={taskItems}
                                            maxItems={5}
                                            emptyMessage="No tasks for today"
                                            onItemAction={handleItemAction}
                                            processingAction={processingAction}
                                        />

                                        {/* Emails */}
                                        <BriefingCard
                                            title="Urgent Emails"
                                            icon={Mail}
                                            iconColor="text-red-500"
                                            bgColor="bg-red-50/50"
                                            borderColor="border-red-100"
                                            items={emailItems}
                                            maxItems={3}
                                            emptyMessage="No urgent emails"
                                            onItemAction={handleItemAction}
                                            processingAction={processingAction}
                                        />
                                    </div>

                                    {/* Risks */}
                                    {data?.risks && data.risks.length > 0 && (
                                        <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/20 shadow-sm">
                                            <h3 className="font-bold text-amber-900 dark:text-amber-400 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                                Potential Risks
                                            </h3>
                                            <ul className="space-y-3">
                                                {data.risks.map((risk, i) => (
                                                    <li key={i} className="flex gap-3 text-sm text-amber-800/90 dark:text-amber-300/90 items-start font-bold">
                                                        <span className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 mt-1.5 shrink-0 shadow-sm" />
                                                        {risk}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Weekly Pulse Teaser */}
                                    {data?.weekly_pulse && (
                                        <div className="bg-gradient-to-r from-gray-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center relative shadow-inner ring-1 ring-white/20">
                                                        <BarChart3 className="w-7 h-7 text-indigo-300" />
                                                        {data.weekly_pulse.trend === 'up' && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-xl tracking-tight">Weekly Pulse: {data.weekly_pulse.score}</h3>
                                                        <div className="flex gap-4 text-slate-400 text-sm mt-1 font-medium">
                                                            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-indigo-400" /> {data.weekly_pulse.completedTasks} Done</span>
                                                            <span className="flex items-center gap-1"><Coffee className="w-3.5 h-3.5 text-amber-400" /> {data.weekly_pulse.focusHours}h Focus</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setShowFullReport(!showFullReport)}
                                                    className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ring-1 ring-white/10"
                                                >
                                                    {showFullReport ? 'Hide' : 'Full Report'} <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showFullReport ? 'rotate-90' : ''}`} />
                                                </button>
                                            </div>

                                            {/* Expanded Full Report Section */}
                                            {showFullReport && (
                                                <div className="mt-6 p-5 bg-black/20 dark:bg-white/5 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-3 duration-500">
                                                    <h4 className="font-bold text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-widest opacity-80">
                                                        <Zap className="w-4 h-4 text-amber-400" />
                                                        Weekly Performance
                                                    </h4>

                                                    {/* Stats Grid */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                        <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5 backdrop-blur-sm">
                                                            <div className="text-3xl font-bold text-green-400 mb-1">{data.weekly_pulse.completedTasks}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Tasks</div>
                                                        </div>
                                                        <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5 backdrop-blur-sm">
                                                            <div className="text-3xl font-bold text-blue-400 mb-1">{data.weekly_pulse.focusHours}h</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Focus</div>
                                                        </div>
                                                        <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5 backdrop-blur-sm">
                                                            <div className="text-3xl font-bold text-orange-400 mb-1">{data.weekly_pulse.meetingHours}h</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Meetings</div>
                                                        </div>
                                                        <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5 backdrop-blur-sm">
                                                            <div className="text-3xl font-bold text-indigo-400 mb-1">{data.weekly_pulse.score}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Score</div>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mb-6">
                                                        <div className="flex justify-between text-xs text-gray-400 mb-2 font-bold uppercase tracking-tighter">
                                                            <span>Weekly Goal Completion</span>
                                                            <span className="text-white">{data.weekly_pulse.score}%</span>
                                                        </div>
                                                        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-green-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                                style={{ width: `${Math.min(data.weekly_pulse.score, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Insights */}
                                                    <div className="text-xs text-slate-300 space-y-2 font-medium bg-white/5 p-4 rounded-xl border border-white/10 italic leading-relaxed">
                                                        <p>🎯 {data.weekly_pulse.score >= 80 ? 'Exceptional output! You are consistently outperforming targets.' : data.weekly_pulse.score >= 60 ? 'Solid performance. You are in a healthy flow state.' : 'Gaining momentum. Focus on clear, high-impact tasks.'}</p>
                                                        <p>📈 {data.weekly_pulse.focusHours > data.weekly_pulse.meetingHours ? 'Optimal deep work ratio achieved. Your focus-to-meeting balance is high.' : 'Meeting volume is high. Consider aggressive time-blocking for deep work.'}</p>
                                                        <p className="text-gray-500 not-italic font-bold uppercase tracking-widest mt-4 text-[10px]">Full analytics engine coming in v2.4</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Email Tab */}
                            {activeTab === 'email' && (
                                <BriefingCard
                                    title="Email Inbox"
                                    icon={Mail}
                                    iconColor="text-blue-500"
                                    items={emailItems}
                                    emptyMessage="No emails to show. Check your inbox settings."
                                    onItemAction={handleItemAction}
                                    processingAction={processingAction}
                                />
                            )}

                            {/* Tasks Tab */}
                            {activeTab === 'tasks' && (
                                <BriefingCard
                                    title="All Tasks"
                                    icon={CheckCircle}
                                    iconColor="text-emerald-500"
                                    items={taskItems}
                                    emptyMessage="No tasks. Enjoy your day!"
                                    onItemAction={handleItemAction}
                                    processingAction={processingAction}
                                />
                            )}

                            {/* Calendar Tab */}
                            {activeTab === 'calendar' && (
                                <BriefingCard
                                    title="Today's Schedule"
                                    icon={Calendar}
                                    iconColor="text-purple-500"
                                    items={calendarItems}
                                    emptyMessage="No events scheduled for today"
                                    onItemAction={handleItemAction}
                                    processingAction={processingAction}
                                />
                            )}

                            {/* Conversations Tab */}
                            {activeTab === 'conversations' && (
                                <BriefingCard
                                    title="Recent Messages"
                                    icon={MessageSquare}
                                    iconColor="text-pink-500"
                                    items={conversationItems}
                                    emptyMessage="No recent conversations."
                                    onItemAction={handleItemAction}
                                    processingAction={processingAction}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer with AI Ask + Actions */}
                {!zenMode && !loading && (
                    <div className="px-6 py-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex-shrink-0">
                        {/* AI Response Display */}
                        {aiResponse && (
                            <div className="mb-5 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 shadow-md animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-indigo-900 dark:text-slate-200 leading-relaxed font-medium">{aiResponse.answer}</p>
                                        {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {aiResponse.suggestions.map((suggestion, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setAiQuestion(suggestion)}
                                                        className="px-4 py-1.5 text-[10px] uppercase tracking-wider bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all font-bold shadow-sm"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setAiResponse(null)}
                                        className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            {/* Ask AI Input */}
                            <div className="flex-1 flex gap-2 w-full">
                                <div className="flex-1 relative group">
                                    <input
                                        type="text"
                                        value={aiQuestion}
                                        onChange={(e) => setAiQuestion(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                                        placeholder="Ask AI follow-up..."
                                        className="w-full px-5 py-3 pr-12 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent transition-all dark:text-white font-medium"
                                        disabled={askingAI}
                                    />
                                    <Zap className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${askingAI ? 'text-indigo-500 animate-pulse' : 'text-gray-400 group-focus-within:text-indigo-500'}`} />
                                </div>
                                <button
                                    onClick={handleAskAI}
                                    disabled={askingAI || !aiQuestion.trim()}
                                    className="px-5 py-3 bg-indigo-600 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 flex items-center gap-2 active:scale-95"
                                >
                                    {askingAI ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                                {data?.suggested_actions?.slice(0, 1).map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAction(action.action, action.label)}
                                        disabled={!!processingAction}
                                        className={`flex-1 sm:flex-none px-5 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm text-gray-700 dark:text-slate-300 text-sm rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-bold whitespace-nowrap active:scale-95 ${processingAction === action.action ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        {processingAction === action.action ? 'Processing...' : action.label}
                                    </button>
                                ))}
                                <button
                                    onClick={onClose}
                                    className="flex-1 sm:flex-none px-8 py-3 bg-gray-900 dark:bg-slate-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl"
                                >
                                    Start My Day <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedBriefing;
