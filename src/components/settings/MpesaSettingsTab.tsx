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
  EyeOff,
  Banknote,
  Info,
  Trash2
} from 'lucide-react';
import apiService from '../../services/api';

export default function MpesaSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedManual, setCopiedManual] = useState(false);
  const [showManualHelp, setShowManualHelp] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [clearingField, setClearingField] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  
  const [config, setConfig] = useState({
    daraja_consumer_key: '',
    daraja_consumer_secret: '',
    daraja_passkey: '',
    daraja_shortcode: '',
    daraja_environment: 'sandbox',
    webhook_secret: '',
    alert_enabled: true,
    auto_match_enabled: true,
    callback_url_override: '',
    // Manual payment fallback (no STK)
    manual_payment_enabled: false,
    manual_paybill_number: '',
    manual_paybill_account: '',
    manual_till_number: '',
    manual_pochi_number: '',
    manual_send_money_number: '',
    manual_recipient_name: '',
    manual_payment_note: ''
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

      // Manual payment fallback fields (always sent so they can be cleared)
      payload.manual_payment_enabled = config.manual_payment_enabled;
      payload.manual_paybill_number = config.manual_paybill_number || '';
      payload.manual_paybill_account = config.manual_paybill_account || '';
      payload.manual_till_number = config.manual_till_number || '';
      payload.manual_pochi_number = config.manual_pochi_number || '';
      payload.manual_send_money_number = config.manual_send_money_number || '';
      payload.manual_recipient_name = config.manual_recipient_name || '';
      payload.manual_payment_note = config.manual_payment_note || '';

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

  // Explicitly clear a single Daraja credential by persisting an empty value.
  // The backend keeps empty strings (exclude_none) and clears the column, which
  // the normal Save cannot do (it omits blank fields to avoid accidental wipes).
  const handleClearField = async (field: string, label: string) => {
    try {
      setClearing(true);
      const res = await apiService.updateMpesaAgentConfig({ [field]: '' } as any) as any;
      if (res.success !== false) {
        setConfig(prev => ({ ...prev, [field]: '' }));
        toast.success(`${label} cleared`);
      } else {
        toast.error(`Could not clear ${label}`);
      }
    } catch (error) {
      toast.error(`Error clearing ${label}`);
    } finally {
      setClearing(false);
      setClearingField(null);
    }
  };

  const renderClearControl = (field: string, label: string) => {
    if (clearingField === field) {
      return (
        <span className="inline-flex items-center gap-2 text-xs">
          <span className="text-gray-500 dark:text-slate-400">Clear {label}?</span>
          <button
            type="button"
            onClick={() => handleClearField(field, label)}
            disabled={clearing}
            className="font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {clearing ? 'Clearing…' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={() => setClearingField(null)}
            disabled={clearing}
            className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50"
          >
            Cancel
          </button>
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setClearingField(field)}
        title={`Clear ${label}`}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear
      </button>
    );
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

  // Event-driven URL a merchant's Sheet/Airtable automation calls when they mark
  // a manual order "paid" — triggers the customer + business PAID PDF receipt.
  const manualConfirmBase = config.callback_url_override
    ? `${config.callback_url_override}${config.callback_url_override.endsWith('/') ? '' : '/'}`
    : `${getBaseUrl()}/`;
  const manualConfirmUrl = config.webhook_secret
    ? `${manualConfirmBase}api/agents/daraja/manual-payment/confirmed/${config.webhook_secret}`
    : 'Enable manual payment and Save to generate this URL';

  const copyManualWebhook = () => {
    if (!config.webhook_secret) return;
    navigator.clipboard.writeText(manualConfirmUrl);
    setCopiedManual(true);
    toast.success('Confirmation webhook URL copied!');
    setTimeout(() => setCopiedManual(false), 2000);
  };

  const appsScriptSnippet = `// Google Sheets > Extensions > Apps Script. Paste, save, then add an
// "On edit" installable trigger (Triggers > Add Trigger > onEdit > From spreadsheet > On edit).
var WEBHOOK_URL = "${config.webhook_secret ? manualConfirmUrl : 'PASTE_YOUR_WEBHOOK_URL_HERE'}";

function onEdit(e) {
  var sh = e.range.getSheet();
  if (sh.getName() !== "Orders") return;
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var col = {};
  headers.forEach(function (h, i) { col[String(h).trim()] = i; });
  if (col["Status"] === undefined) return;
  if (e.range.getColumn() !== col["Status"] + 1) return;              // only Status edits
  if (String(e.value || "").trim().toLowerCase() !== "paid") return;  // new value must be paid
  if (String(e.oldValue || "").trim().toLowerCase() === "paid") return; // skip if it was already paid

  var row = sh.getRange(e.range.getRow(), 1, 1, sh.getLastColumn()).getValues()[0];

  // Sheet-side dedupe: skip if a receipt was already sent for this order.
  if (col["Receipt Sent"] !== undefined) {
    var already = String(row[col["Receipt Sent"]] || "").trim().toLowerCase();
    if (already === "yes" || already === "true" || already === "1") return;
  }

  var payload = {
    order_id: row[col["Order ID"]],
    status: "paid",
    mpesa_code: col["Payment Ref"] !== undefined ? row[col["Payment Ref"]] : "",
    amount: col["Subtotal"] !== undefined ? row[col["Subtotal"]] : null,
    customer_phone: col["Customer Phone"] !== undefined
      ? String(row[col["Customer Phone"]]).replace(/^'/, "")
      : ""
  };
  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}`;

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Shortcode / Paybill Number
                </label>
                {renderClearControl('daraja_shortcode', 'Shortcode')}
              </div>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Consumer Key
                </label>
                {renderClearControl('daraja_consumer_key', 'Consumer Key')}
              </div>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Consumer Secret
                </label>
                {renderClearControl('daraja_consumer_secret', 'Consumer Secret')}
              </div>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Passkey
                </label>
                {renderClearControl('daraja_passkey', 'Passkey')}
              </div>
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

        {/* Manual Payment (no STK) Section */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                <Banknote className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manual Payment (No STK)</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.manual_payment_enabled}
                onChange={e => setConfig({ ...config, manual_payment_enabled: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-start space-x-2 mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Use this while you wait for live Daraja (STK) approval. When enabled and your STK credentials
              above are not yet live, the ordering agent shows customers your Paybill/Till/Pochi/Send Money
              details so they pay from their own M-Pesa menu. You reconcile and mark orders paid in your
              Google Sheet/Airtable — there is no automatic STK prompt or auto receipt. As soon as valid live
              credentials are saved, the agent switches back to one-tap STK automatically.
            </p>
          </div>

          {config.manual_payment_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Paybill Number
                </label>
                <input
                  type="text"
                  value={config.manual_paybill_number || ''}
                  onChange={e => setConfig({ ...config, manual_paybill_number: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-green-500 focus:border-green-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g. 400200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Paybill Account (optional)
                </label>
                <input
                  type="text"
                  value={config.manual_paybill_account || ''}
                  onChange={e => setConfig({ ...config, manual_paybill_account: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-green-500 focus:border-green-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="Leave blank to use the order number"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  If blank, customers are told to use their order number as the account.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Till / Buy Goods Number
                </label>
                <input
                  type="text"
                  value={config.manual_till_number || ''}
                  onChange={e => setConfig({ ...config, manual_till_number: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-green-500 focus:border-green-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g. 5203981"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Pochi la Biashara Number
                </label>
                <input
                  type="text"
                  value={config.manual_pochi_number || ''}
                  onChange={e => setConfig({ ...config, manual_pochi_number: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-green-500 focus:border-green-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g. 0712 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Send Money Number
                </label>
                <input
                  type="text"
                  value={config.manual_send_money_number || ''}
                  onChange={e => setConfig({ ...config, manual_send_money_number: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-green-500 focus:border-green-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g. 0712 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Recipient Name (shown to customer)
                </label>
                <input
                  type="text"
                  value={config.manual_recipient_name || ''}
                  onChange={e => setConfig({ ...config, manual_recipient_name: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-green-500 focus:border-green-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="Name that appears in M-Pesa (for Pochi/Send Money)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Extra Note (optional)
                </label>
                <textarea
                  value={config.manual_payment_note || ''}
                  onChange={e => setConfig({ ...config, manual_payment_note: e.target.value })}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-green-500 focus:border-green-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g. Send the M-Pesa confirmation message here after paying."
                />
              </div>

              {/* Paid-confirmation webhook (event-driven receipt) */}
              <div className="md:col-span-2 mt-2 pt-5 border-t border-gray-200 dark:border-slate-700/60">
                <div className="flex items-center space-x-2 mb-1">
                  <Webhook className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <label className="block text-sm font-semibold text-gray-800 dark:text-slate-200">
                    Auto-send receipt when you mark an order paid
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                  Connect this URL to your Google Sheet/Airtable so the customer and you
                  automatically get a PAID PDF receipt the moment you set an order's Status to
                  <strong> paid</strong>. Optional — skip it if you're happy reconciling silently.
                </p>

                <div className="flex mt-1 rounded-md shadow-sm">
                  <div className="relative flex-grow focus-within:z-10 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-l-xl px-4 py-3 flex items-center overflow-hidden">
                    <code className="text-sm text-gray-800 dark:text-slate-300 truncate w-full">
                      {manualConfirmUrl}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={copyManualWebhook}
                    disabled={!config.webhook_secret}
                    className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-r-xl text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    {copiedManual ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedManual ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
                {!config.webhook_secret && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Save this configuration once to generate your secure URL.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setShowManualHelp(v => !v)}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 hover:underline"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showManualHelp ? 'Hide setup instructions' : 'Show setup instructions (Google Sheets / Airtable)'}
                </button>

                {showManualHelp && (
                  <div className="mt-3 space-y-4 text-xs text-gray-600 dark:text-slate-300">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-slate-200 mb-1">Google Sheets</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Open your Orders spreadsheet → <strong>Extensions → Apps Script</strong>.</li>
                        <li>Paste the script below, then <strong>Save</strong>.</li>
                        <li>Add an installable trigger: <strong>Triggers → Add Trigger → choose <code>onEdit</code> → From spreadsheet → On edit</strong>, then authorize.</li>
                        <li>Now setting a row's <strong>Status</strong> to <strong>paid</strong> sends the receipt automatically.</li>
                      </ol>
                      <pre className="mt-2 p-3 rounded-lg bg-gray-900 text-gray-100 overflow-x-auto text-[11px] leading-relaxed whitespace-pre">{appsScriptSnippet}</pre>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-slate-200 mb-1">Airtable</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Open your base → <strong>Automations → Create automation</strong>.</li>
                        <li>Trigger: <strong>When record matches conditions</strong> → Status <strong>is</strong> Paid.</li>
                        <li>Action: <strong>Run a script</strong> and POST to the URL above with a JSON body containing <code>order_id</code>, <code>status: "paid"</code>, and (optionally) <code>mpesa_code</code>, <code>amount</code>, <code>customer_phone</code> from the record.</li>
                      </ol>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400">
                      The receipt is idempotent — even if the automation fires more than once, each order is only sent once.
                      After a receipt is sent, we stamp a <code>Receipt Sent</code> column on the Orders row (created automatically),
                      and the script skips any row already marked sent. It also only fires when Status actually changes to <strong>paid</strong>,
                      so editing other columns never triggers it.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
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
