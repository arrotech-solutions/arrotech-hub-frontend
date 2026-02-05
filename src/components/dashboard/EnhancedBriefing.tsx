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
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col">

                {/* Decorative Header */}
                <div className="h-2 bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-500 flex-shrink-0" />

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-wide uppercase text-xs mb-1">
                                <Sparkles className="w-4 h-4" />
                                <span>My Briefing</span>
                            </div>
                            {loading ? (
                                <div className="animate-pulse">
                                    <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
                                    <div className="h-5 w-48 bg-gray-100 rounded" />
                                </div>
                            ) : (
                                <>
                                    <h1 className={`font-bold text-gray-900 mb-1 ${zenMode ? 'text-4xl' : 'text-3xl'}`}>
                                        {data?.greeting || getGreetingPrefix()}, {user?.name?.split(' ')[0] || 'Creator'}.
                                    </h1>
                                    <p className={`text-gray-500 font-light ${zenMode ? 'text-2xl' : 'text-xl'}`}>
                                        {data?.headline}
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setZenMode(!zenMode)}
                                className={`p-2 rounded-full transition-all ${zenMode ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                                title={zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}
                            >
                                <Coffee className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs - Only show in normal mode */}
                    {!zenMode && !loading && (
                        <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                        ${activeTab === tab.id
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        }
                                    `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className={`
                                            text-xs px-1.5 py-0.5 rounded-full
                                            ${activeTab === tab.id ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-600'}
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
                            <p className="text-lg text-gray-600 font-light max-w-md mx-auto leading-relaxed">
                                {data?.summary}
                            </p>
                            <div className="space-y-4 max-w-md mx-auto">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                                    Focus on these today
                                </h3>
                                {data?.priorities.slice(0, 3).map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                        <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-sm font-bold text-indigo-600">
                                            {i + 1}
                                        </span>
                                        <span className="text-gray-700 font-medium text-left">
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
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                                        <div className="flex items-start gap-3">
                                            <Sun className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                                            <div>
                                                <h3 className="font-semibold text-indigo-900 mb-2">Daily Summary</h3>
                                                <p className="text-indigo-800/80 text-sm leading-relaxed">
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
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2 text-sm">
                                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                Potential Risks
                                            </h3>
                                            <ul className="space-y-2">
                                                {data.risks.map((risk, i) => (
                                                    <li key={i} className="flex gap-2 text-sm text-amber-700/80 items-start">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                                        {risk}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Weekly Pulse Teaser */}
                                    {data?.weekly_pulse && (
                                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 rounded-xl text-white">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center relative">
                                                        <BarChart3 className="w-6 h-6" />
                                                        {data.weekly_pulse.trend === 'up' && (
                                                            <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg">Weekly Pulse: {data.weekly_pulse.score}</h3>
                                                        <div className="flex gap-4 text-gray-400 text-sm mt-0.5">
                                                            <span>✨ {data.weekly_pulse.completedTasks} Tasks Done</span>
                                                            <span>🧠 {data.weekly_pulse.focusHours}h Focus Time</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setShowFullReport(!showFullReport)}
                                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                                >
                                                    {showFullReport ? 'Hide' : 'Full Report'} <ChevronRight className={`w-4 h-4 transition-transform ${showFullReport ? 'rotate-90' : ''}`} />
                                                </button>
                                            </div>

                                            {/* Expanded Full Report Section */}
                                            {showFullReport && (
                                                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <h4 className="font-semibold text-white mb-4">📊 Weekly Productivity Report</h4>

                                                    {/* Stats Grid */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                        <div className="p-3 bg-white/5 rounded-lg text-center">
                                                            <div className="text-2xl font-bold text-green-400">{data.weekly_pulse.completedTasks}</div>
                                                            <div className="text-xs text-gray-400">Tasks Completed</div>
                                                        </div>
                                                        <div className="p-3 bg-white/5 rounded-lg text-center">
                                                            <div className="text-2xl font-bold text-blue-400">{data.weekly_pulse.focusHours}h</div>
                                                            <div className="text-xs text-gray-400">Focus Time</div>
                                                        </div>
                                                        <div className="p-3 bg-white/5 rounded-lg text-center">
                                                            <div className="text-2xl font-bold text-orange-400">{data.weekly_pulse.meetingHours}h</div>
                                                            <div className="text-xs text-gray-400">In Meetings</div>
                                                        </div>
                                                        <div className="p-3 bg-white/5 rounded-lg text-center">
                                                            <div className="text-2xl font-bold text-purple-400">{data.weekly_pulse.score}</div>
                                                            <div className="text-xs text-gray-400">Productivity Score</div>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mb-3">
                                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                            <span>Weekly Goal Progress</span>
                                                            <span>{data.weekly_pulse.score}%</span>
                                                        </div>
                                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(data.weekly_pulse.score, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Insights */}
                                                    <div className="text-xs text-gray-400 space-y-1">
                                                        <p>🎯 You're {data.weekly_pulse.score >= 80 ? 'crushing it!' : data.weekly_pulse.score >= 60 ? 'on track!' : 'building momentum!'}</p>
                                                        <p>📈 {data.weekly_pulse.focusHours > data.weekly_pulse.meetingHours ? 'Great focus-to-meeting ratio!' : 'Consider blocking more focus time.'}</p>
                                                        <p className="text-gray-500 italic mt-2">Full analytics dashboard coming in Phase 5</p>
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
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                        {/* AI Response Display */}
                        {aiResponse && (
                            <div className="mb-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-indigo-900 leading-relaxed">{aiResponse.answer}</p>
                                        {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {aiResponse.suggestions.map((suggestion, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setAiQuestion(suggestion)}
                                                        className="px-3 py-1.5 text-xs bg-white border border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-50 transition-colors"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setAiResponse(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Ask AI Input */}
                            <div className="flex-1 flex gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={aiQuestion}
                                        onChange={(e) => setAiQuestion(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                                        placeholder="Ask AI a follow-up question..."
                                        className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        disabled={askingAI}
                                    />
                                    <Zap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                                <button
                                    onClick={handleAskAI}
                                    disabled={askingAI || !aiQuestion.trim()}
                                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {askingAI ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 flex-wrap">
                                {data?.suggested_actions?.slice(0, 2).map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAction(action.action, action.label)}
                                        disabled={!!processingAction}
                                        className={`px-4 py-2 bg-white border border-gray-200 shadow-sm text-gray-600 text-sm rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all font-medium ${processingAction === action.action ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        {processingAction === action.action ? 'Processing...' : action.label}
                                    </button>
                                ))}
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-transform active:scale-95"
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
