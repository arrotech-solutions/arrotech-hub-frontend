/**
 * Subscription plan catalog — mirrors backend subscription_plans.py
 */

export type BillingCycle = 'monthly' | 'yearly';

const YEARLY_DISCOUNT = 0.8;

export const SUBSCRIPTION_PLAN_PRICES: Record<
  string,
  { monthly_kes: number; yearly_kes: number }
> = {
  starter: {
    monthly_kes: 1500,
    yearly_kes: Math.round(1500 * 12 * YEARLY_DISCOUNT),
  },
  business: {
    monthly_kes: 5000,
    yearly_kes: Math.round(5000 * 12 * YEARLY_DISCOUNT),
  },
  pro: {
    monthly_kes: 10000,
    yearly_kes: Math.round(10000 * 12 * YEARLY_DISCOUNT),
  },
};

export function getPlanPrice(planId: string, billingCycle: BillingCycle): number {
  const plan = SUBSCRIPTION_PLAN_PRICES[planId];
  if (!plan) return 0;
  return billingCycle === 'yearly' ? plan.yearly_kes : plan.monthly_kes;
}

export function yearlyDiscount(monthly: number): number {
  return Math.round(monthly * 12 * YEARLY_DISCOUNT);
}
