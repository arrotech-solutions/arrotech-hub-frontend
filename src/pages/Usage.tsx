import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import { Spinner } from '../components/ui';
import { useSubscription } from '../hooks/useSubscription';
import { chart } from '../theme';
import {
    TrendingUp,
    Flame,
    Trophy,
    Target,
    Calendar,
    Mail,
    CheckCircle,
    Clock,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Sparkles,
    RefreshCw,
    Zap,
    Workflow,
    Database,
    MessageCircle,
    ArrowRight,
    Crown,
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from 'recharts';

interface DailyScore {
    date: string;
    score: number;
    breakdown: Record<string, number>;
    activities_count: number;
}

interface StreakData {
    current_streak: number;
    longest_streak: number;
    last_active_date: string;
    streak_type: string;
    multiplier: number;
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    earned: boolean;
    icon: string;
}

interface WeeklyComparison {
    this_week: {
        average_score: number;
        total_score: number;
        daily_scores: DailyScore[];
    };
    last_week: {
        average_score: number;
        total_score: number;
        daily_scores: DailyScore[];
    };
    change_percentage: number;
    trend: string;
}

interface ActivityBreakdown {
    period: string;
    total_activities: number;
    by_type: Record<string, number>;
    peak_hour: number;
    peak_day: string;
    trend: string;
}

const ACTIVITY_COLORS: Record<string, string> = {
    email_processed: chart.primary,
    email_sent: chart.primary600,
    task_completed: chart.accent,
    task_created: chart.primary400,
    meeting_attended: chart.accent700,
    focus_time: chart.primary300,
    message_sent: chart.muted,
    inbox_zero: chart.accent600,
};

const ACTIVITY_LABELS: Record<string, string> = {
    email_processed: 'Emails Processed',
    email_sent: 'Emails Sent',
    task_completed: 'Tasks Completed',
    task_created: 'Tasks Created',
    meeting_attended: 'Meetings',
    focus_time: 'Focus Time',
    message_sent: 'Messages',
    inbox_zero: 'Inbox Zero',
};

/* ---------- Usage progress bar component ---------- */
function UsageBar({ label, icon: Icon, used, limit, color, accentClass }: {
    label: string;
    icon: React.ElementType;
    used: number;
    limit: number;
    color: string;
    accentClass: string;
}) {
    const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    const isUnlimited = limit >= 999999;
    const isWarning = pct >= 80;
    const isAtLimit = pct >= 100;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentClass}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
                </div>
                <span className="text-sm font-mono text-gray-500 dark:text-slate-400">
                    {used.toLocaleString()}{' / '}{isUnlimited ? '∞' : limit.toLocaleString()}
                </span>
            </div>
            <div className="relative h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${isAtLimit ? 'bg-red-500' : isWarning ? 'bg-amber-500' : color}`}
                    style={{ width: isUnlimited ? '8%' : `${pct}%` }}
                />
            </div>
            {isWarning && !isAtLimit && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    ⚠ {Math.round(pct)}% used — approaching limit
                </p>
            )}
            {isAtLimit && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    🚫 Limit reached — upgrade to continue
                </p>
            )}
        </div>
    );
}

