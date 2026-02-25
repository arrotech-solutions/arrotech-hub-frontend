import {
  Activity,
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Copy,
  CreditCard,
  Crown,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Key,
  Lock,
  Mail,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  User,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [originalProfileData, setOriginalProfileData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || ''
  });

  useEffect(() => {
    if (user) {
      const data = {
        name: user.name,
        email: user.email
      };
      setProfileData(data);
      setOriginalProfileData(data);
    }
  }, [user]);

  const hasProfileChanges = () => {
    return (
      profileData.name !== originalProfileData.name ||
      profileData.email !== originalProfileData.email
    );
  };

  const handleProfileChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    if (!hasProfileChanges()) return;

    try {
      setSaving(true);
      await updateUser({
        name: profileData.name,
        email: profileData.email
      });
      setOriginalProfileData(profileData);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const regenerateApiKey = async () => {
    try {
      setRegenerating(true);
      const response = await apiService.regenerateApiKey();
      if (response.success) {
        // Update the user context with new API key
        if (user) {
          updateUser({ ...user, api_key: response.data.api_key });
        }
        toast.success('API key regenerated successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to regenerate API key');
    } finally {
      setRegenerating(false);
    }
  };

  const copyApiKey = async () => {
    if (user?.api_key) {
      try {
        await navigator.clipboard.writeText(user.api_key);
        setCopied(true);
        toast.success('API key copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy API key');
      }
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setSaving(true);
      await apiService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      toast.success('Password changed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'pro':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'testing':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      default:
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
    }
  };

  const getSubscriptionIcon = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return <Crown className="w-4 h-4" />;
      case 'pro':
        return <Sparkles className="w-4 h-4" />;
      case 'testing':
        return <Zap className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getSubscriptionName = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'Enterprise';
      case 'pro':
        return 'Professional';
      case 'testing':
        return 'Testing';
      default:
        return 'Free';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-slate-400">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="profile-header mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
                Profile Settings
              </h1>
              <p className="text-gray-600 dark:text-slate-400 transition-colors">
                Manage your account information and preferences
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-slate-400 transition-colors">Last updated</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                  {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content - 3 columns */}
          <div className="xl:col-span-3 space-y-8">
            {/* Personal Information Card */}
            <div className="personal-info-section bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-slate-700/50 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Personal Information</h3>
                    <p className="text-gray-600 dark:text-slate-400 transition-colors">Update your name and email address</p>
                  </div>
                </div>
                {hasProfileChanges() && (
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            </div>

            {/* API Key Management Card */}
            <div className="api-key-section bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-slate-700/50 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">API Key Management</h3>
                    <p className="text-gray-600 dark:text-slate-400 transition-colors">Secure access to your integrations</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                  >
                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={copyApiKey}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy API Key"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={regenerateApiKey}
                    disabled={regenerating}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {regenerating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>{regenerating ? 'Regenerating...' : 'Regenerate'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-transparent dark:border-slate-700/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors">API Key</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 transition-colors">Keep secure</span>
                </div>
                <div className="font-mono text-sm break-all text-gray-900 dark:text-white transition-colors">
                  {showApiKey ? (
                    user.api_key || 'No API key generated'
                  ) : (
                    <span className="text-gray-400 dark:text-slate-500 transition-colors">••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••</span>
                  )}
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg transition-colors">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 transition-colors" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 transition-colors">Security Notice</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-500/80 mt-1 transition-colors">
                      Your API key provides full access to your account. Keep it secure and never share it publicly.
                      If compromised, regenerate it immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change Card */}
            <div className="security-section bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-slate-700/50 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Password Security</h3>
                    <p className="text-gray-600 dark:text-slate-400 transition-colors">Update your account password</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{showPasswordForm ? 'Cancel' : 'Change Password'}</span>
                </button>
              </div>

              {showPasswordForm && (
                <div className="space-y-4 bg-green-50 dark:bg-green-500/10 rounded-lg p-4 border border-green-200 dark:border-green-500/20 transition-colors">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-500/50 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-500/50 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        placeholder="Enter your new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-500/50 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        placeholder="Confirm your new password"
                      />
                    </div>
                  </div>

                  <button
                    onClick={changePassword}
                    disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Changing Password...' : 'Update Password'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-8">
            {/* Account Overview Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-slate-700/50 hover:shadow-md transition-all">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Account Overview</h3>
                  <p className="text-gray-600 dark:text-slate-400 transition-colors">Your account details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-transparent dark:border-slate-700/50 transition-colors">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors">User ID</span>
                  <span className="text-sm text-gray-900 dark:text-white font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-transparent dark:border-slate-700 transition-colors">#{user.id}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-transparent dark:border-slate-700/50 transition-colors">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors">Subscription</span>
                  <div className={`px-3 py-1 text-xs font-medium text-white rounded-full ${getSubscriptionColor(user.subscription_tier)} flex items-center space-x-1`}>
                    {getSubscriptionIcon(user.subscription_tier)}
                    <span>{getSubscriptionName(user.subscription_tier)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-transparent dark:border-slate-700/50 transition-colors">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors">Member Since</span>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500 transition-colors" />
                    <span className="text-sm text-gray-900 dark:text-white transition-colors">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-transparent dark:border-slate-700/50 transition-colors">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors">Last Updated</span>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500 transition-colors" />
                    <span className="text-sm text-gray-900 dark:text-white transition-colors">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-slate-700/50 hover:shadow-md transition-all">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Quick Actions</h3>
                  <p className="text-gray-600 dark:text-slate-400 transition-colors">Account management</p>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 text-left text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-colors">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-colors" />
                    </div>
                    <span className="text-sm font-medium">Email Preferences</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-600 transition-colors">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-3 text-left text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg transition-colors">
                      <Activity className="w-4 h-4 text-green-600 dark:text-green-400 transition-colors" />
                    </div>
                    <span className="text-sm font-medium">Usage Analytics</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-600 transition-colors">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-3 text-left text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg transition-colors">
                      <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400 transition-colors" />
                    </div>
                    <span className="text-sm font-medium">Billing History</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-600 transition-colors">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-3 text-left text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400 transition-colors" />
                    </div>
                    <span className="text-sm font-medium">Export Data</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-600 transition-colors">→</span>
                </button>
              </div>
            </div>

            {/* Danger Zone Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-red-200/50 dark:border-red-500/20 hover:shadow-md transition-all">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Danger Zone</h3>
                  <p className="text-gray-600 dark:text-slate-400 transition-colors">Irreversible actions</p>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 text-left text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 transition-colors" />
                    </div>
                    <span className="text-sm font-medium">Delete Account</span>
                  </div>
                  <span className="text-xs text-red-400 dark:text-red-500/50 transition-colors">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
  export default Profile;