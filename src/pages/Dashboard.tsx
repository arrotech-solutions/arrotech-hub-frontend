import {
    BarChart3,
    Bot,
    Link,
    Zap
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
  }, []);

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
      title: 'Workflow "Email Automation" executed',
      time: '2 minutes ago',
      icon: Zap,
      color: 'bg-blue-500'
    },
    {
      title: 'New connection added: Slack',
      time: '15 minutes ago',
      icon: Link,
      color: 'bg-green-500'
    },
    {
      title: 'Agent "Customer Support" activated',
      time: '1 hour ago',
      icon: Bot,
      color: 'bg-purple-500'
    },
    {
      title: 'MCP Tool "send_email" executed',
      time: '3 hours ago',
      icon: Zap,
      color: 'bg-teal-500'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="dashboard-header mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-gray-600">
                Here's what's happening with your Mini-Hub today
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change >= 0 ? '+' : ''}{stat.change}% from last month
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* Quick Actions */}
        <div className="quick-actions mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200/50 hover:shadow-md hover:border-blue-200 transition-all duration-200 text-left"
              >
                <div className={`p-3 rounded-xl ${action.color}`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="recent-activity bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${activity.color}`}>
                    <activity.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status & Usage */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage Usage</span>
                <span className="text-sm font-medium text-gray-900">2.4 GB / 10 GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 