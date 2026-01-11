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
import toast from 'react-hot-toast';

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
      // Mock data for demonstration - replace with actual API calls
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'success',
          category: 'workflow',
          title: 'Workflow "Email Campaign" completed successfully',
          description: 'Automated email campaign sent to 1,250 subscribers with 98.5% delivery rate',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          duration: 45,
          user: 'john.doe@company.com',
          status: 'completed',
          priority: 'high',
          metadata: { subscribers: 1250, delivery_rate: 98.5, open_rate: 23.4 }
        },
        {
          id: '2',
          type: 'error',
          category: 'connection',
          title: 'HubSpot connection failed',
          description: 'Failed to sync contacts from HubSpot due to authentication error',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          duration: 120,
          user: 'system',
          status: 'failed',
          priority: 'critical',
          metadata: { error_code: 'AUTH_401', retry_count: 3 }
        },
        {
          id: '3',
          type: 'warning',
          category: 'system',
          title: 'High memory usage detected',
          description: 'System memory usage reached 85% - consider optimizing resource allocation',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          duration: 300,
          user: 'system',
          status: 'running',
          priority: 'medium',
          metadata: { memory_usage: 85, cpu_usage: 67, disk_usage: 45 }
        },
        {
          id: '4',
          type: 'info',
          category: 'agent',
          title: 'AI Agent "Data Analyzer" started',
          description: 'Agent initiated to analyze customer behavior patterns and generate insights',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          duration: 180,
          user: 'alice.smith@company.com',
          status: 'running',
          priority: 'high',
          metadata: { data_points: 15420, analysis_type: 'behavior_patterns' }
        },
        {
          id: '5',
          type: 'success',
          category: 'payment',
          title: 'Payment processed successfully',
          description: 'Monthly subscription payment of $99.00 processed for Premium Plan',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          duration: 5,
          user: 'billing@company.com',
          status: 'completed',
          priority: 'medium',
          metadata: { amount: 99.00, currency: 'USD', plan: 'Premium' }
        },
        {
          id: '6',
          type: 'info',
          category: 'security',
          title: 'User login from new device',
          description: 'Successful login from IP 192.168.1.100 - device verified',
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          duration: 2,
          user: 'john.doe@company.com',
          status: 'completed',
          priority: 'low',
          metadata: { ip_address: '192.168.1.100', device_type: 'desktop', location: 'New York' }
        },
        {
          id: '7',
          type: 'success',
          category: 'connection',
          title: 'Salesforce sync completed',
          description: 'Successfully synced 2,450 contacts and 156 opportunities from Salesforce',
          timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
          duration: 90,
          user: 'system',
          status: 'completed',
          priority: 'high',
          metadata: { contacts: 2450, opportunities: 156, sync_time: 90 }
        },
        {
          id: '8',
          type: 'warning',
          category: 'system',
          title: 'API rate limit approaching',
          description: 'Current API usage at 85% of limit - consider upgrading plan',
          timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
          duration: 60,
          user: 'system',
          status: 'pending',
          priority: 'medium',
          metadata: { current_usage: 8500, limit: 10000, reset_time: '2024-01-15T00:00:00Z' }
        }
      ];

      const mockSystemMetrics: SystemMetrics = {
        cpu_usage: 67,
        memory_usage: 85,
        disk_usage: 45,
        network_usage: 23,
        active_connections: 12,
        total_requests: 15420,
        error_rate: 2.3,
        response_time: 145
      };

      const mockStats: ActivityStats = {
        total_activities: 15420,
        successful_activities: 14850,
        failed_activities: 320,
        pending_activities: 250,
        average_duration: 45,
        top_categories: [
          { category: 'workflow', count: 5200 },
          { category: 'connection', count: 3800 },
          { category: 'system', count: 2900 },
          { category: 'agent', count: 2100 },
          { category: 'payment', count: 1420 }
        ],
        recent_trends: [
          { date: '2024-01-10', count: 1250 },
          { date: '2024-01-11', count: 1380 },
          { date: '2024-01-12', count: 1420 },
          { date: '2024-01-13', count: 1560 },
          { date: '2024-01-14', count: 1620 }
        ]
      };

      setActivities(mockActivities);
      setSystemMetrics(mockSystemMetrics);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading activity data:', error);
      toast.error('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <Info className="w-4 h-4 text-blue-600" />;
      default: return <ActivityIcon className="w-4 h-4 text-gray-600" />;
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
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              {getCategoryIcon(activity.category)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {activity.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getTypeIcon(activity.type)}
            <button
              onClick={() => toggleExpandedItem(activity.id)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(activity.timestamp)}</span>
            </span>
            {activity.user && (
              <span className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{activity.user}</span>
              </span>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {expandedItems.has(activity.id) && activity.metadata && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(activity.metadata).map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="ml-1 text-gray-600">{String(value)}</span>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading activity data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        {/* Header with Mesh Gradient */}
        <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-200 shadow-sm mb-8">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

          <div className="relative px-8 py-10 activity-header">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3">
                  <div className="p-1.5 bg-blue-100/80 rounded-lg">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">System Telemetry</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">
                  Activity <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Monitor</span>
                </h1>
                <p className="text-gray-500 max-w-md font-medium mx-auto sm:mx-0">
                  Track system performance, audit logs, and workflow executions in real-time.
                </p>
              </div>
              <div className="flex flex-col xs:flex-row items-center justify-center sm:justify-end gap-4">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-4 bg-white text-gray-700 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm group disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                  <span className="font-bold">Refresh</span>
                </button>
                <label className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-sm font-bold text-gray-600 whitespace-nowrap">Auto refresh</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* System Metrics - Glassmorphism */}
        <div className="system-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'CPU Usage', value: systemMetrics ? `${systemMetrics.cpu_usage}%` : '0%', icon: Cpu, color: 'blue', bgColor: 'bg-blue-500', progress: systemMetrics?.cpu_usage || 0 },
            { label: 'Memory Usage', value: systemMetrics ? `${systemMetrics.memory_usage}%` : '0%', icon: HardDrive, color: 'emerald', bgColor: 'bg-emerald-500', progress: systemMetrics?.memory_usage || 0 },
            { label: 'Network Load', value: systemMetrics ? `${systemMetrics.network_usage}%` : '0%', icon: Network, color: 'purple', bgColor: 'bg-purple-500', progress: systemMetrics?.network_usage || 0 },
            { label: 'Error Rate', value: systemMetrics ? `${systemMetrics.error_rate}%` : '0%', icon: AlertTriangle, color: 'red', bgColor: 'bg-red-500', progress: systemMetrics?.error_rate || 0 }
          ].map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="relative group overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-500">
                <div className={`absolute top-0 right-0 w-24 h-24 ${metric.bgColor}/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:blur-3xl transition-all duration-500`}></div>
                <div className="relative flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{metric.label}</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-md ${metric.color === 'blue' ? 'text-blue-600' :
                    metric.color === 'emerald' ? 'text-emerald-600' :
                      metric.color === 'purple' ? 'text-purple-600' :
                        'text-red-600'
                    }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="relative w-full bg-gray-200/50 rounded-full h-1.5 overflow-hidden">
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
              <div key={idx} className="relative group overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-500">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgColor}/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:blur-3xl transition-all duration-500`}></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-md ${stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'emerald' ? 'text-emerald-600' :
                      stat.color === 'red' ? 'text-red-600' :
                        'text-indigo-600'
                    }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="activity-filters bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Clock className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="text-center py-16 activity-list-empty">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <ActivityIcon className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
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