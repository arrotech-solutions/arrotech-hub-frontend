import React, { useState } from 'react';
import { Zap, Activity, Clock, RefreshCw, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { APISettings } from '../../types';
import toast from 'react-hot-toast';

interface APISettingsProps {
    settings: APISettings;
    onUpdate: (settings: APISettings) => void;
    expanded?: boolean;
    onToggle?: () => void;
    // Explicitly passing user's API Key if available, or we might need to fetch it
    apiKey?: string;
    onRegenerateKey?: () => Promise<void>;
}

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
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">API Settings</h3>
                        <p className="text-gray-600">Configure API access and limits</p>
                    </div>
                </div>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {expanded && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* API Key Section */}
                    <div className="bg-gray-50 rounded-lg p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap className="w-24 h-24 text-purple-600" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Your API Key</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    readOnly
                                    value={apiKey || 'sk_live_.........................'}
                                    className="w-full bg-white border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-3 pr-10 font-mono"
                                />
                                <button
                                    onClick={handleCopyKey}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                                    title="Copy API Key"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                </button>
                            </div>
                            <button
                                onClick={onRegenerateKey}
                                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg transition-colors text-sm whitespace-nowrap"
                            >
                                Regenerate Key
                            </button>
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            Keep this key secret. It grants full access to your account via the API.
                        </p>
                    </div>

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

export default APISettingsTab;
