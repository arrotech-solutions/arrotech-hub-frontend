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

    // Interface preference states (synced with localStorage)
    const [showFloatingMenu, setShowFloatingMenu] = useState(() => localStorage.getItem('showFloatingMenu') !== 'false');
    const [showTutorials, setShowTutorials] = useState(() => localStorage.getItem('showTutorials') !== 'false');
    const [showAIAssistant, setShowAIAssistant] = useState(() => localStorage.getItem('showAIAssistant') !== 'false');
    const [showTutorialGuide, setShowTutorialGuide] = useState(() => localStorage.getItem('showTutorialGuide') !== 'false');
    const [showWhatsAppSupport, setShowWhatsAppSupport] = useState(() => localStorage.getItem('showWhatsAppSupport') !== 'false');

    const handleChange = (key: keyof DashboardSettings, value: any) => {
        const newSettings = { ...localSettings, [key]: value };
        setLocalSettings(newSettings);
        onUpdate(newSettings);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg transition-colors">
                        <Monitor className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Dashboard Settings</h3>
                        <p className="text-gray-600 dark:text-slate-400 transition-colors">Customize your dashboard appearance and layout</p>
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
                    {/* Theme */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Palette className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Theme</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                                    Dashboard Theme
                                </label>
                                <select
                                    value={localSettings.dashboard_theme}
                                    onChange={(e) => handleChange('dashboard_theme', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-500/50 focus:border-transparent transition-colors"
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="auto">Auto (System)</option>
                                </select>
                                <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Choose your preferred dashboard theme</p>
                            </div>
                        </div>
                    </div>

                    {/* Layout */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <MonitorIcon className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Layout</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                                    Dashboard Layout
                                </label>
                                <select
                                    value={localSettings.dashboard_layout}
                                    onChange={(e) => handleChange('dashboard_layout', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-500/50 focus:border-transparent transition-colors"
                                >
                                    <option value="default">Default</option>
                                    <option value="compact">Compact</option>
                                    <option value="detailed">Detailed</option>
                                </select>
                                <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Choose your preferred dashboard layout</p>
                            </div>
                        </div>
                    </div>

                    {/* Analytics */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Activity className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Analytics</h4>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.show_analytics}
                                    onChange={(e) => handleChange('show_analytics', e.target.checked)}
                                    className="w-4 h-4 text-green-600 dark:text-green-500 border-gray-300 dark:border-slate-700 rounded focus:ring-green-500 dark:bg-slate-900 transition-colors"
                                />
                                <span className="text-gray-700 dark:text-slate-300 transition-colors">Show analytics on dashboard</span>
                            </label>
                            <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Display analytics and performance metrics</p>
                        </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Activity className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Usage Statistics</h4>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.show_usage_stats}
                                    onChange={(e) => handleChange('show_usage_stats', e.target.checked)}
                                    className="w-4 h-4 text-green-600 dark:text-green-500 border-gray-300 dark:border-slate-700 rounded focus:ring-green-500 dark:bg-slate-900 transition-colors"
                                />
                                <span className="text-gray-700 dark:text-slate-300 transition-colors">Show usage statistics</span>
                            </label>
                            <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Display usage statistics and limits</p>
                        </div>
                    </div>

                    {/* Interface Preferences - Tutorials & AI Assistant */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <MonitorIcon className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Interface Preferences</h4>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="text-gray-700 dark:text-slate-300 font-medium transition-colors">Show Help & Resources Button</span>
                                    <p className="text-sm text-gray-500 dark:text-slate-500 transition-colors">Display the floating help button in the bottom right corner</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={showFloatingMenu}
                                    onChange={(e) => {
                                        setShowFloatingMenu(e.target.checked);
                                        localStorage.setItem('showFloatingMenu', e.target.checked.toString());
                                        window.dispatchEvent(new Event('storage'));
                                    }}
                                    className="w-4 h-4 text-green-600 dark:text-green-500 border-gray-300 dark:border-slate-700 rounded focus:ring-green-500 dark:bg-slate-900 transition-colors"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="text-gray-700 dark:text-slate-300 font-medium transition-colors">Enable Tutorials</span>
                                    <p className="text-sm text-gray-500 dark:text-slate-500 transition-colors">Show tutorial prompts and guided walkthroughs</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={showTutorials}
                                    onChange={(e) => {
                                        setShowTutorials(e.target.checked);
                                        localStorage.setItem('showTutorials', e.target.checked.toString());
                                        window.dispatchEvent(new Event('storage'));
                                    }}
                                    className="w-4 h-4 text-green-600 dark:text-green-500 border-gray-300 dark:border-slate-700 rounded focus:ring-green-500 dark:bg-slate-900 transition-colors"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="text-gray-700 dark:text-slate-300 font-medium transition-colors">Enable AI Assistant</span>
                                    <p className="text-sm text-gray-500 dark:text-slate-500 transition-colors">Show the AI assistant chat option</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={showAIAssistant}
                                    onChange={(e) => {
                                        setShowAIAssistant(e.target.checked);
                                        localStorage.setItem('showAIAssistant', e.target.checked.toString());
                                        window.dispatchEvent(new Event('storage'));
                                    }}
                                    className="w-4 h-4 text-green-600 dark:text-green-500 border-gray-300 dark:border-slate-700 rounded focus:ring-green-500 dark:bg-slate-900 transition-colors"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="text-gray-700 dark:text-slate-300 font-medium transition-colors">Enable WhatsApp Support</span>
                                    <p className="text-sm text-gray-500 dark:text-slate-500 transition-colors">Show the WhatsApp support option in the help menu</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={showWhatsAppSupport}
                                    onChange={(e) => {
                                        setShowWhatsAppSupport(e.target.checked);
                                        localStorage.setItem('showWhatsAppSupport', e.target.checked.toString());
                                        window.dispatchEvent(new Event('storage'));
                                    }}
                                    className="w-4 h-4 text-green-600 dark:text-green-500 border-gray-300 dark:border-slate-700 rounded focus:ring-green-500 dark:bg-slate-900 transition-colors"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="text-gray-700 dark:text-slate-300 font-medium transition-colors">Enable Tutorial Guide</span>
                                    <p className="text-sm text-gray-500 dark:text-slate-500 transition-colors">Show the interactive tutorial overlay and guided walkthroughs</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={showTutorialGuide}
                                    onChange={(e) => {
                                        setShowTutorialGuide(e.target.checked);
                                        localStorage.setItem('showTutorialGuide', e.target.checked.toString());
                                        window.dispatchEvent(new Event('storage'));
                                    }}
                                    className="w-4 h-4 text-green-600 dark:text-green-500 border-gray-300 dark:border-slate-700 rounded focus:ring-green-500 dark:bg-slate-900 transition-colors"
                                />
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardSettingsTab;
