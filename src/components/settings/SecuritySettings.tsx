import React, { useState } from 'react';
import { Shield, Clock, Globe, ChevronDown, ChevronRight } from 'lucide-react';
import { SecuritySettings } from '../../types';

interface SecuritySettingsProps {
    settings: SecuritySettings;
    onUpdate: (settings: SecuritySettings) => void;
    expanded?: boolean;
    onToggle?: () => void;
}

const SecuritySettingsTab: React.FC<SecuritySettingsProps> = ({
    settings,
    onUpdate,
    expanded = true,
    onToggle
}) => {
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
                    {/* Two Factor Authentication - DISABLED FOR NOW (TODO: Enable when backend ready) */}
                    {/* 
          <div className="bg-gray-50 rounded-lg p-6 grayscale opacity-60 relative cursor-not-allowed">
            <div className="absolute inset-0 z-10" title="Coming Soon"></div>
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-5 h-5 text-red-600" />
              <h4 className="text-lg font-medium text-gray-900">Two Factor Authentication (Coming Soon)</h4>
            </div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.two_factor_enabled}
                  onChange={(e) => handleChange('two_factor_enabled', e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  disabled
                />
                <span className="text-gray-700">Enable two factor authentication</span>
              </label>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
          </div>
          */}

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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                                    rows={4}
                                    placeholder="192.168.1.1&#10;10.0.0.1"
                                />
                                <p className="text-sm text-gray-600">Restrict access to specific IP addresses (leave empty to allow all)</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecuritySettingsTab;
