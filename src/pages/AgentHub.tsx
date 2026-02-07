import { useState, useEffect, useCallback } from 'react';
import {
    Bot,
    Play,
    Settings,
    Clock,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Zap,
    Calendar,
    ChevronDown,
    ChevronUp,
    Activity,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Agent {
    id: string;
    name: string;
    description: string;
    icon: string;
    status: 'active' | 'paused' | 'error' | 'inactive';
    lastRun: string | null;
    nextRun: string | null;
    runCount: number;
    successRate: number;
    config: AgentConfig;
}

interface AgentConfig {
    enabled: boolean;
    schedule?: string;
    notificationChannel?: 'email' | 'slack' | 'both';
    [key: string]: unknown;
}

interface AgentRun {
    id: string;
    timestamp: string;
    status: 'success' | 'error';
    summary: string;
    duration: number;
}

// Default agents for Phase 5
const DEFAULT_AGENTS: Agent[] = [
    {
        id: 'meeting_prep',
        name: 'Meeting Prep Agent',
        description: 'Prepares comprehensive briefing materials before your meetings',
        icon: '📋',
        status: 'active',
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        runCount: 156,
        successRate: 98.5,
        config: {
            enabled: true,
            schedule: '30 minutes before meetings',
            notificationChannel: 'both',
            prep_time_minutes: 30,
            include_email_context: true,
            include_slack_context: true,
        },
    },
    {
        id: 'follow_up',
        name: 'Follow-Up Agent',
        description: 'Tracks your commitments and reminds you to follow up',
        icon: '🔔',
        status: 'active',
        lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        runCount: 89,
        successRate: 100,
        config: {
            enabled: true,
            schedule: 'Daily at 9:00 AM',
            notificationChannel: 'email',
            reminder_delay_hours: 24,
            max_reminders: 3,
        },
    },
    {
        id: 'deadline_guardian',
        name: 'Deadline Guardian',
        description: 'Watches your tasks and warns you before deadlines slip',
        icon: '⏰',
        status: 'active',
        lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        runCount: 234,
        successRate: 99.1,
        config: {
            enabled: true,
            schedule: 'Every 3 hours',
            notificationChannel: 'slack',
            warning_thresholds: [24, 48, 72],
            scan_jira: true,
            scan_trello: true,
            scan_asana: true,
        },
    },
    {
        id: 'inbox_zero_coach',
        name: 'Inbox Zero Coach',
        description: 'Your personal coach for achieving and maintaining Inbox Zero',
        icon: '📭',
        status: 'paused',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        nextRun: null,
        runCount: 45,
        successRate: 95.5,
        config: {
            enabled: false,
            schedule: 'Hourly during work hours',
            notificationChannel: 'slack',
            stale_email_days: 3,
            work_hours_start: 9,
            work_hours_end: 18,
        },
    },
    {
        id: 'weekly_digest',
        name: 'Weekly Digest',
        description: 'Delivers a comprehensive weekly productivity summary every Friday',
        icon: '📊',
        status: 'active',
        lastRun: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: getNextFriday().toISOString(),
        runCount: 12,
        successRate: 100,
        config: {
            enabled: true,
            schedule: 'Every Friday at 5:00 PM',
            notificationChannel: 'email',
            include_comparison: true,
            include_patterns: true,
            include_ai_insights: true,
        },
    },
];

function getNextFriday(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    nextFriday.setHours(17, 0, 0, 0);
    return nextFriday;
}

function getStatusBadge(status: Agent['status']): React.ReactNode {
    const statusConfig = {
        active: { color: 'bg-emerald-500', pulse: true, label: 'Active' },
        paused: { color: 'bg-slate-500', pulse: false, label: 'Paused' },
        error: { color: 'bg-red-500', pulse: true, label: 'Error' },
        inactive: { color: 'bg-slate-600', pulse: false, label: 'Inactive' },
    };

    const config = statusConfig[status];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
            status === 'paused' ? 'bg-slate-500/20 text-slate-400' :
                status === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-600/20 text-slate-500'
            }`}>
            <span className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
            {config.label}
        </span>
    );
}

function formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return 'Never';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
        // Future date
        const futureMins = Math.abs(diffMins);
        const futureHours = Math.abs(diffHours);
        const futureDays = Math.abs(diffDays);

        if (futureMins < 60) return `in ${futureMins}m`;
        if (futureHours < 24) return `in ${futureHours}h`;
        return `in ${futureDays}d`;
    }

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

export default function AgentHub() {
    const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
    const [loading, setLoading] = useState(false);
    const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
    const [runningAgent, setRunningAgent] = useState<string | null>(null);
    const [recentRuns, setRecentRuns] = useState<Record<string, AgentRun[]>>({});

    const fetchAgents = useCallback(async () => {
        try {
            setLoading(true);
            // In production, fetch from API
            // const response = await apiService.get('/agents');
            // setAgents(response.data.agents);

            // For now, use default agents
            setAgents(DEFAULT_AGENTS);
        } catch (error) {
            console.error('Error fetching agents:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const toggleAgent = async (agentId: string) => {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) return;

        const newEnabled = !agent.config.enabled;

        try {
            // Update local state optimistically
            setAgents(prev => prev.map(a =>
                a.id === agentId
                    ? {
                        ...a,
                        status: newEnabled ? 'active' : 'paused',
                        config: { ...a.config, enabled: newEnabled }
                    }
                    : a
            ));

            // In production, persist to backend
            // await apiService.patch(`/agents/${agentId}`, { enabled: newEnabled });

            toast.success(`${agent.name} ${newEnabled ? 'enabled' : 'paused'}`);
        } catch (error) {
            // Revert on error
            setAgents(prev => prev.map(a =>
                a.id === agentId ? agent : a
            ));
            toast.error('Failed to update agent status');
        }
    };

    const runAgentNow = async (agentId: string) => {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) return;

        try {
            setRunningAgent(agentId);
            toast.loading(`Running ${agent.name}...`, { id: 'agent-run' });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // In production:
            // await apiService.post(`/agents/${agentId}/execute`);

            // Update last run time
            setAgents(prev => prev.map(a =>
                a.id === agentId
                    ? { ...a, lastRun: new Date().toISOString(), runCount: a.runCount + 1 }
                    : a
            ));

            // Add to recent runs
            const newRun: AgentRun = {
                id: `run-${Date.now()}`,
                timestamp: new Date().toISOString(),
                status: 'success',
                summary: 'Completed successfully',
                duration: 2.3,
            };

            setRecentRuns(prev => ({
                ...prev,
                [agentId]: [newRun, ...(prev[agentId] || [])].slice(0, 5)
            }));

            toast.success(`${agent.name} completed!`, { id: 'agent-run' });
        } catch (error) {
            toast.error('Failed to run agent', { id: 'agent-run' });
        } finally {
            setRunningAgent(null);
        }
    };

    const toggleExpanded = (agentId: string) => {
        setExpandedAgent(prev => prev === agentId ? null : agentId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Bot className="w-8 h-8 text-indigo-400" />
                        Agent Hub
                    </h1>
                    <p className="text-slate-400 mt-1">Manage your autonomous productivity agents</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAgents}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{agents.length}</p>
                            <p className="text-xs text-slate-400">Total Agents</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{agents.filter(a => a.status === 'active').length}</p>
                            <p className="text-xs text-slate-400">Active</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{agents.reduce((sum, a) => sum + a.runCount, 0)}</p>
                            <p className="text-xs text-slate-400">Total Runs</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {(agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length).toFixed(1)}%
                            </p>
                            <p className="text-xs text-slate-400">Avg Success</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agents Grid */}
            <div className="space-y-4">
                {agents.map((agent) => (
                    <div
                        key={agent.id}
                        className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-white/20"
                    >
                        {/* Main Row */}
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                {/* Agent Info */}
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${agent.status === 'active'
                                        ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/40'
                                        : 'bg-white/10 border border-white/10'
                                        }`}>
                                        <span>{agent.icon}</span>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold">{agent.name}</h3>
                                            {getStatusBadge(agent.status)}
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">{agent.description}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    {/* Toggle */}
                                    <button
                                        onClick={() => toggleAgent(agent.id)}
                                        className={`p-2 rounded-lg transition-colors ${agent.config.enabled
                                            ? 'text-emerald-400 hover:bg-emerald-500/20'
                                            : 'text-slate-400 hover:bg-white/10'
                                            }`}
                                        title={agent.config.enabled ? 'Pause agent' : 'Enable agent'}
                                    >
                                        {agent.config.enabled ? (
                                            <ToggleRight className="w-8 h-8" />
                                        ) : (
                                            <ToggleLeft className="w-8 h-8" />
                                        )}
                                    </button>

                                    {/* Run Now */}
                                    <button
                                        onClick={() => runAgentNow(agent.id)}
                                        disabled={runningAgent === agent.id || !agent.config.enabled}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed rounded-xl transition-all"
                                    >
                                        {runningAgent === agent.id ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Running...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4" />
                                                Run Now
                                            </>
                                        )}
                                    </button>

                                    {/* Expand */}
                                    <button
                                        onClick={() => toggleExpanded(agent.id)}
                                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        {expandedAgent === agent.id ? (
                                            <ChevronUp className="w-5 h-5" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10 text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-400">Last run:</span>
                                    <span className="text-white">{formatRelativeTime(agent.lastRun)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-400">Next run:</span>
                                    <span className="text-white">{formatRelativeTime(agent.nextRun)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-400">Total runs:</span>
                                    <span className="text-white">{agent.runCount}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-400">Success rate:</span>
                                    <span className={agent.successRate >= 95 ? 'text-emerald-400' : 'text-amber-400'}>
                                        {agent.successRate}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Section */}
                        {expandedAgent === agent.id && (
                            <div className="px-6 pb-6 border-t border-white/10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {/* Configuration */}
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <Settings className="w-4 h-4" />
                                            Configuration
                                        </h4>

                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Schedule</span>
                                                <span className="text-white">{agent.config.schedule || 'Not set'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Notifications</span>
                                                <span className="text-white capitalize">{agent.config.notificationChannel || 'None'}</span>
                                            </div>
                                            {Object.entries(agent.config)
                                                .filter(([key]) => !['enabled', 'schedule', 'notificationChannel'].includes(key))
                                                .slice(0, 3)
                                                .map(([key, value]) => (
                                                    <div key={key} className="flex justify-between">
                                                        <span className="text-slate-400">
                                                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </span>
                                                        <span className="text-white">
                                                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                                        </span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>

                                    {/* Recent Runs */}
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <Activity className="w-4 h-4" />
                                            Recent Runs
                                        </h4>

                                        {(recentRuns[agent.id] || []).length > 0 ? (
                                            <div className="space-y-2">
                                                {(recentRuns[agent.id] || []).map((run) => (
                                                    <div
                                                        key={run.id}
                                                        className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {run.status === 'success' ? (
                                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                            ) : (
                                                                <AlertCircle className="w-4 h-4 text-red-400" />
                                                            )}
                                                            <span className="text-slate-300">{run.summary}</span>
                                                        </div>
                                                        <span className="text-slate-500 text-xs">
                                                            {formatRelativeTime(run.timestamp)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 text-sm">No recent runs available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {agents.length === 0 && !loading && (
                <div className="text-center py-16">
                    <Bot className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Agents Configured</h3>
                    <p className="text-slate-400 mb-6">Set up autonomous agents to automate your productivity workflows.</p>
                </div>
            )}
        </div>
    );
}
