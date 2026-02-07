import { useState, useEffect, useCallback } from 'react';
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
    email_processed: '#6366f1',
    email_sent: '#8b5cf6',
    task_completed: '#10b981',
    task_created: '#34d399',
    meeting_attended: '#f59e0b',
    focus_time: '#ec4899',
    message_sent: '#06b6d4',
    inbox_zero: '#84cc16',
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

export default function ProductivityStats() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dailyScore, setDailyScore] = useState<DailyScore | null>(null);
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [comparison, setComparison] = useState<WeeklyComparison | null>(null);
    const [trends, setTrends] = useState<DailyScore[]>([]);
    const [breakdown, setBreakdown] = useState<ActivityBreakdown | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

    const fetchData = useCallback(async () => {
        try {
            setRefreshing(true);

            // TODO: Replace with actual API calls when backend is connected
            // For now, use mock data for demonstration
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading

            // Mock data for demo
            setDailyScore({
                date: new Date().toISOString().split('T')[0],
                score: 78,
                breakdown: { task_completed: 20, email_processed: 15, meeting_attended: 12, focus_time: 18 },
                activities_count: 45
            });
            setStreak({
                current_streak: 5,
                longest_streak: 12,
                last_active_date: new Date().toISOString().split('T')[0],
                streak_type: 'daily',
                multiplier: 1.1
            });
            setAchievements([
                { id: 'streak_3', title: 'On Fire! 🔥', description: '3-day productivity streak', earned: true, icon: '🔥' },
                { id: 'tasks_10', title: 'Task Crusher', description: 'Completed 10 tasks', earned: true, icon: '✅' },
                { id: 'inbox_zero_1', title: 'Inbox Zero Hero', description: 'Achieved Inbox Zero', earned: true, icon: '📭' },
                { id: 'focus_5', title: 'Deep Worker', description: '5 hours of focus time', earned: true, icon: '🎯' },
            ]);
            setComparison({
                this_week: { average_score: 78, total_score: 546, daily_scores: [] },
                last_week: { average_score: 72, total_score: 504, daily_scores: [] },
                change_percentage: 8.3,
                trend: 'up'
            });
            setTrends(generateMockTrends());
            setBreakdown({
                period: selectedPeriod,
                total_activities: 156,
                by_type: { task_completed: 45, email_processed: 67, meeting_attended: 12, focus_time: 8, message_sent: 24 },
                peak_hour: 10,
                peak_day: 'Tuesday',
                trend: 'up'
            });
        } catch (error) {
            console.error('Error fetching productivity data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const generateMockTrends = (): DailyScore[] => {
        const trends: DailyScore[] = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            trends.push({
                date: date.toISOString().split('T')[0],
                score: Math.floor(60 + Math.random() * 35),
                breakdown: {},
                activities_count: Math.floor(20 + Math.random() * 40)
            });
        }
        return trends;
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return 'from-emerald-500 to-teal-400';
        if (score >= 60) return 'from-amber-500 to-yellow-400';
        return 'from-red-500 to-orange-400';
    };

    const getTrendIcon = (trend: string) => {
        if (trend === 'up') return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
        if (trend === 'down') return <ArrowDownRight className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-slate-400" />;
    };

    const pieData = breakdown?.by_type
        ? Object.entries(breakdown.by_type).map(([key, value]) => ({
            name: ACTIVITY_LABELS[key] || key,
            value,
            color: ACTIVITY_COLORS[key] || '#6b7280',
        }))
        : [];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-indigo-400" />
                        Productivity Analytics
                    </h1>
                    <p className="text-slate-400 mt-1">Track your productivity and build winning habits</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Hero Card */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />

                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-300 mb-2">Today's Productivity Score</h2>
                            <div className="flex items-end gap-4">
                                <span className={`text-7xl font-bold bg-gradient-to-r ${getScoreGradient(dailyScore?.score || 0)} bg-clip-text text-transparent`}>
                                    {dailyScore?.score || 0}
                                </span>
                                <span className="text-2xl text-slate-400 mb-3">/100</span>
                            </div>

                            {comparison && (
                                <div className="flex items-center gap-2 mt-4">
                                    {getTrendIcon(comparison.trend)}
                                    <span className={comparison.trend === 'up' ? 'text-emerald-400' : comparison.trend === 'down' ? 'text-red-400' : 'text-slate-400'}>
                                        {comparison.change_percentage > 0 ? '+' : ''}{comparison.change_percentage}% vs last week
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Circular Progress */}
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-white/10"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="url(#scoreGradient)"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 70}
                                    strokeDashoffset={2 * Math.PI * 70 * (1 - (dailyScore?.score || 0) / 100)}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-indigo-400" />
                            </div>
                        </div>
                    </div>

                    {/* Activity Count */}
                    <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex items-center gap-8">
                        <div>
                            <span className="text-2xl font-bold">{dailyScore?.activities_count || 0}</span>
                            <span className="text-slate-400 ml-2">activities today</span>
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-indigo-400">{streak?.multiplier || 1}x</span>
                            <span className="text-slate-400 ml-2">streak multiplier</span>
                        </div>
                    </div>
                </div>

                {/* Streak Card */}
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-6 relative overflow-hidden">
                    <div className="absolute top-4 right-4">
                        <Flame className="w-16 h-16 text-orange-500/30" />
                    </div>

                    <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        Streak Tracker
                    </h2>

                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-6xl font-bold text-orange-400">{streak?.current_streak || 0}</span>
                        <span className="text-xl text-slate-400 mb-2">days</span>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Longest Streak</span>
                            <span className="text-white font-semibold">{streak?.longest_streak || 0} days</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Bonus Multiplier</span>
                            <span className="text-orange-400 font-semibold">{streak?.multiplier || 1}x</span>
                        </div>
                    </div>

                    {/* Streak Progress */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex gap-1">
                            {[...Array(7)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-2 rounded-full ${i < (streak?.current_streak || 0) % 7
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                        : 'bg-white/10'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            {7 - ((streak?.current_streak || 0) % 7)} days until next bonus level
                        </p>
                    </div>
                </div>

                {/* Trends Chart */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                        30-Day Productivity Trend
                    </h2>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="scoreGradientFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(v) => new Date(v).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #475569',
                                        borderRadius: '12px',
                                    }}
                                    labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    fill="url(#scoreGradientFill)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Breakdown */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-400" />
                            Activity Breakdown
                        </h2>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value as 'day' | 'week' | 'month')}
                            className="bg-white/10 border border-white/10 rounded-lg px-3 py-1 text-sm"
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
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
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
                                    <span className="text-slate-300">{item.name}</span>
                                </div>
                                <span className="text-white font-medium">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Weekly Comparison */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-400" />
                        Weekly Comparison
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4 text-center">
                            <p className="text-slate-400 text-sm mb-2">This Week</p>
                            <p className="text-3xl font-bold text-white">{comparison?.this_week.average_score || 0}</p>
                            <p className="text-slate-400 text-xs mt-1">avg score</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 text-center">
                            <p className="text-slate-400 text-sm mb-2">Last Week</p>
                            <p className="text-3xl font-bold text-slate-400">{comparison?.last_week.average_score || 0}</p>
                            <p className="text-slate-400 text-xs mt-1">avg score</p>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-300">Change</span>
                            <div className="flex items-center gap-2">
                                {comparison && getTrendIcon(comparison.trend)}
                                <span className={`text-lg font-bold ${(comparison?.change_percentage || 0) > 0 ? 'text-emerald-400' :
                                    (comparison?.change_percentage || 0) < 0 ? 'text-red-400' : 'text-slate-400'
                                    }`}>
                                    {(comparison?.change_percentage || 0) > 0 ? '+' : ''}{comparison?.change_percentage || 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {breakdown && (
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Peak Hour</span>
                                <span className="text-white">{breakdown.peak_hour}:00</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Most Productive Day</span>
                                <span className="text-white">{breakdown.peak_day}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Achievements */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        Achievements
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {achievements.map((achievement) => (
                            <div
                                key={achievement.id}
                                className={`p-4 rounded-xl text-center transition-all ${achievement.earned
                                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                                    : 'bg-white/5 border border-white/10 opacity-50'
                                    }`}
                            >
                                <span className="text-3xl">{achievement.icon}</span>
                                <h3 className="font-semibold mt-2 text-sm">{achievement.title}</h3>
                                <p className="text-xs text-slate-400 mt-1">{achievement.description}</p>
                            </div>
                        ))}

                        {/* Placeholder achievements */}
                        {achievements.length < 4 && [...Array(4 - achievements.length)].map((_, i) => (
                            <div
                                key={`placeholder-${i}`}
                                className="p-4 rounded-xl text-center bg-white/5 border border-white/10 opacity-30"
                            >
                                <span className="text-3xl">🔒</span>
                                <h3 className="font-semibold mt-2 text-sm">Locked</h3>
                                <p className="text-xs text-slate-400 mt-1">Keep going!</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Quick Stats
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-400">Emails Processed</p>
                                <p className="text-xl font-bold">{breakdown?.by_type?.email_processed || 0}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-400">Tasks Completed</p>
                                <p className="text-xl font-bold">{breakdown?.by_type?.task_completed || 0}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-400">Meetings Attended</p>
                                <p className="text-xl font-bold">{breakdown?.by_type?.meeting_attended || 0}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-pink-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-400">Focus Time (hrs)</p>
                                <p className="text-xl font-bold">{breakdown?.by_type?.focus_time || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
