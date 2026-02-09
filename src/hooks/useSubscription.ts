import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import apiService from '../services/api';

/**
 * Subscription tiers matching backend SubscriptionTier enum.
 * Updated to match Master Implementation Prompt.
 */
export type SubscriptionTier = 'free' | 'starter' | 'business' | 'pro' | 'enterprise';

/**
 * Usage metrics for a specific limit type (AI actions, automation runs).
 */
export interface UsageMetric {
    used: number;
    limit: number;
    percentage: number;
    warning: boolean;
    at_limit: boolean;
}

/**
 * Current billing period.
 */
export interface UsagePeriod {
    start: string;
    end: string;
}

/**
 * Full usage statistics from the API.
 */
export interface UsageStats {
    active_workflows: number;
    daily_messages: number;
    connections: number;
    ai_actions: UsageMetric;
    automation_runs: UsageMetric;
    period: UsagePeriod;
}

/**
 * Plan limits configuration (matches backend feature_flags.py).
 */
export interface PlanLimits {
    // Usage limits
    ai_actions_monthly: number;
    automation_runs_monthly: number;
    max_active_workflows: number;
    team_members: number;

    // Provider limits
    email_providers: number;
    messaging_providers: number;
    calendar_providers: number;
    task_providers: number;

    // Feature flags
    inbox_read: boolean;
    inbox_send: boolean;
    inbox_ai_reply: boolean;
    inbox_multi_client: boolean;
    calendar_view: boolean;
    calendar_create_edit: boolean;
    calendar_smart_scheduler: boolean;
    tasks_view: boolean;
    tasks_create_update: boolean;
    tasks_multiple_tools: boolean;
    tasks_analytics: boolean;

    // Support
    support_level: string;

    // Allowed connections
    allowed_connections: string[];
}

/**
 * Local plan limits configuration matching backend.
 */
export const PLAN_LIMITS: Record<SubscriptionTier, Partial<PlanLimits>> = {
    free: {
        ai_actions_monthly: 100,
        automation_runs_monthly: 500,
        max_active_workflows: 3,
        team_members: 1,
        email_providers: 1,
        messaging_providers: 1,
        calendar_providers: 1,
        task_providers: 1,
        inbox_read: true,
        inbox_send: false,
        inbox_ai_reply: false,
        inbox_multi_client: false,
        calendar_view: true,
        calendar_create_edit: false,
        calendar_smart_scheduler: false,
        tasks_view: true,
        tasks_create_update: false,
        tasks_multiple_tools: false,
        tasks_analytics: false,
        support_level: 'community',
        allowed_connections: ['gmail', 'outlook', 'slack', 'microsoft_teams', 'whatsapp', 'google_calendar', 'jira', 'trello', 'asana', 'clickup'],
    },
    starter: {
        ai_actions_monthly: 500,
        automation_runs_monthly: 2000,
        max_active_workflows: 5,
        team_members: 1,
        email_providers: 2,
        messaging_providers: 2,
        calendar_providers: 2,
        task_providers: 1,
        inbox_read: true,
        inbox_send: true,
        inbox_ai_reply: false,
        inbox_multi_client: false,
        calendar_view: true,
        calendar_create_edit: true,
        calendar_smart_scheduler: false,
        tasks_view: true,
        tasks_create_update: true,
        tasks_multiple_tools: false,
        tasks_analytics: false,
        support_level: 'email',
        allowed_connections: ['*'],
    },
    business: {
        ai_actions_monthly: 2000,
        automation_runs_monthly: 15000,
        max_active_workflows: 30,
        team_members: 3,
        email_providers: 5,
        messaging_providers: 5,
        calendar_providers: 5,
        task_providers: 5,
        inbox_read: true,
        inbox_send: true,
        inbox_ai_reply: true,
        inbox_multi_client: false,
        calendar_view: true,
        calendar_create_edit: true,
        calendar_smart_scheduler: true,
        tasks_view: true,
        tasks_create_update: true,
        tasks_multiple_tools: true,
        tasks_analytics: true,
        support_level: 'priority',
        allowed_connections: ['*'],
    },
    pro: {
        ai_actions_monthly: 5000,
        automation_runs_monthly: 50000,
        max_active_workflows: 999999,
        team_members: 10,
        email_providers: 999999,
        messaging_providers: 999999,
        calendar_providers: 999999,
        task_providers: 999999,
        inbox_read: true,
        inbox_send: true,
        inbox_ai_reply: true,
        inbox_multi_client: true,
        calendar_view: true,
        calendar_create_edit: true,
        calendar_smart_scheduler: true,
        tasks_view: true,
        tasks_create_update: true,
        tasks_multiple_tools: true,
        tasks_analytics: true,
        support_level: 'dedicated',
        allowed_connections: ['*'],
    },
    enterprise: {
        ai_actions_monthly: 999999,
        automation_runs_monthly: 999999,
        max_active_workflows: 999999,
        team_members: 999999,
        email_providers: 999999,
        messaging_providers: 999999,
        calendar_providers: 999999,
        task_providers: 999999,
        inbox_read: true,
        inbox_send: true,
        inbox_ai_reply: true,
        inbox_multi_client: true,
        calendar_view: true,
        calendar_create_edit: true,
        calendar_smart_scheduler: true,
        tasks_view: true,
        tasks_create_update: true,
        tasks_multiple_tools: true,
        tasks_analytics: true,
        support_level: 'dedicated_account_manager',
        allowed_connections: ['*'],
    },
};

