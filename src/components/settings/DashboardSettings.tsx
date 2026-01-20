import React, { useState } from 'react';
import { Monitor, Palette, Monitor as MonitorIcon, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { DashboardSettings } from '../../types';

interface DashboardSettingsProps {
    settings: DashboardSettings;
    onUpdate: (settings: DashboardSettings) => void;
    expanded?: boolean;
    onToggle?: () => void;
}

const DashboardSettingsTab: React.FC<DashboardSettingsProps> = ({
    settings,
    onUpdate,
    expanded = true,
    onToggle
}) => {
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

export default DashboardSettingsTab;
