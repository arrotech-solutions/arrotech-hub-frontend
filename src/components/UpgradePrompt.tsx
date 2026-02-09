import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowUpRight, Sparkles } from 'lucide-react';

interface UpgradePromptProps {
    /** The feature that is gated */
    feature: string;
    /** Custom message to display */
    message?: string;
    /** Tier required to unlock (for display) */
    requiredTier?: 'starter' | 'business' | 'pro' | 'enterprise';
    /** Style variant */
    variant?: 'inline' | 'banner' | 'overlay';
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Optional class name */
    className?: string;
    /** Children to render (for overlay variant) */
    children?: React.ReactNode;
}

/**
 * Default upgrade messages for common features.
 */
const DEFAULT_MESSAGES: Record<string, { message: string; tier: 'starter' | 'business' | 'pro' | 'enterprise' }> = {
    inbox_send: { message: 'Upgrade to send and reply to messages', tier: 'starter' },
    inbox_ai_reply: { message: 'Upgrade for AI-assisted email replies', tier: 'business' },
    inbox_multi_client: { message: 'Upgrade for multi-client inbox management', tier: 'pro' },
    calendar_create_edit: { message: 'Upgrade to create and edit events', tier: 'starter' },
    calendar_smart_scheduler: { message: 'Upgrade to unlock Smart Scheduling', tier: 'business' },
    tasks_create_update: { message: 'Upgrade to create and update tasks', tier: 'starter' },
    tasks_analytics: { message: 'Upgrade for task analytics and tracking', tier: 'business' },
    tasks_multiple_tools: { message: 'Upgrade to sync multiple task tools', tier: 'business' },
    ai_reply: { message: 'Upgrade for AI-powered replies', tier: 'business' },
};

/**
 * Tier display names and colors.
 */
const TIER_INFO: Record<string, { name: string; color: string }> = {
    starter: { name: 'Starter', color: 'text-blue-600' },
    business: { name: 'Business', color: 'text-indigo-600' },
    pro: { name: 'Pro', color: 'text-purple-600' },
    enterprise: { name: 'Enterprise', color: 'text-amber-600' },
};

/**
 * UpgradePrompt component for displaying contextual upgrade messages.
 * Used when a feature is gated by the user's current subscription tier.
 */
export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
    feature,
    message: customMessage,
    requiredTier: customTier,
    variant = 'inline',
    size = 'md',
    className = '',
    children,
}) => {
    // Get default message and tier for the feature
    const defaults = DEFAULT_MESSAGES[feature] || { message: `Upgrade to unlock ${feature}`, tier: 'starter' };
    const message = customMessage || defaults.message;
    const tier = customTier || defaults.tier;
    const tierInfo = TIER_INFO[tier];

    // Size classes
    const sizeClasses = {
        sm: { text: 'text-xs', icon: 'w-3 h-3', padding: 'px-2 py-1', gap: 'gap-1' },
        md: { text: 'text-sm', icon: 'w-4 h-4', padding: 'px-3 py-2', gap: 'gap-2' },
        lg: { text: 'text-base', icon: 'w-5 h-5', padding: 'px-4 py-3', gap: 'gap-2' },
    };
    const sizes = sizeClasses[size];

    // Inline variant - simple text link
    if (variant === 'inline') {
        return (
            <div className={`flex items-center ${sizes.gap} ${className}`}>
                <Lock className={`${sizes.icon} text-gray-400`} />
                <span className={`${sizes.text} text-gray-500`}>{message}</span>
                <Link
                    to="/pricing"
                    className={`${sizes.text} font-medium ${tierInfo.color} hover:underline flex items-center gap-0.5`}
                >
                    View {tierInfo.name}
                    <ArrowUpRight className="w-3 h-3" />
                </Link>
            </div>
        );
    }

    // Banner variant - full-width banner
    if (variant === 'banner') {
        return (
            <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg ${sizes.padding} flex items-center justify-between ${className}`}>
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                        <Sparkles className={`${sizes.icon} text-indigo-600`} />
                    </div>
                    <div>
                        <p className={`${sizes.text} font-medium text-gray-800`}>{message}</p>
                        <p className="text-xs text-gray-500">Available in {tierInfo.name} plan and above</p>
                    </div>
                </div>
                <Link
                    to="/pricing"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                >
                    Upgrade Now
                    <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    // Overlay variant - blurred overlay on top of gated content
    if (variant === 'overlay') {
        return (
            <div className={`relative ${className}`}>
                {/* Blurred content */}
                <div className="opacity-50 pointer-events-none select-none blur-sm">
                    {children}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 text-center max-w-sm">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Upgrade to Unlock
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {message}
                        </p>
                        <Link
                            to="/pricing"
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            View Plans
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

interface FeatureGateProps {
    /** Feature name to check */
    feature: string;
    /** Whether user has access to this feature */
    hasAccess: boolean;
    /** Children to render when user has access */
    children: React.ReactNode;
    /** Fallback content when gated (optional, defaults to UpgradePrompt) */
    fallback?: React.ReactNode;
    /** Variant for the upgrade prompt */
    variant?: 'inline' | 'banner' | 'overlay';
}

/**
 * FeatureGate component that conditionally renders based on feature access.
 * Shows upgrade prompt when user doesn't have access.
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
    feature,
    hasAccess,
    children,
    fallback,
    variant = 'inline',
}) => {
    if (hasAccess) {
        return <>{children}</>;
    }

    // Use custom fallback or default upgrade prompt
    if (fallback) {
        return <>{fallback}</>;
    }

    if (variant === 'overlay') {
        return (
            <UpgradePrompt feature={feature} variant="overlay">
                {children}
            </UpgradePrompt>
        );
    }

    return <UpgradePrompt feature={feature} variant={variant} />;
};

export default UpgradePrompt;
