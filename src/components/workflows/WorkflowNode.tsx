import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
    Zap, Play, Clock, Webhook, MousePointer,
    CreditCard, ShoppingBag, FileText, Truck, Users,
    Leaf, Activity, Settings, Globe, Palette, Shield,
    BarChart3, GripVertical
} from 'lucide-react';

// Map category names to colors + icons (reuses TOOL_CATEGORIES logic)
const CATEGORY_STYLES: Record<string, { bg: string; border: string; icon: any; text: string; glow: string }> = {
    'Fintech': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icon: CreditCard, text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-emerald-200/50 dark:shadow-emerald-900/50' },
    'E-commerce': { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', icon: ShoppingBag, text: 'text-blue-600 dark:text-blue-400', glow: 'shadow-blue-200/50 dark:shadow-blue-900/50' },
    'Accounting': { bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20', icon: FileText, text: 'text-indigo-600 dark:text-indigo-400', glow: 'shadow-indigo-200/50 dark:shadow-indigo-900/50' },
    'Logistics': { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', icon: Truck, text: 'text-amber-600 dark:text-amber-400', glow: 'shadow-amber-200/50 dark:shadow-amber-900/50' },
    'Human Resources': { bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', icon: Users, text: 'text-rose-600 dark:text-rose-400', glow: 'shadow-rose-200/50 dark:shadow-rose-900/50' },
    'Agritech': { bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/20', icon: Leaf, text: 'text-green-600 dark:text-green-400', glow: 'shadow-green-200/50 dark:shadow-green-900/50' },
    'Healthtech': { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20', icon: Activity, text: 'text-red-600 dark:text-red-400', glow: 'shadow-red-200/50 dark:shadow-red-900/50' },
    'Slack': { bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', icon: Users, text: 'text-purple-600 dark:text-purple-400', glow: 'shadow-purple-200/50 dark:shadow-purple-900/50' },
    'HubSpot': { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', icon: BarChart3, text: 'text-orange-600 dark:text-orange-400', glow: 'shadow-orange-200/50 dark:shadow-orange-900/50' },
    'Analytics': { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', icon: BarChart3, text: 'text-blue-600 dark:text-blue-400', glow: 'shadow-blue-200/50 dark:shadow-blue-900/50' },
    'Communication': { bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/20', icon: Users, text: 'text-green-600 dark:text-green-400', glow: 'shadow-green-200/50 dark:shadow-green-900/50' },
    'File Management': { bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', icon: FileText, text: 'text-purple-600 dark:text-purple-400', glow: 'shadow-purple-200/50 dark:shadow-purple-900/50' },
    'Web Tools': { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', icon: Globe, text: 'text-orange-600 dark:text-orange-400', glow: 'shadow-orange-200/50 dark:shadow-orange-900/50' },
    'Content Creation': { bg: 'bg-pink-50 dark:bg-pink-500/10', border: 'border-pink-200 dark:border-pink-500/20', icon: Palette, text: 'text-pink-600 dark:text-pink-400', glow: 'shadow-pink-200/50 dark:shadow-pink-900/50' },
    'Advanced': { bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20', icon: Zap, text: 'text-indigo-600 dark:text-indigo-400', glow: 'shadow-indigo-200/50 dark:shadow-indigo-900/50' },
    'Enterprise': { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20', icon: Shield, text: 'text-red-600 dark:text-red-400', glow: 'shadow-red-200/50 dark:shadow-red-900/50' },
    'General': { bg: 'bg-gray-50 dark:bg-gray-500/10', border: 'border-gray-200 dark:border-gray-500/20', icon: Settings, text: 'text-gray-600 dark:text-gray-400', glow: 'shadow-gray-200/50 dark:shadow-gray-900/50' },
};

const TRIGGER_ICONS: Record<string, any> = {
    'manual': MousePointer,
    'scheduled': Clock,
    'webhook': Webhook,
    'event': Play,
};

export interface WorkflowNodeData {
    label: string;
    toolName: string;
    category: string;
    description: string;
    stepNumber: number;
    isConfigured: boolean;
    isTrigger?: boolean;
    triggerType?: string;
    parameters?: Record<string, any>;
    [key: string]: unknown;
}

const WorkflowNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
    const nodeData = data as unknown as WorkflowNodeData;
    const { label, toolName, category, description, stepNumber, isConfigured, isTrigger, triggerType } = nodeData;

    // Trigger node
    if (isTrigger) {
        const TriggerIcon = TRIGGER_ICONS[triggerType || 'manual'] || Play;
        return (
            <div className={`
        relative group cursor-pointer
        ${selected ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
      `}>
                <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !-bottom-1.5" />
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 rounded-2xl px-6 py-4 min-w-[200px] shadow-xl shadow-purple-500/20 dark:shadow-purple-900/40 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-purple-500/30 group-hover:-translate-y-1">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 dark:bg-black/20 rounded-xl backdrop-blur-md border border-white/20">
                            <TriggerIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Trigger</p>
                            <p className="text-sm font-bold text-white capitalize">{triggerType || 'Manual'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Regular step node
    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['General'];
    const IconComponent = style.icon;

    return (
        <div className={`
      relative group cursor-pointer transition-all duration-300
      ${selected ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.02]' : 'hover:-translate-y-0.5'}
    `}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !-top-1.5" />
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !-bottom-1.5" />

            <div className={`
        bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 ${style.border} rounded-2xl min-w-[240px] max-w-[300px]
        shadow-xl shadow-black/5 dark:shadow-black/20 transition-all duration-300
        group-hover:shadow-2xl group-hover:${style.glow}
      `}>
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/30 rounded-t-2xl">
                    <div className="flex items-center space-x-2 w-full">
                        <GripVertical className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex-1">
                            Step {stepNumber}
                        </span>
                        <div className={`w-2 h-2 rounded-full shadow-sm ${isConfigured ? 'bg-green-500 shadow-green-500/50' : 'bg-amber-500 shadow-amber-500/50'} ${isConfigured ? '' : 'animate-pulse'}`} />
                    </div>
                </div>

                {/* Body */}
                <div className="px-4 py-4">
                    <div className="flex items-start space-x-3 mb-2">
                        <div className={`p-2.5 rounded-xl ${style.bg} border ${style.border} shadow-inner`}>
                            <IconComponent className={`w-5 h-5 ${style.text}`} />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">{label}</p>
                            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5 truncate">{toolName}</p>
                        </div>
                    </div>
                    {description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mt-3">{description}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/30 rounded-b-2xl flex items-center justify-between">
                    <span className={`text-[9.5px] font-black uppercase tracking-widest ${style.text}`}>
                        {category}
                    </span>
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md shadow-sm ${isConfigured ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'}`}>
                        {isConfigured ? 'Ready' : 'Configure'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default memo(WorkflowNodeComponent);
