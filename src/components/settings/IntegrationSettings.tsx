import React, { useState } from 'react';
import { Database, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { IntegrationSettings } from '../../types';

interface IntegrationSettingsProps {
    settings: IntegrationSettings;
    onUpdate: (settings: IntegrationSettings) => void;
    expanded?: boolean;
    onToggle?: () => void;
}

const IntegrationSettingsTab: React.FC<IntegrationSettingsProps> = ({
    settings,
    onUpdate,
    expanded = true,
    onToggle
}) => {
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
                        <p className="text-gray-600">Manage third-party connections</p>
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
                    {/* Sync Frequency */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <RefreshCw className="w-5 h-5 text-orange-600" />
                            <h4 className="text-lg font-medium text-gray-900">Sync Frequency</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Auto-sync Interval
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
                </div>
            )}
        </div>
    );
};

export default IntegrationSettingsTab;
