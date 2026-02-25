import React from 'react';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';

export interface BriefingAction {
    label: string;
    action: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
}

export interface BriefingCardItem {
    id: string;
    title: string;
    subtitle?: string;
    badge?: {
        text: string;
        color: 'red' | 'orange' | 'green' | 'blue' | 'purple' | 'gray';
    };
    meta?: string;
    actions?: BriefingAction[];
    source?: string;
}

interface BriefingCardProps {
    title: string;
    icon: LucideIcon;
    iconColor?: string;
    bgColor?: string;
    borderColor?: string;
    items: BriefingCardItem[];
    emptyMessage?: string;
    isCollapsible?: boolean;
    defaultExpanded?: boolean;
    onItemAction?: (itemId: string, action: string) => void;
    processingAction?: string | null;
    maxItems?: number;
    loading?: boolean;
}

const colorClasses = {
    red: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
    orange: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
    green: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
    gray: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400',
};

const BriefingCard: React.FC<BriefingCardProps> = ({
    title,
    icon: Icon,
    iconColor = 'text-indigo-500',
    bgColor = 'bg-white',
    borderColor = 'border-gray-200',
    items,
    emptyMessage = 'No items to display',
    isCollapsible = false,
    defaultExpanded = true,
    onItemAction,
    processingAction,
    maxItems,
    loading = false,
}) => {
    const [expanded, setExpanded] = React.useState(defaultExpanded);
    const displayItems = maxItems ? items.slice(0, maxItems) : items;
    const hiddenCount = maxItems ? Math.max(0, items.length - maxItems) : 0;

    // Skeleton loading state
    if (loading) {
        return (
            <div className={`${bgColor} dark:bg-slate-900 ${borderColor} dark:border-slate-800 border rounded-xl p-4 animate-pulse`}>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-gray-200 dark:bg-slate-800 rounded" />
                    <div className="w-32 h-4 bg-gray-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                            <div className="w-3/4 h-4 bg-gray-200 dark:bg-slate-800 rounded mb-2" />
                            <div className="w-1/2 h-3 bg-gray-100 dark:bg-slate-700 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`${bgColor} dark:bg-slate-900/50 ${borderColor} dark:border-slate-800 border rounded-xl overflow-hidden transition-all duration-200`}>
            {/* Header */}
            <div
                className={`flex items-center justify-between p-4 ${isCollapsible ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50' : ''}`}
                onClick={() => isCollapsible && setExpanded(!expanded)}
            >
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm tracking-tight">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    {title}
                    {items.length > 0 && (
                        <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">({items.length})</span>
                    )}
                </h3>
                {isCollapsible && (
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors">
                        {expanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                        )}
                    </button>
                )}
            </div>

            {/* Content */}
            {expanded && (
                <div className="px-4 pb-4">
                    {items.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4 italic">{emptyMessage}</p>
                    ) : (
                        <div className="space-y-2">
                            {displayItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="group p-3 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg border border-transparent dark:border-slate-800/50 hover:border-gray-200 dark:hover:border-slate-700 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-gray-800 dark:text-slate-200 truncate">
                                                    {item.title}
                                                </span>
                                                {item.badge && (
                                                    <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${colorClasses[item.badge.color]}`}
                                                    >
                                                        {item.badge.text}
                                                    </span>
                                                )}
                                                {item.source && (
                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold font-mono bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                                        {item.source}
                                                    </span>
                                                )}
                                            </div>
                                            {item.subtitle && (
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                    {item.subtitle}
                                                </p>
                                            )}
                                            {item.meta && (
                                                <p className="text-[10px] font-medium text-gray-400 dark:text-slate-500 mt-1 uppercase tracking-wide">{item.meta}</p>
                                            )}
                                        </div>

                                        {/* Item Actions */}
                                        {item.actions && item.actions.length > 0 && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                                {item.actions.map((action, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onItemAction?.(item.id, action.action);
                                                        }}
                                                        disabled={processingAction === `${item.id}-${action.action}`}
                                                        className={`
                                                            px-2.5 py-1 text-[10px] rounded font-bold transition-all
                                                            ${action.variant === 'primary'
                                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20'
                                                                : action.variant === 'danger'
                                                                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200'
                                                                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                                                            }
                                                            ${processingAction === `${item.id}-${action.action}` ? 'opacity-50 cursor-wait' : ''}
                                                            active:scale-[0.98]
                                                        `}
                                                    >
                                                        {action.icon && <span className="mr-1 inline-block align-middle">{action.icon}</span>}
                                                        <span className="align-middle">{processingAction === `${item.id}-${action.action}`
                                                            ? '...'
                                                            : action.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Show more indicator */}
                            {hiddenCount > 0 && (
                                <p className="text-xs text-gray-400 text-center pt-2">
                                    +{hiddenCount} more items
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BriefingCard;
