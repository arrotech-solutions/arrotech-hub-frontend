import React from 'react';
import {
    Bell,
    Key,
    LayoutDashboard,
    Webhook,
    Shield,
    FileText,
    User,
    Smartphone
} from 'lucide-react';

interface SettingsSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const tabs = [
    {
        id: 'profile',
        name: 'Profile',
        icon: User,
        description: 'Manage your personal info'
    },
    {
        id: 'notifications',
        name: 'Notifications',
        icon: Bell,
        description: 'Configure alerts & emails'
    },
    {
        id: 'api',
        name: 'API Keys',
        icon: Key,
        description: 'Manage API tokens'
    },
    {
        id: 'dashboard',
        name: 'Dashboard',
        icon: LayoutDashboard,
        description: 'Customize your view'
    },
    {
        id: 'integrations',
        name: 'Integrations',
        icon: Webhook,
        description: 'Connected services'
    },
    {
        id: 'mpesa',
        name: 'M-Pesa Webhooks',
        icon: Smartphone,
        description: 'Configure tenant DARAJA'
    },
    {
        id: 'security',
        name: 'Security',
        icon: Shield,
        description: '2FA & Access controls'
    },
    {
        id: 'data',
        name: 'Data & Privacy',
        icon: FileText,
        description: 'Export or delete data'
    }
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="space-y-1">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-sm'
                            : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <div className={`p-2 rounded-lg mr-3 transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100/50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 group-hover:bg-gray-100 dark:group-hover:bg-slate-700 group-hover:text-gray-600 dark:group-hover:text-slate-300'
                            }`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <span className="block font-semibold transition-colors">{tab.name}</span>
                            <span className={`text-xs transition-colors ${isActive ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-gray-500 dark:text-slate-500'}`}>
                                {tab.description}
                            </span>
                        </div>
                    </button>
                );
            })}
        </nav>
    );
};

export default SettingsSidebar;
