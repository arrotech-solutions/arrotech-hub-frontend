import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  getDisplayTier,
  getDisplayTierName,
  isSubscriptionExpired,
} from '../hooks/useSubscription';

/**
 * Surfaces trial countdown, expiry warnings, and canceled-but-active state.
 */
const SubscriptionBanner: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const effectiveTier = getDisplayTier(user);
  const subscriptionExpired = isSubscriptionExpired(user);
  const previousTierName = user.subscription_tier && user.subscription_tier !== 'free'
    ? getDisplayTierName(user.subscription_tier)
    : null;
  const isTrial = user.subscription_status === 'trial' || (user as { is_trial?: boolean }).is_trial;
  const daysRemaining = (user as { days_remaining?: number }).days_remaining;
  const isCanceled = user.subscription_status === 'canceled';
  const endDate = user.subscription_end_date
    ? new Date(user.subscription_end_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  if (subscriptionExpired) {
    return (
      <div className="bg-gray-600/15 border-b border-gray-500/30 text-gray-900 dark:text-gray-200 px-4 py-2.5 text-sm flex flex-wrap items-center justify-center gap-2">
        <XCircle className="w-4 h-4 shrink-0" />
        <span>
          {previousTierName ? (
            <>
              Your <strong>{previousTierName}</strong> plan expired
              {endDate ? <> on <strong>{endDate}</strong></> : ''}. You&apos;re on the Free plan with reduced limits.
            </>
          ) : (
            <>Your subscription has expired. You&apos;re on the Free plan with reduced limits.</>
          )}
        </span>
        <Link to="/pricing" className="underline font-semibold">
          Renew
        </Link>
      </div>
    );
  }

  if (isTrial && daysRemaining !== undefined && daysRemaining !== null) {
    return (
      <div className="bg-violet-600 text-white px-4 py-2.5 text-sm flex flex-wrap items-center justify-center gap-2">
        <Clock className="w-4 h-4 shrink-0" />
        <span>
          Free trial — <strong>{daysRemaining}</strong> day{daysRemaining === 1 ? '' : 's'} left of Starter access.
        </span>
        <Link to="/pricing" className="underline font-semibold hover:text-violet-100">
          Upgrade now
        </Link>
      </div>
    );
  }

  if (isCanceled && endDate && effectiveTier !== 'free') {
    return (
      <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-sm flex flex-wrap items-center justify-center gap-2">
        <XCircle className="w-4 h-4 shrink-0" />
        <span>
          Subscription canceled — access until <strong>{endDate}</strong>.
        </span>
        <Link to="/payments" className="underline font-semibold">
          Reactivate
        </Link>
      </div>
    );
  }

  if (
    !isTrial &&
    effectiveTier !== 'free' &&
    daysRemaining !== undefined &&
    daysRemaining !== null &&
    daysRemaining <= 7
  ) {
    return (
      <div className="bg-orange-500/15 border-b border-orange-500/30 text-orange-900 dark:text-orange-200 px-4 py-2.5 text-sm flex flex-wrap items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          Your <strong className="capitalize">{effectiveTier}</strong> plan expires in{' '}
          <strong>{daysRemaining}</strong> day{daysRemaining === 1 ? '' : 's'}
          {endDate ? ` (${endDate})` : ''}.
        </span>
        <Link to="/pricing" className="underline font-semibold">
          Renew
        </Link>
      </div>
    );
  }

  return null;
};

export default SubscriptionBanner;
