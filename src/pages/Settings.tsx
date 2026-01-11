import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Globe,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Monitor,
  Monitor as MonitorIcon,
  Palette,
  RefreshCw,
  RotateCcw,
  Shield,
  Webhook,
  Zap,
  Sparkles
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import {
  APISettings,
  DashboardSettings,
  IntegrationSettings,
  NotificationSettings,
  SecuritySettings,
  UserSettings,
  UserSettingsUpdate
} from '../types';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['notifications']));
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsUpdate: UserSettingsUpdate) => {
    try {
      setSaving(true);
      const response = await apiService.updateUserSettings(settingsUpdate);
      if (response.success) {
        setSettings(response.data);
        setMessage({ type: 'success', text: 'Settings saved successfully' });
        toast.success('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        setSaving(true);
        await apiService.resetUserSettings();
        await loadSettings();
        setMessage({ type: 'success', text: 'Settings reset to defaults' });
        toast.success('Settings reset to defaults');
      } catch (error) {
        console.error('Error resetting settings:', error);
        setMessage({ type: 'error', text: 'Failed to reset settings' });
        toast.error('Failed to reset settings');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleNotificationSettingsUpdate = (notificationSettings: NotificationSettings) => {
    if (settings) {
      saveSettings({ notification_settings: notificationSettings });
    }
  };

  const handleAPISettingsUpdate = (apiSettings: APISettings) => {
    if (settings) {
      saveSettings({ api_settings: apiSettings });
    }
  };

  const handleDashboardSettingsUpdate = (dashboardSettings: DashboardSettings) => {
    if (settings) {
      saveSettings({ dashboard_settings: dashboardSettings });
    }
  };

  const handleIntegrationSettingsUpdate = (integrationSettings: IntegrationSettings) => {
    if (settings) {
      saveSettings({ integration_settings: integrationSettings });
    }
  };

  const handleSecuritySettingsUpdate = (securitySettings: SecuritySettings) => {
    if (settings) {
      saveSettings({ security_settings: securitySettings });
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const tabs = [
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      description: 'Manage email, Slack, and webhook notifications',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'api',
      name: 'API Settings',
      icon: Zap,
      description: 'Configure API rate limits and timeouts',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: Monitor,
      description: 'Customize your dashboard appearance and layout',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'integrations',
      name: 'Integrations',
      icon: Database,
      description: 'Manage third-party integrations and sync settings',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield,
      description: 'Configure security policies and access controls',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        {/* Header with Mesh Gradient */}
        <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-200 shadow-sm mb-8">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

          <div className="relative px-8 py-10 settings-header">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3">
                  <div className="p-1.5 bg-orange-100/80 rounded-lg">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Configuration Node</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">
                  System <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Settings</span>
                </h1>
                <p className="text-gray-500 max-w-md font-medium mx-auto sm:mx-0">
                  Calibrate your account preferences, security protocols, and integration pathways.
                </p>
              </div>
              <div className="settings-actions flex items-center justify-center sm:justify-end gap-3 font-bold">
                <button
                  onClick={resetSettings}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-4 bg-white text-gray-700 rounded-2xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 shadow-sm disabled:opacity-50"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Reset Node</span>
                </button>
                {saving && (
                  <div className="flex items-center px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-black uppercase tracking-widest border border-orange-100">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    <span>Syncing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-8 p-6 rounded-[24px] border animate-in slide-in-from-top-4 duration-500 ${message.type === 'success'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
            : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-xl mr-4 ${message.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <p className="font-bold">{message.text}</p>
            </div>
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="settings-tabs settings-categories bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/50 p-6 space-y-2 sticky top-24">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Configuration Domains</h3>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 group ${isActive
                      ? 'bg-white shadow-sm border border-gray-100'
                      : 'hover:bg-white/40 border border-transparent hover:border-white'
                      }`}
                  >
                    <div className={`p-2 rounded-xl transition-all duration-300 ${isActive
                      ? `${tab.bgColor} ${tab.color} scale-110 shadow-sm`
                      : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-gray-600'
                      }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <p className={`text-sm font-black tracking-tight ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                        {tab.name}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 truncate max-w-[180px]">
                        {tab.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Content Area */}
          <div className="lg:col-span-2">
            <div className="settings-container settings-content bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/50 p-8 min-h-[600px] shadow-sm">
              {activeTab === 'notifications' && settings && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <NotificationSettingsTab
                    settings={settings.notification_settings}
                    onUpdate={handleNotificationSettingsUpdate}
                    expanded={expandedSections.has('notifications')}
                    onToggle={() => toggleSection('notifications')}
                  />
                </div>
              )}
              {activeTab === 'api' && settings && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <APISettingsTab
                    settings={settings.api_settings}
                    onUpdate={handleAPISettingsUpdate}
                    expanded={expandedSections.has('api')}
                    onToggle={() => toggleSection('api')}
                  />
                </div>
              )}
              {activeTab === 'dashboard' && settings && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <DashboardSettingsTab
                    settings={settings.dashboard_settings}
                    onUpdate={handleDashboardSettingsUpdate}
                    expanded={expandedSections.has('dashboard')}
                    onToggle={() => toggleSection('dashboard')}
                  />
                </div>
              )}
              {activeTab === 'integrations' && settings && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <IntegrationSettingsTab
                    settings={settings.integration_settings}
                    onUpdate={handleIntegrationSettingsUpdate}
                    expanded={expandedSections.has('integrations')}
                    onToggle={() => toggleSection('integrations')}
                  />
                </div>
              )}
              {activeTab === 'security' && settings && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <SecuritySettingsTab
                    settings={settings.security_settings}
                    onUpdate={handleSecuritySettingsUpdate}
                    expanded={expandedSections.has('security')}
                    onToggle={() => toggleSection('security')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationSettingsTab: React.FC<{
  settings: NotificationSettings;
  onUpdate: (settings: NotificationSettings) => void;
  expanded: boolean;
  onToggle: () => void;
}> = ({ settings, onUpdate, expanded, onToggle }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [webhookUrl, setWebhookUrl] = useState(settings.notification_webhook_url || '');

  const handleChange = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdate(newSettings);
  };

  const handleWebhookChange = (url: string) => {
    setWebhookUrl(url);
    handleChange('notification_webhook_url', url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Notification Settings</h3>
            <p className="text-gray-600">Configure how you receive notifications</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-medium text-gray-900">Email Notifications</h4>
            </div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.email_notifications}
                  onChange={(e) => handleChange('email_notifications', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Enable email notifications</span>
              </label>
              <p className="text-sm text-gray-600">Receive important updates and alerts via email</p>
            </div>
          </div>

          {/* Slack Notifications */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <h4 className="text-lg font-medium text-gray-900">Slack Notifications</h4>
            </div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.slack_notifications}
                  onChange={(e) => handleChange('slack_notifications', e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-gray-700">Enable Slack notifications</span>
              </label>
              <p className="text-sm text-gray-600">Receive notifications in your Slack workspace</p>
            </div>
          </div>

          {/* Webhook Notifications */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Webhook className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-medium text-gray-900">Webhook Notifications</h4>
            </div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.webhook_notifications}
                  onChange={(e) => handleChange('webhook_notifications', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-gray-700">Enable webhook notifications</span>
              </label>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => handleWebhookChange(e.target.value)}
                  placeholder="https://your-webhook-url.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-600">URL to send webhook notifications to</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const APISettingsTab: React.FC<{
  settings: APISettings;
  onUpdate: (settings: APISettings) => void;
  expanded: boolean;
  onToggle: () => void;
}> = ({ settings, onUpdate, expanded, onToggle }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (key: keyof APISettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdate(newSettings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">API Settings</h3>
            <p className="text-gray-600">Configure API rate limits and timeouts</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Rate Limits */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="w-5 h-5 text-purple-600" />
              <h4 className="text-lg font-medium text-gray-900">Rate Limits</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Rate Limit (requests per minute)
                </label>
                <input
                  type="number"
                  value={localSettings.api_rate_limit}
                  onChange={(e) => handleChange('api_rate_limit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  max="1000"
                />
                <p className="text-sm text-gray-600">Maximum API requests allowed per minute</p>
              </div>
            </div>
          </div>

          {/* Timeouts */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="w-5 h-5 text-purple-600" />
              <h4 className="text-lg font-medium text-gray-900">Timeouts</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={localSettings.api_timeout}
                  onChange={(e) => handleChange('api_timeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  max="300"
                />
                <p className="text-sm text-gray-600">Maximum time to wait for API responses</p>
              </div>
            </div>
          </div>

          {/* Auto Refresh */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <RefreshCw className="w-5 h-5 text-purple-600" />
              <h4 className="text-lg font-medium text-gray-900">Auto Refresh</h4>
            </div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.auto_refresh_tokens}
                  onChange={(e) => handleChange('auto_refresh_tokens', e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-gray-700">Auto refresh tokens</span>
              </label>
              <p className="text-sm text-gray-600">Automatically refresh API tokens when they expire</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardSettingsTab: React.FC<{
  settings: DashboardSettings;
  onUpdate: (settings: DashboardSettings) => void;
  expanded: boolean;
  onToggle: () => void;
}> = ({ settings, onUpdate, expanded, onToggle }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (key: keyof DashboardSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdate(newSettings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Monitor className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Dashboard Settings</h3>
            <p className="text-gray-600">Customize your dashboard appearance and layout</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Theme */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Palette className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-medium text-gray-900">Theme</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dashboard Theme
                </label>
                <select
                  value={localSettings.dashboard_theme}
                  onChange={(e) => handleChange('dashboard_theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
                <p className="text-sm text-gray-600">Choose your preferred dashboard theme</p>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MonitorIcon className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-medium text-gray-900">Layout</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dashboard Layout
                </label>
                <select
                  value={localSettings.dashboard_layout}
                  onChange={(e) => handleChange('dashboard_layout', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                  <option value="detailed">Detailed</option>
                </select>
                <p className="text-sm text-gray-600">Choose your preferred dashboard layout</p>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-medium text-gray-900">Analytics</h4>
            </div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.show_analytics}
                  onChange={(e) => handleChange('show_analytics', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-gray-700">Show analytics on dashboard</span>
              </label>
              <p className="text-sm text-gray-600">Display analytics and performance metrics</p>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-medium text-gray-900">Usage Statistics</h4>
            </div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.show_usage_stats}
                  onChange={(e) => handleChange('show_usage_stats', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-gray-700">Show usage statistics</span>
              </label>
              <p className="text-sm text-gray-600">Display usage statistics and limits</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const IntegrationSettingsTab: React.FC<{
  settings: IntegrationSettings;
  onUpdate: (settings: IntegrationSettings) => void;
  expanded: boolean;
  onToggle: () => void;
}> = ({ settings, onUpdate, expanded, onToggle }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (key: keyof IntegrationSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdate(newSettings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Database className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Integration Settings</h3>
            <p className="text-gray-600">Manage third-party integrations and sync settings</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Auto Sync */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <RefreshCw className="w-5 h-5 text-orange-600" />
              <h4 className="text-lg font-medium text-gray-900">Auto Sync</h4>
            </div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.auto_sync_connections}
                  onChange={(e) => handleChange('auto_sync_connections', e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-gray-700">Auto sync connections</span>
              </label>
              <p className="text-sm text-gray-600">Automatically sync data from connected platforms</p>
            </div>
          </div>

          {/* Sync Frequency */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="w-5 h-5 text-orange-600" />
              <h4 className="text-lg font-medium text-gray-900">Sync Frequency</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Frequency
                </label>
                <select
                  value={localSettings.sync_frequency}
                  onChange={(e) => handleChange('sync_frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
                <p className="text-sm text-gray-600">How often to sync data from integrations</p>
              </div>
            </div>
          </div>

          {/* Backup Connections */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-orange-600" />
              <h4 className="text-lg font-medium text-gray-900">Backup</h4>
            </div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.backup_connections}
                  onChange={(e) => handleChange('backup_connections', e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-gray-700">Backup connections</span>
              </label>
              <p className="text-sm text-gray-600">Automatically backup connection data</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SecuritySettingsTab: React.FC<{
  settings: SecuritySettings;
  onUpdate: (settings: SecuritySettings) => void;
  expanded: boolean;
  onToggle: () => void;
}> = ({ settings, onUpdate, expanded, onToggle }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (key: keyof SecuritySettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdate(newSettings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Security Settings</h3>
            <p className="text-gray-600">Configure security policies and access controls</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Two Factor Authentication */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-5 h-5 text-red-600" />
              <h4 className="text-lg font-medium text-gray-900">Two Factor Authentication</h4>
            </div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.two_factor_enabled}
                  onChange={(e) => handleChange('two_factor_enabled', e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-gray-700">Enable two factor authentication</span>
              </label>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
          </div>

          {/* Session Timeout */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="w-5 h-5 text-red-600" />
              <h4 className="text-lg font-medium text-gray-900">Session Timeout</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={localSettings.session_timeout}
                  onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="5"
                  max="1440"
                />
                <p className="text-sm text-gray-600">Time before session expires (5-1440 minutes)</p>
              </div>
            </div>
          </div>

          {/* IP Whitelist */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-5 h-5 text-red-600" />
              <h4 className="text-lg font-medium text-gray-900">IP Whitelist</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IP Addresses (one per line)
                </label>
                <textarea
                  value={localSettings.ip_whitelist?.join('\n') || ''}
                  onChange={(e) => handleChange('ip_whitelist', e.target.value.split('\n').filter(ip => ip.trim()))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  placeholder="192.168.1.1&#10;10.0.0.1"
                />
                <p className="text-sm text-gray-600">Restrict access to specific IP addresses (optional)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 