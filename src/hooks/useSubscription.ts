import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import apiService from '../services/api';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface PlanLimits {
    max_active_workflows: number;
    max_ai_messages_daily: number;
    allowed_connections: string[];
    features: string[];
}

export interface UsageStats {
    active_workflows: number;
    daily_messages: number;
    connections: number;
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
    free: {
        max_active_workflows: 1,
        max_ai_messages_daily: 5,
        allowed_connections: ['ga4'],
        features: ['basic_analytics', 'standard_support'],
    },
    starter: {
        max_active_workflows: 10,
        max_ai_messages_daily: 100,
        allowed_connections: ['ga4', 'mpesa', 'slack'],
        features: ['daily_reports', 'priority_email', 'basic_automation'],
    },
    pro: {
        max_active_workflows: 100,
        max_ai_messages_daily: 1000,
        allowed_connections: ['ga4', 'mpesa', 'slack', 'whatsapp', 'hubspot', 'asana', 'teams'],
        features: ['real_time_analytics', 'dedicated_whatsapp', 'advanced_automation', 'custom_branding'],
    },
    enterprise: {
        max_active_workflows: 1000,
        max_ai_messages_daily: 10000,
        allowed_connections: ['all'],
        features: ['all', 'white_labeling', 'sla', 'custom_integration'],
    },
};

export const useSubscription = () => {
    const { user, refreshUser } = useAuth();
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);

    const tier = (user?.subscription_tier as SubscriptionTier) || 'free';
    const limits = useMemo(() => PLAN_LIMITS[tier] || PLAN_LIMITS.free, [tier]);

    const refreshUsage = useCallback(async () => {
        if (!user) return;
        try {
            const response = await apiService.getUsageStats();
            if (response.success && response.data) {
                setUsage(response.data.usage);
            }
        } catch (error) {
            console.error('Failed to fetch usage stats:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

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

    const canUseFeature = (feature: keyof PlanLimits | string, currentCount?: number) => {
        // If it's one of the numeric limits
        if (feature === 'max_active_workflows' || feature === 'max_ai_messages_daily') {
            const limit = limits[feature as keyof PlanLimits] as number;

            // Map feature name to usage key
            let usageKey = feature.replace('max_', '');
            if (usageKey === 'ai_messages_daily') {
                usageKey = 'daily_messages';
            }

            const current = currentCount !== undefined ? currentCount : (usage ? (usage as any)[usageKey] : 0);
            return current < limit;
        }

        // Feature-based flags
        if (limits.features.includes('all')) return true;
        return limits.features.includes(feature);
    };

    const hasConnectionAccess = (platform: string) => {
        if (limits.allowed_connections.includes('all')) return true;
        return limits.allowed_connections.includes(platform);
    };

    const isPro = tier === 'pro' || tier === 'enterprise';
    const isStarter = tier === 'starter' || isPro;

    return {
        tier,
        limits,
        usage,
        loading,
        canUseFeature,
        hasConnectionAccess,
        isPro,
        isStarter,
        refreshUsage,
        refetch,
        user,
    };
};