/* ---------- Main Usage Page ---------- */
export default function Usage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dailyScore, setDailyScore] = useState<DailyScore | null>(null);
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [comparison, setComparison] = useState<WeeklyComparison | null>(null);
    const [trends, setTrends] = useState<DailyScore[]>([]);
    const [breakdown, setBreakdown] = useState<ActivityBreakdown | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

    const {
        usage,
        limits,
        tier,
        tierName,
        tierColor,
        isAiActionsWarning,
        isAutomationRunsWarning,
        loading: subLoading,
    } = useSubscription();

    const fetchData = useCallback(async () => {
        try {
            setRefreshing(true);
            const summaryRes = await apiService.request({ method: 'GET', url: '/productivity/summary' });
            const summary = summaryRes.data;
            if (summary.today_score) setDailyScore(summary.today_score);
            if (summary.streak) setStreak(summary.streak);
            if (summary.recent_achievements) setAchievements(summary.recent_achievements);
            if (summary.week_comparison) setComparison(summary.week_comparison);
            if (summary.weekly_breakdown) setBreakdown(summary.weekly_breakdown);

            const trendsRes = await apiService.request({ method: 'GET', url: '/productivity/trends', params: { days: 30 } });
            if (trendsRes.data?.scores) setTrends(trendsRes.data.scores);
        } catch (error) {
            console.error('Error fetching productivity data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const fetchBreakdown = async () => {
            try {
                const res = await apiService.request({ method: 'GET', url: `/productivity/breakdown/${selectedPeriod}` });
                if (res.data) setBreakdown(res.data);
            } catch (error) {
                console.error('Error fetching breakdown:', error);
            }
        };
        fetchBreakdown();
    }, [selectedPeriod]);

    const getTrendIcon = (trend: string) => {
        if (trend === 'up') return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
        if (trend === 'down') return <ArrowDownRight className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-gray-400 dark:text-slate-500" />;
    };

    const pieData = breakdown?.by_type
        ? Object.entries(breakdown.by_type).map(([key, value]) => ({
            name: ACTIVITY_LABELS[key] || key,
            value,
            color: ACTIVITY_COLORS[key] || '#6b7280',
        }))
        : [];

    const tierBadgeColor: Record<string, string> = {
        gray: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    };

    if (loading && subLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center transition-colors duration-300">
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 transition-colors duration-300">
            <div className="max-w-7xl mx-auto p-6">

                {/* ═══════════════ Header ═══════════════ */}
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm mb-8 transition-colors duration-300">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

                    <div className="relative px-8 py-10">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-10">
                            <div className="text-center sm:text-left w-full sm:w-auto productivity-header-tut">
                                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3">
                                    <div className="p-1.5 bg-blue-100/80 dark:bg-blue-500/20 rounded-lg">
                                        <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Platform Usage</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                                    Usage <span className="bg-gradient-to-r from-primary-500 to-secondary-900 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">Overview</span>
                                </h1>
                                <p className="text-gray-500 dark:text-slate-400 max-w-md font-medium">
                                    Monitor your resource consumption, track productivity, and optimize your workflows.
                                </p>
                            </div>
                            <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-end">
                                {/* Plan Badge */}
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${tierBadgeColor[tierColor] || tierBadgeColor.gray}`}>
                                    <Crown className="w-4 h-4" />
                                    <span className="capitalize">{tierName} Plan</span>
                                </div>
                                <button
                                    onClick={fetchData}
                                    disabled={refreshing}
                                    className="p-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200 shadow-sm group"
                                    title="Refresh"
                                >
                                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Billing Period */}
                        {usage?.period && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                <p className="text-xs text-gray-400 dark:text-slate-500">
                                    Billing period: <span className="font-medium text-gray-600 dark:text-slate-400">{new Date(usage.period.start).toLocaleDateString('en', { month: 'short', day: 'numeric' })} – {new Date(usage.period.end).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════ Plan Usage Bars ═══════════════ */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 mb-6 transition-colors duration-300 productivity-score-tut">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Resource Usage
                        </h2>
                        {(isAiActionsWarning || isAutomationRunsWarning) && (
                            <Link
                                to="/pricing"
                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-900 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200"
                            >
                                Upgrade Plan
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UsageBar
                            label="AI Actions"
                            icon={Zap}
                            used={usage?.ai_actions?.used || 0}
                            limit={limits?.ai_actions_monthly || 100}
                            color="bg-gradient-to-r from-blue-500 to-indigo-500"
                            accentClass="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                        />
                        <UsageBar
                            label="Automation Runs"
                            icon={Workflow}
                            used={usage?.automation_runs?.used || 0}
                            limit={limits?.automation_runs_monthly || 500}
                            color="bg-gradient-to-r from-secondary-700 to-primary-500"
                            accentClass="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                        />
                        <UsageBar
                            label="Active Workflows"
                            icon={Target}
                            used={usage?.active_workflows || 0}
                            limit={limits?.max_active_workflows || 3}
                            color="bg-gradient-to-r from-primary-500 to-accent-400"
                            accentClass="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        />
                        <UsageBar
                            label="Connections"
                            icon={Database}
                            used={usage?.connections || 0}
                            limit={limits?.email_providers ? (limits.email_providers + (limits.messaging_providers || 0) + (limits.calendar_providers || 0) + (limits.task_providers || 0)) : 4}
                            color="bg-gradient-to-r from-amber-500 to-orange-500"
                            accentClass="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        />
                    </div>

                    {/* Quick Counts */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{usage?.daily_messages || 0}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                                <MessageCircle className="w-3 h-3" /> Messages today
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{dailyScore?.score || 0}<span className="text-lg font-bold text-gray-400 dark:text-slate-500">/100</span></p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                                <BarChart3 className="w-3 h-3" /> Productivity score
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-orange-500">{streak?.current_streak || 0}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                                <Flame className="w-3 h-3" /> Day streak
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{dailyScore?.activities_count || 0}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Activities today
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ Charts Grid ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 30-Day Trend */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300 productivity-trends-tut">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            30-Day Productivity Trend
                        </h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="scoreGradientFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chart.primary} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={chart.primary} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                                    <XAxis
                                        dataKey="date"
                                        className="text-gray-500 dark:text-slate-400"
                                        tick={{ fill: 'currentColor', fontSize: 11 }}
                                        tickFormatter={(v) => new Date(v).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        className="text-gray-500 dark:text-slate-400"
                                        tick={{ fill: 'currentColor', fontSize: 11 }}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: chart.surfaceDark,
                                            border: `1px solid ${chart.secondary600}`,
                                            borderRadius: '12px',
                                            color: '#f1f5f9',
                                        }}
                                        labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke={chart.primary}
                                        strokeWidth={2}
                                        fill="url(#scoreGradientFill)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Activity Breakdown */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300 productivity-breakdown-tut">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                Activity Breakdown
                            </h2>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value as 'day' | 'week' | 'month')}
                                className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1 text-sm text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                <option value="day">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>

                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: chart.surfaceDark,
                                            border: `1px solid ${chart.secondary600}`,
                                            borderRadius: '8px',
                                            color: '#f1f5f9',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 mt-4">
                            {pieData.slice(0, 4).map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-gray-600 dark:text-slate-400">{item.name}</span>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weekly Comparison */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300 productivity-comparison-tut">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            Weekly Comparison
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 text-center border border-gray-100 dark:border-slate-700">
                                <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">This Week</p>
                                <p className="text-3xl font-black text-gray-900 dark:text-white">{comparison?.this_week.average_score || 0}</p>
                                <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">avg score</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 text-center border border-gray-100 dark:border-slate-700">
                                <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">Last Week</p>
                                <p className="text-3xl font-black text-gray-400 dark:text-slate-500">{comparison?.last_week.average_score || 0}</p>
                                <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">avg score</p>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-slate-400">Change</span>
                                <div className="flex items-center gap-2">
                                    {comparison && getTrendIcon(comparison.trend)}
                                    <span className={`text-lg font-bold ${(comparison?.change_percentage || 0) > 0 ? 'text-emerald-500' :
                                        (comparison?.change_percentage || 0) < 0 ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'
                                        }`}>
                                        {(comparison?.change_percentage || 0) > 0 ? '+' : ''}{comparison?.change_percentage || 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {breakdown && (
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-slate-400">Peak Hour</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{breakdown.peak_hour}:00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-slate-400">Most Productive Day</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{breakdown.peak_day}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Streak Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 relative overflow-hidden transition-colors duration-300 productivity-streak-tut">
                        <div className="absolute top-4 right-4">
                            <Flame className="w-16 h-16 text-orange-500/10 dark:text-orange-500/20" />
                        </div>

                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500" />
                            Streak Tracker
                        </h2>

                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-6xl font-black text-orange-500">{streak?.current_streak || 0}</span>
                            <span className="text-xl text-gray-400 dark:text-slate-500 mb-2">days</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-slate-400">Longest Streak</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{streak?.longest_streak || 0} days</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-slate-400">Bonus Multiplier</span>
                                <span className="font-semibold text-orange-500">{streak?.multiplier || 1}x</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex gap-1">
                                {[...Array(7)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 h-2 rounded-full ${i < (streak?.current_streak || 0) % 7
                                            ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                            : 'bg-gray-100 dark:bg-slate-800'
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                                {7 - ((streak?.current_streak || 0) % 7)} days until next bonus level
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300 productivity-stats-tut">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            Quick Stats
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Emails Processed</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{breakdown?.by_type?.email_processed || 0}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Tasks Completed</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{breakdown?.by_type?.task_completed || 0}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Meetings Attended</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{breakdown?.by_type?.meeting_attended || 0}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Focus Time (hrs)</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{breakdown?.by_type?.focus_time || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ Achievements ═══════════════ */}
                <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300 productivity-achievements-tut">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Achievements
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {achievements.map((achievement) => (
                            <div
                                key={achievement.id}
                                className={`p-4 rounded-xl text-center transition-all ${achievement.earned
                                    ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30'
                                    : 'bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 opacity-50'
                                    }`}
                            >
                                <span className="text-3xl">{achievement.icon}</span>
                                <h3 className="font-semibold mt-2 text-sm text-gray-900 dark:text-white">{achievement.title}</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{achievement.description}</p>
                            </div>
                        ))}

                        {achievements.length < 4 && [...Array(4 - achievements.length)].map((_, i) => (
                            <div
                                key={`placeholder-${i}`}
                                className="p-4 rounded-xl text-center bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 opacity-30"
                            >
                                <span className="text-3xl">🔒</span>
                                <h3 className="font-semibold mt-2 text-sm text-gray-900 dark:text-white">Locked</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Keep going!</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══════════════ Upgrade CTA (for free users) ═══════════════ */}
                {tier === 'free' && (
                    <div className="mt-6 bg-gradient-to-r from-primary-500 to-secondary-900 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold">Unlock more with a paid plan</h3>
                                <p className="text-blue-100 text-sm mt-1">
                                    Get more AI actions, automation runs, and premium features. Plans start from $9/mo.
                                </p>
                            </div>
                            <Link
                                to="/pricing"
                                className="shrink-0 flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
                            >
                                View Plans
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
