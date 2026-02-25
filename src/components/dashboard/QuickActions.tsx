import React, { useState } from 'react';
import { Mail, MessageSquare, Calendar, CheckSquare, Zap } from 'lucide-react';
import QuickActionModal, { ActionType } from './QuickActionModal';

interface QuickActionsProps {
    onCreateTask?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onCreateTask }) => {
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

    const handleActionClick = (type: ActionType) => {
        if (type === 'task' && onCreateTask) {
            onCreateTask();
        } else {
            setActiveAction(type);
        }
    };

    return (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/50 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-amber-50 dark:bg-amber-500/20 rounded-xl">
                    <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => handleActionClick(action.type)}
                        className={`group relative p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-white/50 dark:bg-slate-800/50 hover:border-indigo-100 dark:hover:border-indigo-500/30`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${action.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                        <div className="flex flex-col items-center space-y-3 relative z-10">
                            <div className={`p-4 rounded-2xl bg-gradient-to-br ${action.bg} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                <action.icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
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
