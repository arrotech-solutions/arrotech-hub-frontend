import React, { useEffect, useState } from 'react';
import { Bell, Mail, MessageSquare, Webhook, ChevronDown, ChevronRight, Moon } from 'lucide-react';
import { NotificationCategoryChannels, NotificationRules, NotificationSettings, QuietHours } from '../../types';

interface NotificationSettingsProps {
    settings: NotificationSettings;
    onUpdate: (settings: NotificationSettings) => void;
    expanded?: boolean;
    onToggle?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
    billing: 'Billing & subscriptions',
    security: 'Security & account',
    workflows: 'Workflows & automations',
    agents: 'Agents',
    messaging: 'Messaging & inbox',
    commerce: 'Orders & payments',
    marketplace: 'Marketplace & creator',
    system: 'System',
};

const CHANNELS: Array<keyof NotificationCategoryChannels> = ['in_app', 'email', 'slack', 'webhook'];
const CHANNEL_LABELS: Record<string, string> = {
    in_app: 'In-app',
    email: 'Email',
    slack: 'Slack',
    webhook: 'Webhook',
};

const defaultRules = (): NotificationRules =>
    Object.fromEntries(
        Object.keys(CATEGORY_LABELS).map((id) => [
            id,
            { in_app: true, email: id !== 'messaging' && id !== 'agents', slack: false, webhook: false },
        ])
    );

const NotificationSettingsTab: React.FC<NotificationSettingsProps> = ({
    settings,
    onUpdate,
    expanded = true,
    onToggle
}) => {
    const [localSettings, setLocalSettings] = useState<NotificationSettings>({
        ...settings,
        notification_rules: settings.notification_rules || defaultRules(),
        quiet_hours: settings.quiet_hours || { start: '', end: '', timezone: 'Africa/Nairobi' },
        digest_email_daily: settings.digest_email_daily ?? false,
    });
    const [webhookUrl, setWebhookUrl] = useState(settings.notification_webhook_url || '');

    useEffect(() => {
        setLocalSettings({
            ...settings,
            notification_rules: settings.notification_rules || defaultRules(),
            quiet_hours: settings.quiet_hours || { start: '', end: '', timezone: 'Africa/Nairobi' },
            digest_email_daily: settings.digest_email_daily ?? false,
        });
        setWebhookUrl(settings.notification_webhook_url || '');
    }, [settings]);

    const pushUpdate = (next: NotificationSettings) => {
        setLocalSettings(next);
        onUpdate(next);
    };

    const handleChange = (key: keyof NotificationSettings, value: unknown) => {
        pushUpdate({ ...localSettings, [key]: value });
    };

    const handleWebhookChange = (url: string) => {
        setWebhookUrl(url);
        handleChange('notification_webhook_url', url);
    };

    const updateRule = (category: string, channel: keyof NotificationCategoryChannels, value: boolean) => {
        const rules = { ...(localSettings.notification_rules || defaultRules()) };
        rules[category] = { ...(rules[category] || { in_app: true, email: false, slack: false, webhook: false }), [channel]: value };
        handleChange('notification_rules', rules);
    };

    const updateQuietHours = (patch: Partial<QuietHours>) => {
        handleChange('quiet_hours', { ...(localSettings.quiet_hours || {}), ...patch });
    };

    const rules = localSettings.notification_rules || defaultRules();
    const categories = settings.categories?.length
        ? settings.categories
        : Object.keys(CATEGORY_LABELS).map((id) => ({ id, label: CATEGORY_LABELS[id] }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-colors">
                        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Notification Settings</h3>
                        <p className="text-gray-600 dark:text-slate-400 transition-colors">Choose channels and categories for alerts</p>
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
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Channel masters</h4>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.email_notifications}
                                    onChange={(e) => handleChange('email_notifications', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-slate-900"
                                />
                                <span className="text-gray-700 dark:text-slate-300">Enable email notifications</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.slack_notifications}
                                    onChange={(e) => handleChange('slack_notifications', e.target.checked)}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 dark:bg-slate-900"
                                />
                                <span className="text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Enable Slack notifications
                                </span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.webhook_notifications}
                                    onChange={(e) => handleChange('webhook_notifications', e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 dark:bg-slate-900"
                                />
                                <span className="text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                    <Webhook className="w-4 h-4" /> Enable webhook notifications
                                </span>
                            </label>
                            {localSettings.webhook_notifications && (
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Webhook URL</label>
                                    <input
                                        type="url"
                                        value={webhookUrl}
                                        onChange={(e) => handleWebhookChange(e.target.value)}
                                        placeholder="https://example.com/hooks/hub"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 overflow-x-auto">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Category × channel</h4>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                            Critical security and billing events still create in-app alerts even if email is off.
                        </p>
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                                    <th className="py-2 pr-4 font-medium">Category</th>
                                    {CHANNELS.map((ch) => (
                                        <th key={ch} className="py-2 px-2 font-medium text-center">{CHANNEL_LABELS[ch]}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat) => (
                                    <tr key={cat.id} className="border-b border-gray-100 dark:border-slate-800">
                                        <td className="py-3 pr-4 text-gray-800 dark:text-slate-200">{cat.label || CATEGORY_LABELS[cat.id] || cat.id}</td>
                                        {CHANNELS.map((ch) => (
                                            <td key={ch} className="py-3 px-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(rules[cat.id]?.[ch])}
                                                    onChange={(e) => updateRule(cat.id, ch, e.target.checked)}
                                                    disabled={
                                                        (ch === 'email' && !localSettings.email_notifications) ||
                                                        (ch === 'slack' && !localSettings.slack_notifications) ||
                                                        (ch === 'webhook' && !localSettings.webhook_notifications)
                                                    }
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50">
                        <div className="flex items-center space-x-3 mb-4">
                            <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Quiet hours & digest</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Start</label>
                                <input
                                    type="time"
                                    value={localSettings.quiet_hours?.start || ''}
                                    onChange={(e) => updateQuietHours({ start: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">End</label>
                                <input
                                    type="time"
                                    value={localSettings.quiet_hours?.end || ''}
                                    onChange={(e) => updateQuietHours({ end: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Timezone</label>
                                <input
                                    type="text"
                                    value={localSettings.quiet_hours?.timezone || 'UTC'}
                                    onChange={(e) => updateQuietHours({ timezone: e.target.value })}
                                    placeholder="Africa/Nairobi"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                                />
                            </div>
                        </div>
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={Boolean(localSettings.digest_email_daily)}
                                onChange={(e) => handleChange('digest_email_daily', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700 dark:text-slate-300">
                                Prefer daily digest for low-priority email (messaging, marketplace, workflows)
                            </span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationSettingsTab;
