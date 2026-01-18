import React, { useState } from 'react';
import { Mail, MessageSquare, Calendar, CheckSquare, Zap } from 'lucide-react';
import QuickActionModal, { ActionType } from './QuickActionModal';

const QuickActions: React.FC = () => {
    const [activeAction, setActiveAction] = useState<ActionType>(null);

    const actions = [
        {
            icon: Mail,
            label: 'Compose Email',
            color: 'text-white',
            bg: 'from-blue-500 to-blue-600',
            type: 'email' as ActionType
        },
        {
            icon: MessageSquare,
            label: 'Send Message',
            color: 'text-white',
            bg: 'from-purple-500 to-purple-600',
            type: 'slack' as ActionType
        },
        {
            icon: Calendar,
            label: 'Schedule Event',
            color: 'text-white',
            bg: 'from-emerald-500 to-emerald-600',
            type: 'calendar' as ActionType
        },
        {
            icon: CheckSquare,
            label: 'Create Task',
            color: 'text-white',
            bg: 'from-orange-500 to-orange-600',
            type: 'task' as ActionType
        },
    ];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg">
                    <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveAction(action.type)}
                        className={`group relative p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-white`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${action.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                        <div className="flex flex-col items-center space-y-3 relative z-10">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${action.bg} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                <action.icon className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                                {action.label}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {activeAction && (
                <QuickActionModal
                    type={activeAction}
                    isOpen={!!activeAction}
                    onClose={() => setActiveAction(null)}
                    onSuccess={() => setActiveAction(null)}
                />
            )}
        </div>
    );
};

export default QuickActions;
