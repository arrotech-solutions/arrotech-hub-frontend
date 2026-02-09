import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Workflow, AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react';

interface UsageMeterProps {
    /** Label for the meter */
    label: string;
    /** Current usage count */
    used: number;
    /** Usage limit */
    limit: number;
    /** Percentage used (0-100) */
    percentage?: number;
    /** Icon to display */
    icon?: 'ai' | 'automation';
    /** Whether to show upgrade prompt when at warning/limit */
    showUpgradePrompt?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Optional class name */
    className?: string;
}

/**
 * UsageMeter component for displaying AI actions and automation run usage.
 * Shows progress bar with color coding for warning (80%) and limit (100%) thresholds.
 */
export const UsageMeter: React.FC<UsageMeterProps> = ({
    label,
    used,
    limit,
    percentage: propPercentage,
    icon = 'ai',
    showUpgradePrompt = true,
    size = 'md',
    className = '',
}) => {
    // Calculate percentage if not provided
    const percentage = propPercentage ?? (limit > 0 ? Math.min((used / limit) * 100, 100) : 0);
    const isUnlimited = limit >= 999999;

    // Determine status
    const isAtLimit = percentage >= 100 && !isUnlimited;
    const isWarning = percentage >= 80 && percentage < 100 && !isUnlimited;
    const isHealthy = !isAtLimit && !isWarning;

    // Color classes based on status
    const getBarColor = () => {
        if (isAtLimit) return 'bg-red-500';
        if (isWarning) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const getTextColor = () => {
        if (isAtLimit) return 'text-red-600';
        if (isWarning) return 'text-amber-600';
        return 'text-gray-600';
    };

    const getBgColor = () => {
        if (isAtLimit) return 'bg-red-50 border-red-200';
        if (isWarning) return 'bg-amber-50 border-amber-200';
        return 'bg-gray-50 border-gray-200';
    };

    // Size classes
    const sizeClasses = {
        sm: {
            container: 'p-2',
            text: 'text-xs',
            bar: 'h-1.5',
            icon: 'w-3.5 h-3.5',
        },
        md: {
            container: 'p-3',
            text: 'text-sm',
            bar: 'h-2',
            icon: 'w-4 h-4',
        },
        lg: {
            container: 'p-4',
            text: 'text-base',
            bar: 'h-2.5',
            icon: 'w-5 h-5',
        },
    };

    const sizes = sizeClasses[size];
    const IconComponent = icon === 'ai' ? Zap : Workflow;

    // Format limit display
    const formatLimit = (val: number) => {
        if (val >= 999999) return '∞';
        if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
        return val.toLocaleString();
    };

    return (
        <div className={`rounded-lg border ${getBgColor()} ${sizes.container} ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <IconComponent className={`${sizes.icon} ${getTextColor()}`} />
                    <span className={`font-medium ${sizes.text} text-gray-700`}>{label}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`font-semibold ${sizes.text} ${getTextColor()}`}>
                        {used.toLocaleString()}
                    </span>
                    <span className={`${sizes.text} text-gray-400`}>/</span>
                    <span className={`${sizes.text} text-gray-500`}>
                        {formatLimit(limit)}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes.bar}`}>
                <div
                    className={`${getBarColor()} ${sizes.bar} rounded-full transition-all duration-300`}
                    style={{ width: `${isUnlimited ? 0 : Math.min(percentage, 100)}%` }}
                />
            </div>

            {/* Warning/Limit Message */}
            {!isUnlimited && (isAtLimit || isWarning) && showUpgradePrompt && (
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                        <AlertTriangle className={`w-3 h-3 ${isAtLimit ? 'text-red-500' : 'text-amber-500'}`} />
                        <span className={`text-xs ${isAtLimit ? 'text-red-600' : 'text-amber-600'}`}>
                            {isAtLimit ? 'Limit reached' : `${Math.round(percentage)}% used`}
                        </span>
                    </div>
                    <Link
                        to="/pricing"
                        className={`text-xs font-medium flex items-center gap-0.5 ${isAtLimit ? 'text-red-600 hover:text-red-700' : 'text-amber-600 hover:text-amber-700'
                            }`}
                    >
                        Upgrade <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>
            )}

            {/* Unlimited indicator */}
            {isUnlimited && (
                <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600">Unlimited</span>
                </div>
            )}
        </div>
    );
};

interface UsageMetersCardProps {
    aiActions?: {
        used: number;
        limit: number;
        percentage: number;
    };
    automationRuns?: {
        used: number;
        limit: number;
        percentage: number;
    };
    className?: string;
}

/**
 * Combined card showing both AI actions and automation runs usage.
 */
export const UsageMetersCard: React.FC<UsageMetersCardProps> = ({
    aiActions,
    automationRuns,
    className = '',
}) => {
    if (!aiActions && !automationRuns) return null;

    return (
        <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Monthly Usage
            </h3>
            <div className="space-y-3">
                {aiActions && (
                    <UsageMeter
                        label="AI Actions"
                        icon="ai"
                        used={aiActions.used}
                        limit={aiActions.limit}
                        percentage={aiActions.percentage}
                        size="sm"
                    />
                )}
                {automationRuns && (
                    <UsageMeter
                        label="Automation Runs"
                        icon="automation"
                        used={automationRuns.used}
                        limit={automationRuns.limit}
                        percentage={automationRuns.percentage}
                        size="sm"
                    />
                )}
            </div>
        </div>
    );
};

export default UsageMeter;
