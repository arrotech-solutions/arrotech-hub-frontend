import {
  AlertCircle,
  CheckCircle,
  Loader2,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import SettingsSidebar from '../components/settings/SettingsSidebar';
import APISettingsTab from '../components/settings/APISettings';
import DashboardSettingsTab from '../components/settings/DashboardSettings';
import IntegrationSettingsTab from '../components/settings/IntegrationSettings';
import NotificationSettingsTab from '../components/settings/NotificationSettings';
import SecuritySettingsTab from '../components/settings/SecuritySettings';
import DataPrivacySettings from '../components/settings/DataPrivacySettings';
import ProfileSettings from '../components/settings/ProfileSettings';
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
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [user, setUser] = useState<any>(null); // To store full user object including API key
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // Default to profile
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Fetch settings
      const settingsResponse = await apiService.getUserSettings();
      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
      }

      // Fetch user info for profile & API key
      try {
        const userResponse = await apiService.getCurrentUser();
        // Assuming userResponse.data contains the user object
        // we might need to adjust based on actual API response structure
        if (userResponse.success) {
          setUser(userResponse.data);
        }
      } catch (err) {
        console.error("Failed to fetch user info", err);
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

  const handleRegenerateApiKey = async () => {
    if (window.confirm("Are you sure? This will invalidate your old API key immediately.")) {
      try {
        const response = await apiService.regenerateApiKey();
        if (response.success && response.data?.api_key) {
          toast.success("API Key regenerated");
          setUser({ ...user, api_key: response.data.api_key });
        }
      } catch (error) {
        console.error("Failed to regenerate key", error);
        toast.error("Failed to regenerate API Key");
      }
    }
  };

  // Handlers
  const handleNotificationSettingsUpdate = (notificationSettings: NotificationSettings) => {
    if (settings) saveSettings({ notification_settings: notificationSettings });
  };

  const handleAPISettingsUpdate = (apiSettings: APISettings) => {
    if (settings) saveSettings({ api_settings: apiSettings });
  };

  const handleDashboardSettingsUpdate = (dashboardSettings: DashboardSettings) => {
    if (settings) saveSettings({ dashboard_settings: dashboardSettings });
  };

  const handleIntegrationSettingsUpdate = (integrationSettings: IntegrationSettings) => {
    if (settings) saveSettings({ integration_settings: integrationSettings });
  };

  const handleSecuritySettingsUpdate = (securitySettings: SecuritySettings) => {
    if (settings) saveSettings({ security_settings: securitySettings });
  };

  const handleExportData = async () => {
    try {
      const loadingToast = toast.loading('Generating data export...');
      const blob = await apiService.exportData();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user_data_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss(loadingToast);
      toast.success('Data export started');
    } catch (error) {
      console.error("Export failed", error);
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt("WARNING: This will permanently delete your account and all data.\n\nType 'DELETE' to confirm.");
    if (confirmation === 'DELETE') {
      try {
        await apiService.deleteAccount(confirmation);
        toast.success('Account deleted successfully');
        localStorage.removeItem('auth_token');
        navigate('/login');
      } catch (error) {
        console.error("Delete failed", error);
        toast.error('Failed to delete account');
      }
    } else if (confirmation !== null) {
      toast.error("Incorrect confirmation text.");
    }
  };

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
            <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/50 p-6 space-y-2 sticky top-24">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Configuration Domains</h3>
              <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </div>

          {/* Settings Content Area */}
          <div className="lg:col-span-2">
            <div className="settings-container settings-content bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/50 p-8 min-h-[600px] shadow-sm">

              {activeTab === 'profile' && user && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <ProfileSettings user={user} />
                </div>
              )}

              {activeTab === 'notifications' && settings && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <NotificationSettingsTab
                    settings={settings.notification_settings}
                    onUpdate={handleNotificationSettingsUpdate}
                    expanded={true}
                  />
                </div>
              )}
              {activeTab === 'api' && settings && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <APISettingsTab
                    settings={settings.api_settings}
                    onUpdate={handleAPISettingsUpdate}
                    expanded={true}
                    apiKey={user?.api_key}
                    onRegenerateKey={handleRegenerateApiKey}
                  />
                </div>
              )}
              {activeTab === 'dashboard' && settings && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <DashboardSettingsTab
                    settings={settings.dashboard_settings}
                    onUpdate={handleDashboardSettingsUpdate}
                    expanded={true}
                  />
                </div>
              )}
              {activeTab === 'integrations' && settings && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <IntegrationSettingsTab
                    settings={settings.integration_settings}
                    onUpdate={handleIntegrationSettingsUpdate}
                    expanded={true}
                  />
                </div>
              )}
              {activeTab === 'security' && settings && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <SecuritySettingsTab
                    settings={settings.security_settings}
                    onUpdate={handleSecuritySettingsUpdate}
                    expanded={true}
                  />
                </div>
              )}
              {activeTab === 'data' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <DataPrivacySettings
                    onExport={handleExportData}
                    onDelete={handleDeleteAccount}
                    expanded={true}
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

export default Settings;