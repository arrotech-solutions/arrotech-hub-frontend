import {
    BarChart3,
    Bot,
    Link,
    Zap,
    Sparkles,
    TrendingUp,
    Clock,
    AlertCircle,
    Server,
    Activity,
    ChevronRight,
    ArrowUpRight,
    XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [usage, setUsage] = useState<any>({
        connections: 0,
        workflows: 0,
        agents: 0,
        requests: 0
    });
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch connections count
                const connectionsRes = await apiService.getConnections();
                const connectionsCount = connectionsRes.data.length;

                // Update usage state
                setUsage({
                    connections: connectionsCount,
                    workflows: 12,
                    agents: 5,
                    requests: 1247
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.email]);

    // Stats data
    const stats = [
        {
            label: 'Active Connections',
            value: usage.connections,
            change: 12,
            icon: Link,
            color: 'bg-gradient-to-r from-blue-500 to-blue-600'
        },
        {
            label: 'Workflows',
            value: usage.workflows,
            change: 8,
            icon: Zap,
            color: 'bg-gradient-to-r from-purple-500 to-purple-600'
        },
        {
            label: 'AI Agents',
            value: usage.agents,
            change: 15,
            icon: Bot,
            color: 'bg-gradient-to-r from-green-500 to-green-600'
        },
        {
            label: 'API Requests',
            value: usage.requests.toLocaleString(),
            change: 23,
            icon: BarChart3,
            color: 'bg-gradient-to-r from-orange-500 to-orange-600'
        }
    ];

    // Quick actions data
    const quickActions = [
        {
            title: 'Create Workflow',
            description: 'Build automated workflows',
            icon: Zap,
            color: 'bg-gradient-to-r from-blue-500 to-purple-600',
            onClick: () => navigate('/workflows')
        },
        {
            title: 'Add Connection',
            description: 'Connect new services',
            icon: Link,
            color: 'bg-gradient-to-r from-green-500 to-emerald-600',
            onClick: () => navigate('/connections')
        },
        {
            title: 'Browse MCP Tools',
            description: 'Run tools from your connections',
            icon: Zap,
            color: 'bg-gradient-to-r from-emerald-500 to-teal-600',
            onClick: () => navigate('/mcp-tools')
        },
        {
            title: 'Manage Agents',
            description: 'View and control your agents',
            icon: Bot,
            color: 'bg-gradient-to-r from-purple-500 to-pink-600',
            onClick: () => navigate('/agents')
        }
    ];

    // Recent activity data
    const recentActivity = [
        {
            title: 'Workflow "Email Automation"',
            desc: 'Executed successfully in nodes: 5',
            time: '2m ago',
            icon: Zap,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Slack Connection',
            desc: 'New service linkage established',
            time: '15m ago',
            icon: Link,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100'
        },
        {
            title: 'Agent "Support Node"',
            desc: 'Neural path activation confirmed',
            time: '1h ago',
            icon: Bot,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            title: 'MCP: send_email',
            desc: 'Tool execution payload delivery',
            time: '3h ago',
            icon: Activity,
            color: 'text-teal-600',
            bgColor: 'bg-teal-100'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
                {/* Header with Mesh Gradient */}
                <div className="relative overflow-hidden bg-white rounded-[32px] border border-gray-200 shadow-sm mb-10 group dashboard-header">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse group-hover:bg-blue-400/30 transition-colors duration-1000"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl animate-pulse group-hover:bg-orange-400/30 transition-colors duration-1000" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_white_100%)] opacity-50"></div>

                    <div className="relative px-8 py-12 md:px-12 md:py-16">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-4 animate-fade-in">
                                    <div className="p-2 bg-blue-100/80 rounded-xl">
                                        <Sparkles className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Operational Nexus</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                                    Welcome back, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.name || 'Commander'}</span> 👋
                                </h1>
                                <p className="text-gray-500 max-w-xl font-medium text-lg leading-relaxed">
                                    Your autonomous infrastructure is performing optimally. Here is your real-time telemetry and command center.
                                </p>
                            </div>
                            <div className="shrink-0">
                                <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-6">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Last Payload</p>
                                        <p className="text-xl font-black text-gray-900 tabular-nums">
                                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 text-gray-400 overflow-hidden">
                                        <Clock className="w-6 h-6 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subscription Alerts - Integrated */}
                        {user?.subscription_status === 'grace_period' && (
                            <div className="mt-10 bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-[24px] p-6 animate-in slide-in-from-top-4 duration-500 group/alert">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="bg-amber-100 p-3 rounded-2xl">
                                            <AlertCircle className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-amber-900 uppercase tracking-tight">Access Protocol Warning</h3>
                                            <p className="text-amber-700 font-medium">Subscription grace period active. 7 days remaining to restore full throughput.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/payments')}
                                        className="flex items-center space-x-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-sm transition-all group-hover/alert:translate-x-1"
                                    >
                                        <span>Restore Access</span>
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {user?.subscription_status === 'expired' && (
                            <div className="mt-10 bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-[24px] p-6 animate-in slide-in-from-top-4 duration-500 group/alert">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="bg-rose-100 p-3 rounded-2xl">
                                            <XCircle className="w-6 h-6 text-rose-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-rose-900 uppercase tracking-tight">System Degradation</h3>
                                            <p className="text-rose-700 font-medium">Subscription expired. Account running on limited Lite resources.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/payments')}
                                        className="flex items-center space-x-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm transition-all group-hover/alert:translate-x-1"
                                    >
                                        <span>Upgrade Now</span>
                                        <Zap className="w-4 h-4 fill-white" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid - Glassmorphism */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 stats-overview">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className="relative bg-white/60 backdrop-blur-xl rounded-[32px] border border-white p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 -mr-10 -mt-10 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${stat.color}`}></div>
                                <div className="flex flex-col">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/50 bg-white group-hover:scale-110 transition-transform duration-500`}>
                                        <Icon className={`w-6 h-6 ${stat.color.replace('bg-gradient-to-r from-', 'text-').split(' ')[0]}`} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{stat.label}</p>
                                    <div className="flex items-baseline space-x-2">
                                        <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                                        <div className={`flex items-center text-xs font-black ${stat.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            <TrendingUp className={`w-3 h-3 mr-1 ${stat.change < 0 ? 'rotate-180' : ''}`} />
                                            <span>{Math.abs(stat.change)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Activity Feed & Quick Actions */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Quick Actions - Design Overhaul */}
                        <section className="quick-actions">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-1 bgColor bg-indigo-100 rounded-lg">
                                    <Zap className="w-4 h-4 text-indigo-600" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Active Commands</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={action.onClick}
                                        className="group relative flex items-center space-x-4 p-6 bg-white/40 backdrop-blur-md rounded-[28px] border border-white/60 hover:bg-white/80 hover:shadow-lg hover:border-white transition-all duration-300 text-left"
                                    >
                                        <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                            <action.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 tracking-tight text-lg">{action.title}</h3>
                                            <p className="text-sm text-gray-500 font-medium">{action.description}</p>
                                        </div>
                                        <div className="absolute right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Recent Activity - Telemetry Style */}
                        <section className="bg-white/60 backdrop-blur-xl rounded-[40px] border border-white p-8 recent-activity">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-3">
                                    <div className="p-1 bg-blue-100 rounded-lg">
                                        <Activity className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Live Telemetry</h2>
                                </div>
                                <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline" onClick={() => navigate('/activity')}>
                                    Full Audit Log
                                </button>
                            </div>
                            <div className="space-y-6">
                                {recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-start space-x-5 group/item">
                                        <div className={`p-4 rounded-3xl ${activity.bgColor} ${activity.color} group-hover/item:scale-110 transition-transform duration-300`}>
                                            <activity.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 py-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-black text-gray-900 tracking-tight">{activity.title}</p>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activity.time}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium">{activity.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar: System Status & Resources */}
                    <div className="space-y-10">
                        <section className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                            <div className="relative">
                                <div className="flex items-center space-x-3 mb-8">
                                    <div className="p-1 bg-white/10 rounded-lg">
                                        <Server className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">Core Engine</h2>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm font-black tracking-tight text-gray-300">API Gateway</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg">Active</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm font-black tracking-tight text-gray-300">Vault Security</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg">Locked</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Storage Cluster</span>
                                            <span className="text-sm font-black text-gray-300">2.4 / 10 GB</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden p-0.5">
                                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" style={{ width: '24%' }}></div>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full mt-10 py-4 bg-white/10 hover:bg-white text-white hover:text-gray-900 rounded-2xl border border-white/10 transition-all font-black text-xs uppercase tracking-widest">
                                    System Diagnostics
                                </button>
                            </div>
                        </section>

                        {/* Node Analytics Mini-Card */}
                        <section className="bg-white/60 backdrop-blur-xl rounded-[40px] border border-white p-8">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-1 bg-orange-100 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-orange-600" />
                                </div>
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Throughput</h2>
                            </div>
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="h-16 w-full bg-gray-50 rounded-2xl flex items-end justify-between p-2 gap-1 overflow-hidden">
                                    {[40, 70, 45, 90, 65, 80, 50, 85, 95, 60].map((h, i) => (
                                        <div key={i} className="w-full bg-blue-100 rounded-sm group-hover:bg-blue-200 transition-colors" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs font-medium text-gray-500 text-center">Average response time: <span className="text-gray-900 font-black">124ms</span></p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;