import {
  Activity as ActivityIcon,
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  CreditCard,
  Database,
  Filter,
  Grid,
  HardDrive,
  Info,
  List,
  Network,
  RefreshCw,
  Search,
  Server,
  Shield,
  Timer,
  Users,
  Workflow,
  Sparkles
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from '../lib/notify';
import { Spinner } from '../components/ui';
import apiService from '../services/api';

interface ActivityItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  category: 'system' | 'user' | 'workflow' | 'agent' | 'connection' | 'payment' | 'security';
  title: string;
  description: string;
  timestamp: string;
  duration?: number;
  user?: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_usage: number;
  active_connections: number;
  total_requests: number;
  error_rate: number;
  response_time: number;
}

interface ActivityStats {
  total_activities: number;
  successful_activities: number;
  failed_activities: number;
  pending_activities: number;
  average_duration: number;
  top_categories: Array<{ category: string; count: number }>;
  recent_trends: Array<{ date: string; count: number }>;
}

const Activity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'timeline'>('list');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshInterval = 30; // seconds

  useEffect(() => {
    loadActivityData();
    if (autoRefresh) {
      const interval = setInterval(loadActivityData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    let filtered = activities;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(activity => activity.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(activity => activity.status === selectedStatus);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(activity => activity.priority === selectedPriority);
    }

    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.user?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  }, [activities, selectedCategory, selectedStatus, selectedPriority, searchTerm]);

  const handleRefresh = () => {
    loadActivityData();
  };

  const loadActivityData = async () => {
    try {
      setLoading(true);

      // Fetch real activity feed items from the backend
      let activityItems: ActivityItem[] = [];
      try {
        const feedRes = await apiService.request({ method: 'GET', url: '/creators/me/activity-feed', params: { limit: 50 } });
        const feedData = feedRes.data?.data || [];
        activityItems = feedData.map((item: any, idx: number) => ({
          id: String(item.id || idx),
          type: item.activity_type?.includes('fail') || item.activity_type?.includes('error') ? 'error'
            : item.activity_type?.includes('warn') ? 'warning'
              : item.activity_type?.includes('info') || item.activity_type?.includes('view') ? 'info'
                : 'success' as 'success' | 'error' | 'warning' | 'info',
          category: item.workflow_id ? 'workflow'
            : item.activity_type?.includes('payment') ? 'payment'
              : item.activity_type?.includes('security') || item.activity_type?.includes('login') ? 'security'
                : item.activity_type?.includes('agent') ? 'agent'
                  : item.activity_type?.includes('connection') ? 'connection'
                    : 'system' as ActivityItem['category'],
          title: item.title || item.activity_type || 'Activity',
          description: item.description || '',
          timestamp: item.created_at || new Date().toISOString(),
          duration: item.metadata?.duration,
          user: item.actor_name || undefined,
          status: item.metadata?.status || 'completed' as ActivityItem['status'],
          priority: item.metadata?.priority || 'medium' as ActivityItem['priority'],
          metadata: item.metadata || undefined,
        }));
      } catch (e) {
        console.warn('Activity feed not available:', e);
      }

      // Fetch usage stats for metrics
      let usageData: any = null;
      try {
        const usageRes = await apiService.request({ method: 'GET', url: '/subscription/usage' });
        usageData = usageRes.data?.data;
      } catch (e) {
        console.warn('Usage stats not available:', e);
      }

      // Build system metrics from real usage data
      if (usageData?.usage) {
        const usage = usageData.usage;
        setSystemMetrics({
          cpu_usage: usage.ai_actions?.percentage || 0,
          memory_usage: usage.automation_runs?.percentage || 0,
          disk_usage: usage.connections || 0,
          network_usage: usage.active_workflows || 0,
          active_connections: usage.connections || 0,
          total_requests: (usage.ai_actions?.used || 0) + (usage.automation_runs?.used || 0),
          error_rate: 0,
          response_time: 0
        });
      }

      // Build stats from real usage data
      if (usageData?.usage) {
        const usage = usageData.usage;
        const totalUsed = (usage.ai_actions?.used || 0) + (usage.automation_runs?.used || 0);
        setStats({
          total_activities: totalUsed,
          successful_activities: totalUsed,
          failed_activities: 0,
          pending_activities: 0,
          average_duration: 0,
          top_categories: [
            { category: 'AI Actions', count: usage.ai_actions?.used || 0 },
            { category: 'Automations', count: usage.automation_runs?.used || 0 },
            { category: 'Workflows', count: usage.active_workflows || 0 },
            { category: 'Connections', count: usage.connections || 0 },
          ],
          recent_trends: []
        });
      }

      setActivities(activityItems);
    } catch (error) {
      console.error('Error loading activity data:', error);
      toast.error('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'info': return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default: return <ActivityIcon className="w-4 h-4 text-gray-600 dark:text-slate-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workflow': return <Workflow className="w-4 h-4" />;
      case 'agent': return <Bot className="w-4 h-4" />;
      case 'connection': return <Database className="w-4 h-4" />;
      case 'system': return <Server className="w-4 h-4" />;
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      default: return <ActivityIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/50';
      case 'running': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'failed': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50';
      default: return 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 border-gray-200 dark:border-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50';
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/50';
      default: return 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 border-gray-200 dark:border-slate-700';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const toggleExpandedItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const renderActivityCard = (activity: ActivityItem) => (
    <div key={activity.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500/50 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-900 rounded-lg shadow-sm">
              {getCategoryIcon(activity.category)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {activity.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 transition-colors">{activity.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getTypeIcon(activity.type)}
            <button
              onClick={() => toggleExpandedItem(activity.id)}
              className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              {expandedItems.has(activity.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex items-center space-x-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
            {activity.status}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
            {activity.priority}
          </span>
          {activity.duration && (
            <span className="flex items-center space-x-1 text-xs text-gray-500">
              <Timer className="w-3 h-3" />
              <span>{formatDuration(activity.duration)}</span>
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 transition-colors">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(activity.timestamp)}</span>
            </span>
            {activity.user && (
              <span className="flex items-center space-x-1 transition-colors">
                <Users className="w-3 h-3" />
                <span>{activity.user}</span>
              </span>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {expandedItems.has(activity.id) && activity.metadata && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50 transition-colors">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors">Details</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(activity.metadata).map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="font-medium text-gray-700 dark:text-slate-300 capitalize transition-colors">{key.replace(/_/g, ' ')}:</span>
                  <span className="ml-1 text-gray-600 dark:text-slate-400 transition-colors">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Spinner size="xl" className="mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-400 transition-colors">Loading activity data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        {/* Header with Mesh Gradient */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700/50 shadow-sm mb-8 transition-colors">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

          <div className="relative px-8 py-10 activity-header">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3">
                  <div className="p-1.5 bg-blue-100/80 dark:bg-blue-900/30 rounded-lg transition-colors">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider transition-colors">System Telemetry</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight transition-colors">
                  Activity <span className="bg-gradient-to-r from-primary-500 to-secondary-800 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">Monitor</span>
                </h1>
                <p className="text-gray-500 dark:text-slate-400 max-w-md font-medium mx-auto sm:mx-0 transition-colors">
                  Track system performance, audit logs, and workflow executions in real-time.
                </p>
              </div>
              <div className="flex flex-col xs:flex-row items-center justify-center sm:justify-end gap-4">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-4 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200 shadow-sm group disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                  <span className="font-bold">Refresh</span>
                </button>
                <label className="flex items-center space-x-3 px-4 py-2 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-5 h-5 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-blue-500 focus:ring-offset-0 transition-colors"
                  />
                  <span className="text-sm font-bold text-gray-600 dark:text-slate-400 whitespace-nowrap transition-colors">Auto refresh</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* System Metrics - Glassmorphism */}
        <div className="system-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'AI Actions Limit', value: systemMetrics ? `${systemMetrics.cpu_usage}%` : '0%', icon: Cpu, color: 'blue', bgColor: 'bg-blue-500', progress: systemMetrics?.cpu_usage || 0 },
            { label: 'Automations Limit', value: systemMetrics ? `${systemMetrics.memory_usage}%` : '0%', icon: HardDrive, color: 'emerald', bgColor: 'bg-emerald-500', progress: systemMetrics?.memory_usage || 0 },
            { label: 'Connections', value: systemMetrics?.disk_usage || 0, icon: Network, color: 'purple', bgColor: 'bg-purple-500', progress: 100 },
            { label: 'Active Workflows', value: systemMetrics?.network_usage || 0, icon: Workflow, color: 'indigo', bgColor: 'bg-indigo-500', progress: 100 }
          ].map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="relative group overflow-hidden bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-500">
                <div className={`absolute top-0 right-0 w-24 h-24 ${metric.bgColor}/10 dark:${metric.bgColor}/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:blur-3xl transition-all duration-500`}></div>
                <div className="relative flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">{metric.label}</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 group-hover:scale-110 transition-all duration-500 group-hover:shadow-md ${metric.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    metric.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                      metric.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                        'text-red-600 dark:text-red-400'
                    }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="relative w-full bg-gray-200/50 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden transition-colors">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-1000 ${metric.color === 'blue' ? 'bg-blue-600' :
                      metric.color === 'emerald' ? 'bg-emerald-600' :
                        metric.color === 'purple' ? 'bg-purple-600' :
                          'bg-red-600'
                      }`}
                    style={{ width: `${metric.progress}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity Stats - Glassmorphism */}
        <div className="activity-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Logs', value: stats?.total_activities || 0, icon: Database, color: 'blue', bgColor: 'bg-blue-500' },
            { label: 'Successful', value: stats?.successful_activities || 0, icon: CheckCircle, color: 'emerald', bgColor: 'bg-emerald-500' },
            { label: 'Failed Ops', value: stats?.failed_activities || 0, icon: AlertCircle, color: 'red', bgColor: 'bg-red-500' },
            { label: 'Avg Latency', value: `${stats?.average_duration || 0}ms`, icon: Timer, color: 'indigo', bgColor: 'bg-indigo-500' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="relative group overflow-hidden bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-500">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgColor}/10 dark:${stat.bgColor}/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:blur-3xl transition-all duration-500`}></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 group-hover:scale-110 transition-all duration-500 group-hover:shadow-md ${stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                      stat.color === 'red' ? 'text-red-600 dark:text-red-400' :
                        'text-indigo-600 dark:text-indigo-400'
                    }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="activity-filters bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700/50 p-4 sm:p-6 mb-6 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex items-center bg-gray-50 dark:bg-slate-900 rounded-lg p-1 border border-gray-200 dark:border-slate-700 transition-colors">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                  >
                    <Clock className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700/50 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent transition-colors"
                >
                  <option value="all">All Categories</option>
                  <option value="workflow">Workflow</option>
                  <option value="agent">Agent</option>
                  <option value="connection">Connection</option>
                  <option value="system">System</option>
                  <option value="payment">Payment</option>
                  <option value="security">Security</option>
                  <option value="user">User</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="running">Running</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent transition-colors"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Activities List */}
        <div className="activity-list space-y-6">
          {filteredActivities.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredActivities.map(renderActivityCard)}
            </div>
          ) : (
            <div className="text-center py-16 activity-list-empty transition-all duration-500">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                <ActivityIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">No activities found</h3>
              <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto transition-colors">
                {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all'
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'No activities have been recorded yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Activity; 