/**
 * Tier display information for UI.
 */
export const TIER_INFO: Record<SubscriptionTier, { name: string; tagline: string; color: string }> = {
    free: { name: 'Free', tagline: 'Unified Visibility', color: 'gray' },
    starter: { name: 'Starter', tagline: 'Unified Action', color: 'blue' },
    business: { name: 'Business', tagline: 'Unified Operations', color: 'indigo' },
    pro: { name: 'Pro / Agency', tagline: 'Unified Command Center', color: 'purple' },
    enterprise: { name: 'Enterprise', tagline: 'Custom Solution', color: 'amber' },
};

/**
 * Upgrade messages for gated features.
 */
export const UPGRADE_MESSAGES: Record<string, string> = {
    inbox_send: 'Upgrade to Starter to send and reply to messages',
    inbox_ai_reply: 'Upgrade to Business for AI-assisted replies',
    inbox_multi_client: 'Upgrade to Pro for multi-client inbox management',
    calendar_create_edit: 'Upgrade to Starter to create and edit events',
    calendar_smart_scheduler: 'Upgrade to Business to unlock Smart Scheduling',
    tasks_create_update: 'Upgrade to Starter to create and update tasks',
    tasks_analytics: 'Upgrade to Business for task analytics',
    tasks_multiple_tools: 'Upgrade to Business to sync multiple task tools',
    ai_actions: 'You\'re close to your AI action limit. Upgrade for more.',
    automation_runs: 'You\'re running low on automation runs this month.',
};

/**
 * Hook for subscription and usage management.
 */
