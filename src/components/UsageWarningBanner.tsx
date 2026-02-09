import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X, Zap, Workflow, ArrowUpRight } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface UsageWarningBannerProps {
    /** Optional class name */
    className?: string;
}

/**
 * Persistent banner that shows when user is at 80%+ usage of their plan limits.
 * Displayed at the top of the layout as a dismissible warning.
 */
export const UsageWarningBanner: React.FC<UsageWarningBannerProps> = ({ className = '' }) => {
    const { usage, loading } = useSubscription();
    const [isDismissed, setIsDismissed] = useState(false);

    // Don't show if dismissed, loading, or no usage data
    if (isDismissed || loading || !usage) return null;

    const { ai_actions, automation_runs } = usage;

    // Check if ANY usage is at warning (80%+) or limit (100%+)
    const aiAtWarning = ai_actions && ai_actions.percentage >= 80;
    const automationAtWarning = automation_runs && automation_runs.percentage >= 80;
    const aiAtLimit = ai_actions && ai_actions.percentage >= 100;
    const automationAtLimit = automation_runs && automation_runs.percentage >= 100;

    // If neither at warning, don't show
    if (!aiAtWarning && !automationAtWarning) return null;

    // Determine overall severity
    const isAtLimit = aiAtLimit || automationAtLimit;
    const bannerBg = isAtLimit
        ? 'bg-gradient-to-r from-red-500 to-red-600'
        : 'bg-gradient-to-r from-amber-500 to-orange-500';

    // Build warning message
    const messages: string[] = [];
    if (aiAtLimit) {
        messages.push(`AI Actions: ${ai_actions?.used}/${ai_actions?.limit} (limit reached)`);
    } else if (aiAtWarning) {
        messages.push(`AI Actions: ${ai_actions?.used}/${ai_actions?.limit} (${Math.round(ai_actions?.percentage || 0)}%)`);
    }
    if (automationAtLimit) {
        messages.push(`Automation Runs: ${automation_runs?.used}/${automation_runs?.limit} (limit reached)`);
    } else if (automationAtWarning) {
        messages.push(`Automation Runs: ${automation_runs?.used}/${automation_runs?.limit} (${Math.round(automation_runs?.percentage || 0)}%)`);
    }

    return (
        <div className={`${bannerBg} text-white px-4 py-2.5 shadow-md ${className}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                {/* Warning Icon + Message */}
                <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-semibold text-sm">
                            {isAtLimit ? 'Usage Limit Reached' : 'Usage Warning'}
                        </span>
                    </div>

                    {/* Usage Details */}
                    <div className="flex items-center gap-4 text-sm text-white/90">
                        {aiAtWarning && ai_actions && (
                            <div className="flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5" />
                                <span>{ai_actions.used}/{ai_actions.limit}</span>
                            </div>
                        )}
                        {automationAtWarning && automation_runs && (
                            <div className="flex items-center gap-1">
                                <Workflow className="w-3.5 h-3.5" />
                                <span>{automation_runs.used}/{automation_runs.limit}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upgrade CTA */}
                <Link
                    to="/pricing"
                    className="shrink-0 bg-white/20 hover:bg-white/30 text-white font-medium text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                    Upgrade Now
                    <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>

                {/* Dismiss Button */}
                <button
                    onClick={() => setIsDismissed(true)}
                    className="shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
                    aria-label="Dismiss warning"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default UsageWarningBanner;
