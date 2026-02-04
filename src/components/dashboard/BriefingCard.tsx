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
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
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
            <div className={`${bgColor} ${borderColor} border rounded-xl p-4 animate-pulse`}>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-gray-200 rounded" />
                    <div className="w-32 h-4 bg-gray-200 rounded" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg">
                            <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
                            <div className="w-1/2 h-3 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`${bgColor} ${borderColor} border rounded-xl overflow-hidden transition-all duration-200`}>
            {/* Header */}
            <div
                className={`flex items-center justify-between p-4 ${isCollapsible ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                onClick={() => isCollapsible && setExpanded(!expanded)}
            >
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    {title}
                    {items.length > 0 && (
                        <span className="text-xs text-gray-400 font-normal">({items.length})</span>
                    )}
                </h3>
                {isCollapsible && (
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        {expanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
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
                                    className="group p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 hover:border-gray-200 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-gray-800 truncate">
                                                    {item.title}
                                                </span>
                                                {item.badge && (
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClasses[item.badge.color]}`}
                                                    >
                                                        {item.badge.text}
                                                    </span>
                                                )}
                                                {item.source && (
                                                    <span className="text-xs text-gray-400 font-mono bg-gray-200 px-1.5 py-0.5 rounded">
                                                        {item.source}
                                                    </span>
                                                )}
                                            </div>
                                            {item.subtitle && (
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                    {item.subtitle}
                                                </p>
                                            )}
                                            {item.meta && (
                                                <p className="text-xs text-gray-400 mt-1">{item.meta}</p>
                                            )}
                                        </div>

                                        {/* Item Actions */}
                                        {item.actions && item.actions.length > 0 && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                {item.actions.map((action, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onItemAction?.(item.id, action.action);
                                                        }}
                                                        disabled={processingAction === `${item.id}-${action.action}`}
                                                        className={`
                                                            px-2 py-1 text-xs rounded font-medium transition-all
                                                            ${action.variant === 'primary'
                                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                : action.variant === 'danger'
                                                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                                                            }
                                                            ${processingAction === `${item.id}-${action.action}` ? 'opacity-50 cursor-wait' : ''}
                                                        `}
                                                    >
                                                        {action.icon && <span className="mr-1">{action.icon}</span>}
                                                        {processingAction === `${item.id}-${action.action}`
                                                            ? '...'
                                                            : action.label}
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
