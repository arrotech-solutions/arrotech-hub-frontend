import React from 'react';
import {
    Bell,
    Key,
    LayoutDashboard,
    Webhook,
    Shield,
    FileText,
    User
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
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <div className={`p-2 rounded-lg mr-3 transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100/50 text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-600'
                            }`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <span className="block font-semibold">{tab.name}</span>
                            <span className={`text-xs ${isActive ? 'text-blue-600/80' : 'text-gray-500'}`}>
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
