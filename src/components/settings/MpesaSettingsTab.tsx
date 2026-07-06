import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Building2, 
  KeyRound, 
  Smartphone, 
  Webhook, 
  Globe,
  Save,
  Copy,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import apiService from '../../services/api';

export default function MpesaSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [registering, setRegistering] = useState(false);
  
  const [config, setConfig] = useState({
    daraja_consumer_key: '',
    daraja_consumer_secret: '',
    daraja_passkey: '',
    daraja_shortcode: '',
    daraja_environment: 'sandbox',
    webhook_secret: '',
    alert_enabled: true,
    auto_match_enabled: true,
    callback_url_override: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await apiService.getMpesaAgentConfig() as any;
      const data = res.data || res;
      if (data && res.success !== false) {
        // Overlay existing config on top of default so we don't null out inputs
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to load M-Pesa config', err);
      toast.error('Could not load Daraja settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      // We don't want to send empty strings if they are updating a subset
      const payload: any = {
        alert_enabled: config.alert_enabled,
        auto_match_enabled: config.auto_match_enabled
      };

      if (config.daraja_consumer_key && !config.daraja_consumer_key.includes('••')) payload.daraja_consumer_key = config.daraja_consumer_key;
      // Only send secrets if they have been typed into (not containing the masking dots)
      if (config.daraja_consumer_secret && !config.daraja_consumer_secret.includes('••')) payload.daraja_consumer_secret = config.daraja_consumer_secret;
      if (config.daraja_passkey && !config.daraja_passkey.includes('••')) payload.daraja_passkey = config.daraja_passkey;
      
      if (config.daraja_shortcode) payload.daraja_shortcode = config.daraja_shortcode;
      if (config.daraja_environment) payload.daraja_environment = config.daraja_environment;
      if (config.callback_url_override) payload.callback_url_override = config.callback_url_override;

      const res = await apiService.updateMpesaAgentConfig(payload) as any;
      if (res.success !== false) {
        toast.success('M-Pesa configuration updated successfully!');
        const data = res.data || res;
        if (data) {
           setConfig(prev => ({ ...prev, ...data }));
        }
      } else {
        toast.error('Update failed');
      }
    } catch (error) {
      toast.error('Error saving your configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterUrls = async () => {
    if (!config.daraja_shortcode) {
      toast.error('Please enter a Shortcode first');
      return;
    }

    try {
      setRegistering(true);
      const res = await apiService.registerMpesaUrls();
      
      if (res.success) {
        toast.success(res.message || 'Webhook URLs registered successfully with Safaricom!');
      } else {
        const errorMsg = res.message || 'Registration failed with Safaricom';
        toast.error(errorMsg);
        
        // Log details for debugging if available
        if (res.data) {
          console.error('Safaricom registration error:', res.data);
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error communicating with Safaricom registration service';
      toast.error(errorMsg);
    } finally {
      setRegistering(false);
    }
  };

  const copyWebhook = () => {
    if (!config.webhook_secret) return;
    
    // Quick inline getBaseUrl logic since it's outside the render scope
    const getBaseUrl = () => {
      if (import.meta.env.VITE_API_URL) {
         try {
           const url = new URL(import.meta.env.VITE_API_URL);
           return `${url.protocol}//${url.host}`;
         } catch (e) {}
      }
      return `${window.location.protocol}//${window.location.host}`;
    };

    const url = config.callback_url_override
      ? `${config.callback_url_override}${config.callback_url_override.endsWith('/') ? '' : '/'}api/agents/daraja/callback/${config.webhook_secret}`
      : `${getBaseUrl()}/api/agents/daraja/callback/${config.webhook_secret}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Webhook URL copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const getBaseUrl = () => {
    // If we're built with a specific API URL, use it (removing any trailing /api)
    if (import.meta.env.VITE_API_URL) {
       try {
         const url = new URL(import.meta.env.VITE_API_URL);
         return `${url.protocol}//${url.host}`;
       } catch (e) {
         // fallback
       }
    }
    // Otherwise use the current window location
    return `${window.location.protocol}//${window.location.host}`;
  };

  const webhookUrl = config.callback_url_override
    ? `${config.callback_url_override}${config.callback_url_override.endsWith('/') ? '' : '/'}api/agents/daraja/callback/${config.webhook_secret}`
    : config.webhook_secret 
      ? `${getBaseUrl()}/api/agents/daraja/callback/${config.webhook_secret}`
      : 'Save your configuration first to generate a Webhook URL';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">M-Pesa Reconciliation</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Connect your Lipa Na M-Pesa Paybill or Till to automatically reconcile customer payments. 
          Your credentials are encrypted and strictly isolated.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Daraja API Section */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700/50 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daraja App Credentials</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-6 -mt-2">
            Live Daraja credentials enable one-tap M-Pesa STK for rent collection agents.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Shortcode / Paybill Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Smartphone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={config.daraja_shortcode || ''}
                  onChange={e => setConfig({...config, daraja_shortcode: e.target.value})}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g. 174379"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Daraja Environment
              </label>
              <select
                value={config.daraja_environment || 'sandbox'}
                onChange={e => setConfig({...config, daraja_environment: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              >
                <option value="sandbox">🧪 Sandbox (Testing)</option>
                <option value="live">🟢 Live (Production)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Use Sandbox for testing with fake transactions. Switch to Live when going to production.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Webhook Callback URL (Override)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={config.callback_url_override || ''}
                  onChange={e => setConfig({...config, callback_url_override: e.target.value})}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g. https://1234-abcd.ngrok-free.app"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                Optional: If you are testing locally using Ngrok or a similar tunnel, paste the tunnel base URL here.
                Leave empty to use the default system URL.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Consumer Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={config.daraja_consumer_key || ''}
                  onChange={e => setConfig({...config, daraja_consumer_key: e.target.value})}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="Your App's Consumer Key"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Consumer Secret
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={config.daraja_consumer_secret || ''}
                  onChange={e => setConfig({...config, daraja_consumer_secret: e.target.value})}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Passkey
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPasskey ? 'text' : 'password'}
                  value={config.daraja_passkey || ''}
                  onChange={e => setConfig({...config, daraja_passkey: e.target.value})}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey(!showPasskey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPasskey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Configuration */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700/50 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Webhook className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daraja Webhook Callback</h3>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Copy this secure URL and paste it into the Safaricom Daraja Developer portal as your 
            <strong> Validation URL</strong> and <strong>Confirmation URL</strong>.
          </p>

          <div className="flex mt-1 rounded-md shadow-sm">
            <div className="relative flex-grow focus-within:z-10 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-l-xl px-4 py-3 flex items-center overflow-hidden">
              <code className="text-sm text-gray-800 dark:text-slate-300 truncate w-full">
                {webhookUrl}
              </code>
            </div>
            <button
              type="button"
              onClick={copyWebhook}
              disabled={!config.webhook_secret}
              className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-r-xl text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleRegisterUrls}
            disabled={!config.webhook_secret || registering}
            className="mt-6 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            {registering ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{registering ? 'Registering with Safaricom...' : 'Register Webhook URLs Automatically'}</span>
          </button>
          
          <p className="mt-3 text-xs text-gray-500 dark:text-slate-400 italic">
            * This will automatically call Safaricom to point your Paybill/Till notifications to this Arrotech Hub instance.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-70"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
