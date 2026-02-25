import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Webhook, ChevronDown, ChevronRight } from 'lucide-react';
import { NotificationSettings } from '../../types';

interface NotificationSettingsProps {
    settings: NotificationSettings;
    onUpdate: (settings: NotificationSettings) => void;
    expanded?: boolean;
    onToggle?: () => void;
}

const NotificationSettingsTab: React.FC<NotificationSettingsProps> = ({
    settings,
    onUpdate,
    expanded = true,
    onToggle
}) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [webhookUrl, setWebhookUrl] = useState(settings.notification_webhook_url || '');

    const handleChange = (key: keyof NotificationSettings, value: any) => {
        const newSettings = { ...localSettings, [key]: value };
        setLocalSettings(newSettings);
        onUpdate(newSettings);
    };

    const handleWebhookChange = (url: string) => {
        setWebhookUrl(url);
        handleChange('notification_webhook_url', url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-colors">
                        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Notification Settings</h3>
                        <p className="text-gray-600 dark:text-slate-400 transition-colors">Configure how you receive notifications</p>
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
                    {/* Email Notifications */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Email Notifications</h4>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.email_notifications}
                                    onChange={(e) => handleChange('email_notifications', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-slate-700 rounded focus:ring-blue-500 dark:bg-slate-900 transition-colors"
                                />
                                <span className="text-gray-700 dark:text-slate-300 transition-colors">Enable email notifications</span>
                            </label>
                            <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Receive important updates and alerts via email</p>
                        </div>
                    </div>

                    {/* Slack Notifications */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Slack Notifications</h4>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.slack_notifications}
                                    onChange={(e) => handleChange('slack_notifications', e.target.checked)}
                                    className="w-4 h-4 text-purple-600 dark:text-purple-500 border-gray-300 dark:border-slate-700 rounded focus:ring-purple-500 dark:bg-slate-900 transition-colors"
                                />
                                <span className="text-gray-700 dark:text-slate-300 transition-colors">Enable Slack notifications</span>
                            </label>
                            <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Receive notifications in your Slack workspace</p>
                        </div>
                    </div>

                    {/* Webhook Notifications */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Webhook className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Webhook Notifications</h4>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.webhook_notifications}
                                    onChange={(e) => handleChange('webhook_notifications', e.target.checked)}
                                    className="w-4 h-4 text-green-600 dark:text-green-500 border-gray-300 dark:border-slate-700 rounded focus:ring-green-500 dark:bg-slate-900 transition-colors"
                                />
                                <span className="text-gray-700 dark:text-slate-300 transition-colors">Enable webhook notifications</span>
                            </label>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors">
                                    Webhook URL
                                </label>
                                <input
                                    type="url"
                                    value={webhookUrl}
                                    onChange={(e) => handleWebhookChange(e.target.value)}
                                    placeholder="https://your-webhook-url.com"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                />
                                <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">URL to send webhook notifications to</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationSettingsTab;