export const useSubscription = () => {
    const { user, refreshUser } = useAuth();
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [serverLimits, setServerLimits] = useState<Partial<PlanLimits> | null>(null);
    const [loading, setLoading] = useState(true);
    const [tierName, setTierName] = useState<string>('');
    const [tierTagline, setTierTagline] = useState<string>('');

    // Get tier from user, default to 'free'
    const tier: SubscriptionTier = useMemo(() => {
        const userTier = user?.subscription_tier as string | undefined;
        // Handle legacy 'lite' tier -> starter
        if (userTier === 'lite') return 'starter';
        // Handle legacy 'business' tier if needed
        if (userTier === 'business') return 'business';
        return (userTier as SubscriptionTier) || 'free';
    }, [user?.subscription_tier]);

    // Use server limits if available, otherwise fall back to local
    const limits = useMemo(() => {
        return serverLimits || PLAN_LIMITS[tier] || PLAN_LIMITS.free;
    }, [serverLimits, tier]);

    const refreshUsage = useCallback(async () => {
        if (!user) return;
        try {
            const response = await apiService.getUsageStats();
            if (response.success && response.data) {
                setUsage(response.data.usage);
                setServerLimits(response.data.limits);
                setTierName(response.data.tier_name || TIER_INFO[tier]?.name);
                setTierTagline(response.data.tier_tagline || TIER_INFO[tier]?.tagline);
            }
        } catch (error) {
            console.error('Failed to fetch usage stats:', error);
        } finally {
            setLoading(false);
        }
    }, [user, tier]);

    const refetch = useCallback(async () => {
        setLoading(true);
        await Promise.all([
            refreshUser(),
            refreshUsage()
        ]);
        setLoading(false);
    }, [refreshUser, refreshUsage]);

    useEffect(() => {
        refreshUsage();
    }, [refreshUsage]);

    /**
     * Check if user can use a specific feature.
     * @param feature - Feature name to check
     * @param currentCount - Optional current usage count for limit-based features
     */
    const canUseFeature = useCallback((feature: keyof PlanLimits | string, currentCount?: number): boolean => {
        const value = limits[feature as keyof PlanLimits];

        // Handle numeric limits (e.g., max_active_workflows)
        if (typeof value === 'number' && currentCount !== undefined) {
            return currentCount < value;
        }

        if (typeof value === 'boolean') return value;
        return !!value;
    }, [limits]);

    /**
     * Check if user has access to a specific connection/platform.
     */
    const hasConnectionAccess = useCallback((platform: string): boolean => {
        const allowed = limits.allowed_connections;
        if (!allowed) return false;
        if (allowed.includes('*')) return true;
        return allowed.includes(platform.toLowerCase());
    }, [limits]);

    /**
     * Get upgrade message for a gated feature.
     */
    const getUpgradeMessage = useCallback((feature: string): string => {
        return UPGRADE_MESSAGES[feature] || `Upgrade to unlock ${feature}`;
    }, []);

    /**
     * Check if AI actions are at warning level (80%+).
     */
    const isAiActionsWarning = useMemo(() => {
        return usage?.ai_actions?.warning || false;
    }, [usage]);

    /**
     * Check if AI actions are at limit (100%).
     */
    const isAiActionsAtLimit = useMemo(() => {
        return usage?.ai_actions?.at_limit || false;
    }, [usage]);

    /**
     * Check if automation runs are at warning level (80%+).
     */
    const isAutomationRunsWarning = useMemo(() => {
        return usage?.automation_runs?.warning || false;
    }, [usage]);

    /**
     * Check if automation runs are at limit (100%).
     */
    const isAutomationRunsAtLimit = useMemo(() => {
        return usage?.automation_runs?.at_limit || false;
    }, [usage]);

    // Tier level convenience booleans
    const isEnterprise = tier === 'enterprise';
    const isPro = tier === 'pro' || isEnterprise;
    const isBusiness = tier === 'business' || isPro;
    const isStarter = tier === 'starter' || isBusiness;
    const isFree = tier === 'free';

    return {
        tier,
        tierName: tierName || TIER_INFO[tier]?.name || tier,
        tierTagline: tierTagline || TIER_INFO[tier]?.tagline || '',
        tierColor: TIER_INFO[tier]?.color || 'gray',
        limits,
        usage,
        loading,

        // Feature checks
        canUseFeature,
        hasConnectionAccess,
        getUpgradeMessage,

        // Usage warnings/limits
        isAiActionsWarning,
        isAiActionsAtLimit,
        isAutomationRunsWarning,
        isAutomationRunsAtLimit,

        // Tier levels
        isFree,
        isStarter,
        isBusiness,
        isPro,
        isEnterprise,

        // Refresh
        refreshUsage,
        refetch,
        user,
    };
};
