import React, { useState } from 'react';
import { Zap, Activity, Clock, RefreshCw, ChevronDown, ChevronRight, Copy, Check, Lock, Globe, Eye, EyeOff } from 'lucide-react';
import { APISettings } from '../../types';
import toast from '../../lib/notify';

interface APISettingsProps {
    settings: APISettings;
    onUpdate: (settings: APISettings) => void;
    expanded?: boolean;
    onToggle?: () => void;
    // Explicitly passing user's API Key if available, or we might need to fetch it
    apiKey?: string;
    onRegenerateKey?: () => Promise<void>;
}

const APIKeyInput = ({
    label,
    value,
    onChange,
    placeholder
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) => {
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (value) {
            navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success(`${label} copied to clipboard`);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 transition-colors">{label}</label>
            <div className="relative">
                <input
                    type={showKey ? "text" : "password"}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-3 pr-20 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent font-mono text-sm transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                        title={showKey ? "Hide API Key" : "Show API Key"}
                    >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                        title="Copy API Key"
                        disabled={!value}
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

const APISettingsTab: React.FC<APISettingsProps> = ({
    settings,
    onUpdate,
    expanded = true,
    onToggle,
    apiKey,
    onRegenerateKey
}) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [copied, setCopied] = useState(false);

    const handleChange = (key: keyof APISettings, value: any) => {
        const newSettings = { ...localSettings, [key]: value };
        setLocalSettings(newSettings);
        onUpdate(newSettings);
    };

    const handleCopyKey = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey);
            setCopied(true);
            toast.success('API Key copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg transition-colors">
                        <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">API Settings</h3>
                        <p className="text-gray-600 dark:text-slate-400 transition-colors">Configure API access and limits</p>
                    </div>
                </div>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 transition-colors"
                    >
                        {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {expanded && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* API Key Section */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 relative overflow-hidden border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap className="w-24 h-24 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 transition-colors">Your API Key</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    readOnly
                                    value={apiKey || 'sk_live_.........................'}
                                    className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-sm rounded-lg focus:ring-purple-500 dark:focus:ring-purple-500/50 focus:border-purple-500 block p-3 pr-10 font-mono transition-colors"
                                />
                                <button
                                    onClick={handleCopyKey}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                    title="Copy API Key"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400 dark:text-slate-500" />}
                                </button>
                            </div>
                            <button
                                onClick={onRegenerateKey}
                                className="px-4 py-2 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium rounded-lg transition-colors text-sm whitespace-nowrap"
                            >
                                Regenerate Key
                            </button>
                        </div>
                        <p className="mt-3 text-xs text-gray-500 dark:text-slate-500 transition-colors">
                            Keep this key secret. It grants full access to your account via the API.
                        </p>
                    </div>

                    {/* Bring Your Own Key (BYOK) */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 relative overflow-hidden border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Globe className="w-24 h-24 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex items-center space-x-3 mb-4">
                            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Bring Your Own Key (BYOK)</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 transition-colors">
                            Provide your own API keys to bypass rate limits and use your own quotas.
                            These keys are prioritized over system defaults.
                        </p>

                        <div className="space-y-4">
                            {/* OpenAI */}
                            <APIKeyInput
                                label="OpenAI API Key"
                                value={localSettings.openai_api_key || ''}
                                onChange={(value) => handleChange('openai_api_key', value)}
                                placeholder="sk-..."
                            />

                            {/* Anthropic */}
                            <APIKeyInput
                                label="Anthropic API Key"
                                value={localSettings.anthropic_api_key || ''}
                                onChange={(value) => handleChange('anthropic_api_key', value)}
                                placeholder="sk-ant-..."
                            />

                            {/* Gemini */}
                            <APIKeyInput
                                label="Google Gemini API Key"
                                value={localSettings.gemini_api_key || ''}
                                onChange={(value) => handleChange('gemini_api_key', value)}
                                placeholder="AIza..."
                            />

                            {/* Hugging Face */}
                            <APIKeyInput
                                label="Hugging Face API Key"
                                value={localSettings.huggingface_api_key || ''}
                                onChange={(value) => handleChange('huggingface_api_key', value)}
                                placeholder="hf_..."
                            />

                            {/* Together AI */}
                            <APIKeyInput
                                label="Together AI API Key"
                                value={localSettings.together_api_key || ''}
                                onChange={(value) => handleChange('together_api_key', value)}
                                placeholder="xxxxxxxx..."
                            />
                        </div>
                    </div>

                    {/* Rate Limits */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Rate Limits</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                                    API Rate Limit (requests per minute)
                                </label>
                                <input
                                    type="number"
                                    value={localSettings.api_rate_limit}
                                    onChange={(e) => handleChange('api_rate_limit', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/50 focus:border-transparent transition-colors"
                                    min="1"
                                    max="1000"
                                />
                                <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Maximum API requests allowed per minute</p>
                            </div>
                        </div>
                    </div>

                    {/* Timeouts */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Timeouts</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                                    API Timeout (seconds)
                                </label>
                                <input
                                    type="number"
                                    value={localSettings.api_timeout}
                                    onChange={(e) => handleChange('api_timeout', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/50 focus:border-transparent transition-colors"
                                    min="1"
                                    max="300"
                                />
                                <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Maximum time to wait for API responses</p>
                            </div>
                        </div>
                    </div>

                    {/* Auto Refresh */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Auto Refresh</h4>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.auto_refresh_tokens}
                                    onChange={(e) => handleChange('auto_refresh_tokens', e.target.checked)}
                                    className="w-4 h-4 text-purple-600 dark:text-purple-500 border-gray-300 dark:border-slate-700 rounded focus:ring-purple-500 dark:bg-slate-900 transition-colors"
                                />
                                <span className="text-gray-700 dark:text-slate-300 transition-colors">Auto refresh tokens</span>
                            </label>
                            <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Automatically refresh API tokens when they expire</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default APISettingsTab;
