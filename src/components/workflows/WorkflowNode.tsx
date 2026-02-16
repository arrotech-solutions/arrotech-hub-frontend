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
    'Fintech': { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CreditCard, text: 'text-emerald-600', glow: 'shadow-emerald-200/50' },
    'E-commerce': { bg: 'bg-blue-50', border: 'border-blue-200', icon: ShoppingBag, text: 'text-blue-600', glow: 'shadow-blue-200/50' },
    'Accounting': { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: FileText, text: 'text-indigo-600', glow: 'shadow-indigo-200/50' },
    'Logistics': { bg: 'bg-amber-50', border: 'border-amber-200', icon: Truck, text: 'text-amber-600', glow: 'shadow-amber-200/50' },
    'Human Resources': { bg: 'bg-rose-50', border: 'border-rose-200', icon: Users, text: 'text-rose-600', glow: 'shadow-rose-200/50' },
    'Agritech': { bg: 'bg-green-50', border: 'border-green-200', icon: Leaf, text: 'text-green-600', glow: 'shadow-green-200/50' },
    'Healthtech': { bg: 'bg-red-50', border: 'border-red-200', icon: Activity, text: 'text-red-600', glow: 'shadow-red-200/50' },
    'Slack': { bg: 'bg-purple-50', border: 'border-purple-200', icon: Users, text: 'text-purple-600', glow: 'shadow-purple-200/50' },
    'HubSpot': { bg: 'bg-orange-50', border: 'border-orange-200', icon: BarChart3, text: 'text-orange-600', glow: 'shadow-orange-200/50' },
    'Analytics': { bg: 'bg-blue-50', border: 'border-blue-200', icon: BarChart3, text: 'text-blue-600', glow: 'shadow-blue-200/50' },
    'Communication': { bg: 'bg-green-50', border: 'border-green-200', icon: Users, text: 'text-green-600', glow: 'shadow-green-200/50' },
    'File Management': { bg: 'bg-purple-50', border: 'border-purple-200', icon: FileText, text: 'text-purple-600', glow: 'shadow-purple-200/50' },
    'Web Tools': { bg: 'bg-orange-50', border: 'border-orange-200', icon: Globe, text: 'text-orange-600', glow: 'shadow-orange-200/50' },
    'Content Creation': { bg: 'bg-pink-50', border: 'border-pink-200', icon: Palette, text: 'text-pink-600', glow: 'shadow-pink-200/50' },
    'Advanced': { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: Zap, text: 'text-indigo-600', glow: 'shadow-indigo-200/50' },
    'Enterprise': { bg: 'bg-red-50', border: 'border-red-200', icon: Shield, text: 'text-red-600', glow: 'shadow-red-200/50' },
    'General': { bg: 'bg-gray-50', border: 'border-gray-200', icon: Settings, text: 'text-gray-600', glow: 'shadow-gray-200/50' },
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
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl px-6 py-4 min-w-[200px] shadow-lg shadow-purple-200/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-purple-300/50 group-hover:-translate-y-0.5">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
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
        ${style.bg} ${style.border} border-2 rounded-2xl min-w-[220px] max-w-[280px]
        shadow-md ${style.glow} transition-all duration-300
        group-hover:shadow-lg
      `}>
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5">
                    <div className="flex items-center space-x-2">
                        <GripVertical className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Step {stepNumber}
                        </span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-400' : 'bg-amber-400'} ${isConfigured ? '' : 'animate-pulse'}`} />
                </div>

                {/* Body */}
                <div className="px-4 py-3">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-xl bg-white border ${style.border}`}>
                            <IconComponent className={`w-4.5 h-4.5 ${style.text}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{label}</p>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">{toolName}</p>
                        </div>
                    </div>
                    {description && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{description}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-black/5 flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${style.text}`}>
                        {category}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isConfigured ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isConfigured ? 'Ready' : 'Configure'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default memo(WorkflowNodeComponent);
