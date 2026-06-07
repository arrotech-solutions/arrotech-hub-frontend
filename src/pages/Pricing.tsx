import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Check,
    X,
    Sparkles,
    Shield,
    ArrowRight,
    ChevronDown,
    Star,
    Globe,
    CreditCard,
    Headphones,
    MessageCircle,
    HelpCircle,
    Clock,
    Lock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { PaystackButton } from 'react-paystack';
import SEO from '../components/SEO';
import {
    WORKSPACE_PLANS,
    COMPARISON_CATEGORIES,
    COMPARISON_LENSES,
    LENS_CATEGORY_MAP,
    WHATSAPP_JOURNEY,
    PRICING_FAQS,
    TRIAL_GUARDRAILS,
    TRIAL_USAGE_CAPS,
    PLAN_COLUMN_KEYS,
    PLAN_COLUMN_LABELS,
    type BillingCycle,
    type ComparisonLens,
    type WorkspacePlan,
    type PlanColumnKey,
} from '../data/pricingData';

const COLLAPSED_FEATURE_COUNT = 5;

/** Shared collapsed heights so all plan cards align in a row */
const CARD_PRICE_MIN_H = 'min-h-[3.25rem]';
const CARD_DESC_MIN_H = 'min-h-[2.5rem]';
const CARD_FEATURES_COLLAPSED_MIN_H = 'min-h-[7.75rem]';

const MOBILE_PLAN_LABELS: Record<string, string> = {
    free: 'Trial',
    starter: 'Start',
    business: 'Biz',
    pro: 'Pro',
};

const Pricing: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [paystackKey, setPaystackKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
    const [activeLens, setActiveLens] = useState<ComparisonLens>('all');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(['whatsapp', 'inbox'])
    );
    const [highlightedPlan, setHighlightedPlan] = useState<string | null>(null);
    const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set([0]));

    useEffect(() => {
        if (!user) return;
        apiService.getPaystackConfig().then((response) => {
            if (response.success && response.data?.key) setPaystackKey(response.data.key);
        }).catch(() => {});
    }, [user]);

    const visibleCategories = useMemo(() => {
        const ids = LENS_CATEGORY_MAP[activeLens];
        return COMPARISON_CATEGORIES.filter((c) => ids.includes(c.id));
    }, [activeLens]);

    const handlePaymentSuccess = async (reference: { reference: string }) => {
        setLoading(true);
        try {
            const response = await apiService.verifyPaystackPayment(reference.reference);
            if (response.success) {
                toast.success('Payment successful! Your plan has been upgraded.');
                navigate('/unified');
            } else {
                toast.error('Payment verification failed. Please contact support.');
            }
        } catch {
            toast.error('Failed to verify payment. Please contact support.');
        } finally {
            setLoading(false);
        }
    };

    const getPaystackConfig = (plan: WorkspacePlan) => ({
        reference: `sub_${plan.id}_${Date.now()}`,
        email: user?.email || '',
        amount: (plan.price || 0) * 100,
        publicKey: paystackKey,
        currency: 'KES',
        metadata: {
            plan_id: plan.id,
            user_id: user?.id,
            plan_name: plan.name,
            custom_fields: [{ display_name: 'Plan', variable_name: 'plan', value: plan.name }],
        },
    });

    const renderCell = (value: boolean | string, isTrialColumn = false) => {
        if (value === true) return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
        if (value === false) return <X className="w-5 h-5 text-gray-300 dark:text-slate-600 mx-auto" />;
        const isTrialCap =
            isTrialColumn &&
            (typeof value === 'string' &&
                (/total|uses|msgs|contacts|platform|days|Up to|×/i.test(value) || value === '1'));
        return (
            <span
                className={`text-sm font-medium ${
                    isTrialCap ? 'text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-slate-300'
                }`}
            >
                {value}
            </span>
        );
    };

    const renderPlanCta = (plan: WorkspacePlan) => {
        if (user?.subscription_tier === plan.id) {
            return <div className="w-full py-3 px-4 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-center rounded-xl font-semibold">Current Plan</div>;
        }
        if (plan.id === 'enterprise') {
            return (
                <a href="mailto:sales@arrotechsolutions.com?subject=Enterprise%20Plan%20Inquiry" className="block w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center rounded-xl font-semibold hover:shadow-lg transition-all">
                    Contact Sales
                </a>
            );
        }
        if (plan.id === 'free') {
            return (
                <Link to={user ? '/unified' : '/register'} className="block w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center rounded-xl font-semibold hover:shadow-lg transition-all">
                    {user ? 'Continue trial' : 'Start 7-day trial'}
                </Link>
            );
        }
        if (user && paystackKey) {
            return (
                <PaystackButton
                    {...getPaystackConfig(plan)}
                    onSuccess={(ref) => handlePaymentSuccess(ref)}
                    onClose={() => toast('Payment cancelled. You can try again anytime.')}
                    className={`w-full py-3 px-4 bg-gradient-to-r ${plan.gradient} text-white text-center rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50`}
                    text={loading ? 'Processing...' : `Upgrade to ${plan.name}`}
                />
            );
        }
        return (
            <Link to="/register" className={`block w-full py-3 px-4 bg-gradient-to-r ${plan.gradient} text-white text-center rounded-xl font-semibold hover:shadow-lg transition-all`}>
                Start with {plan.name}
            </Link>
        );
    };

    const yearlyDiscount = (monthly: number) => Math.round(monthly * 12 * 0.8);

    const toggleCategory = (id: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getRowValue = (row: (typeof COMPARISON_CATEGORIES)[0]['features'][0], key: PlanColumnKey) => row[key];

    return (
        <div className="min-h-screen bg-transparent transition-colors">
            <SEO
                title="Pricing | 7-Day Free Trial & Plans"
                description="Start with a 7-day Business preview — full inbox, WhatsApp, and AI with fair usage caps. Upgrade from KES 1,500/mo. M-Pesa supported."
                url="/pricing"
                keywords={['Arrotech Hub Pricing', 'WhatsApp Business API Kenya', 'Unified Workspace', 'M-Pesa Subscription']}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: PRICING_FAQS.map((f) => ({
                        '@type': 'Question',
                        name: f.question,
                        acceptedAnswer: { '@type': 'Answer', text: f.answer },
                    })),
                }}
            />

            {/* Hero */}
            <section className="relative overflow-hidden py-12 sm:py-16 md:py-22">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-400/15 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-slate-900 dark:text-white mb-4 sm:mb-5 tracking-tight leading-[1.08] px-1">
                        One workspace.
                        <span className="block bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">WhatsApp built in.</span>
                    </h1>
                    <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-6 sm:mb-8 font-medium leading-relaxed px-1">
                        Start with a <span className="font-semibold text-violet-600 dark:text-violet-400">7-day Business preview</span> — no card required.
                        WhatsApp, AI, and workflows included with fair caps so you can evaluate properly.
                    </p>

                    <div className="inline-flex items-center gap-3 p-1.5 bg-gray-100/80 dark:bg-slate-800/80 rounded-2xl backdrop-blur-sm">
                        {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
                            <button
                                key={cycle}
                                onClick={() => setBillingCycle(cycle)}
                                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all capitalize flex items-center gap-2 ${
                                    billingCycle === cycle
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                {cycle}
                                {cycle === 'yearly' && (
                                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                        −20%
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Plan cards — horizontal snap on mobile, equal collapsed height on desktop */}
            <section className="pb-14 -mt-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-xs text-slate-400 mb-3 lg:hidden">Swipe to compare plans →</p>
                    <div className="flex lg:grid lg:grid-cols-3 xl:grid-cols-5 xl:items-stretch gap-4 lg:gap-5 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none pb-2 lg:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                        {WORKSPACE_PLANS.map((plan) => {
                            const Icon = plan.icon;
                            const yearlyPrice = plan.price ? yearlyDiscount(plan.price) : null;
                            const displayPrice = billingCycle === 'yearly' && yearlyPrice ? yearlyPrice.toLocaleString() : plan.priceDisplay;
                            const isHighlighted = highlightedPlan === plan.id;
                            const isExpanded = expandedPlans.has(plan.id);
                            const visibleFeatures = isExpanded
                                ? plan.features.included
                                : plan.features.included.slice(0, COLLAPSED_FEATURE_COUNT);

                            return (
                                <div
                                    key={plan.id}
                                    onMouseEnter={() => setHighlightedPlan(plan.id)}
                                    onMouseLeave={() => setHighlightedPlan(null)}
                                    className={`relative flex flex-col shrink-0 w-[min(100%,280px)] sm:w-[300px] lg:w-auto snap-center lg:snap-align-none rounded-2xl border bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-300 ${
                                        !isExpanded ? 'self-stretch' : 'self-start'
                                    } ${
                                        plan.highlight
                                            ? 'border-indigo-400 dark:border-indigo-500 shadow-lg shadow-indigo-500/10 xl:scale-[1.03] z-10'
                                            : isHighlighted
                                              ? 'border-slate-300 dark:border-slate-600 shadow-md lg:-translate-y-1'
                                              : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    {plan.isTrial && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full shadow">
                                                <Clock className="w-3 h-3" /> 7 days free
                                            </span>
                                        </div>
                                    )}
                                    {plan.popular && !plan.isTrial && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow">
                                                <Star className="w-3 h-3 fill-current" /> Popular
                                            </span>
                                        </div>
                                    )}

                                    <div className="p-5 flex flex-col flex-1 h-full">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shrink-0`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wide max-w-[48%] min-w-0">
                                                <MessageCircle className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{plan.whatsappLevel}</span>
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{plan.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">{plan.tagline}</p>

                                        <div className={`mb-3 ${CARD_PRICE_MIN_H}`}>
                                            {plan.isTrial ? (
                                                <>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">Free</span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mt-1 leading-snug">
                                                        7-day Business preview · then KES 1,500/mo
                                                    </p>
                                                </>
                                            ) : plan.price !== null ? (
                                                <div className="flex items-baseline gap-1 flex-wrap">
                                                    <span className="text-xs text-gray-400">KES</span>
                                                    <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{displayPrice}</span>
                                                    <span className="text-sm text-gray-400">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">Custom</span>
                                            )}
                                        </div>

                                        <p className={`text-xs text-gray-600 dark:text-slate-400 mb-4 leading-relaxed line-clamp-2 ${CARD_DESC_MIN_H}`}>
                                            {plan.description}
                                        </p>
                                        {renderPlanCta(plan)}

                                        <div className={`mt-5 pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col ${!isExpanded ? CARD_FEATURES_COLLAPSED_MIN_H : ''}`}>
                                            <ul className="space-y-2">
                                                {visibleFeatures.map((f, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-400">
                                                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span>{f}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {plan.features.included.length > COLLAPSED_FEATURE_COUNT && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpandedPlans((p) => {
                                                            const n = new Set(p);
                                                            if (n.has(plan.id)) n.delete(plan.id);
                                                            else n.add(plan.id);
                                                            return n;
                                                        })
                                                    }
                                                    className="mt-auto pt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
                                                >
                                                    {isExpanded ? 'Show less' : `+${plan.features.included.length - COLLAPSED_FEATURE_COUNT} more`}
                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Trial fair-use panel */}
                    <div className="mt-8 sm:mt-10 max-w-4xl mx-auto rounded-2xl border border-violet-200 dark:border-violet-800/60 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/20 p-4 sm:p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-start gap-5 md:gap-6">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-2">
                                    <Lock className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                                    <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">Trial includes the full experience — with fair caps</h3>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">
                                    You&apos;ll use the same tools as Business customers. Limits apply once for the whole 7 days so teams can evaluate properly — not run production for free.
                                </p>
                                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs text-gray-700 dark:text-slate-300">
                                    <li><span className="text-violet-600 dark:text-violet-400 font-bold">{TRIAL_USAGE_CAPS.aiActionsTotal}</span> AI actions</li>
                                    <li><span className="text-violet-600 dark:text-violet-400 font-bold">{TRIAL_USAGE_CAPS.whatsappMessagesSent}</span> WhatsApp msgs</li>
                                    <li><span className="text-violet-600 dark:text-violet-400 font-bold">{TRIAL_USAGE_CAPS.broadcastRecipientsMax}</span> broadcast recipients</li>
                                    <li><span className="text-violet-600 dark:text-violet-400 font-bold">{TRIAL_USAGE_CAPS.whatsappContacts}</span> contacts</li>
                                    <li><span className="text-violet-600 dark:text-violet-400 font-bold">{TRIAL_USAGE_CAPS.activeWorkflows}</span> workflows</li>
                                    <li><span className="text-violet-600 dark:text-violet-400 font-bold">{TRIAL_USAGE_CAPS.automationRunsTotal}</span> automations</li>
                                </ul>
                            </div>
                            <ul className="md:w-72 space-y-2 shrink-0">
                                {TRIAL_GUARDRAILS.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-400">
                                        <Check className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* WhatsApp journey — unique progression visual */}
            <section className="py-14 md:py-16 border-y border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            WhatsApp grows with your plan
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base max-w-lg mx-auto">
                            No bolt-on products. Upgrade once, unlock more WhatsApp power inside the same workspace.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-slate-200 via-emerald-300 to-indigo-400 dark:from-slate-700 dark:via-emerald-700 dark:to-indigo-600" />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-3">
                            {WHATSAPP_JOURNEY.map((step, idx) => {
                                const plan = WORKSPACE_PLANS.find((p) => p.id === step.planId);
                                return (
                                    <button
                                        key={step.planId}
                                        type="button"
                                        onClick={() => {
                                            setActiveLens('whatsapp');
                                            setExpandedCategories(new Set(['whatsapp']));
                                            setHighlightedPlan(step.planId);
                                            document.getElementById('feature-explorer')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={`relative text-left p-4 rounded-2xl border transition-all hover:shadow-md ${
                                            highlightedPlan === step.planId
                                                ? 'border-emerald-400 bg-white dark:bg-slate-900 shadow-md ring-2 ring-emerald-400/30'
                                                : 'border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${plan?.gradient ?? 'from-slate-500 to-slate-600'}`}>
                                                {idx + 1}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{step.label}</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{step.title}</p>
                                        <ul className="space-y-1">
                                            {step.capabilities.map((cap, i) => (
                                                <li key={i} className="text-xs text-gray-500 dark:text-slate-400 flex items-start gap-1.5">
                                                    <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                                    {cap}
                                                </li>
                                            ))}
                                        </ul>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature explorer — lens tabs + accordion categories */}
            <section id="feature-explorer" className="py-16 md:py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Feature explorer</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">
                                Filter by area or open WhatsApp Business for the full breakdown.
                            </p>
                        </div>
                        <div className="flex overflow-x-auto gap-2 pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0">
                            {COMPARISON_LENSES.map(({ id, label, icon: LensIcon }) => (
                                <button
                                    key={id}
                                    onClick={() => {
                                        setActiveLens(id);
                                        if (id === 'whatsapp') setExpandedCategories(new Set(['whatsapp']));
                                        else if (id === 'all') setExpandedCategories(new Set(['whatsapp', 'inbox']));
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 whitespace-nowrap ${
                                        activeLens === id
                                            ? id === 'whatsapp'
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                                : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    <LensIcon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sticky mini header on scroll would be nice but keep simple — column labels */}
                    <div className="hidden sm:grid grid-cols-[1fr_repeat(4,88px)] gap-2 px-4 py-3 mb-2 text-center">
                        <div />
                        {PLAN_COLUMN_KEYS.map((key) => (
                            <div
                                key={key}
                                className={`text-xs font-bold uppercase tracking-wide ${
                                    key === 'free'
                                        ? 'text-violet-600 dark:text-violet-400'
                                        : key === 'business'
                                          ? 'text-indigo-600 dark:text-indigo-400'
                                          : 'text-slate-500 dark:text-slate-400'
                                }`}
                            >
                                {PLAN_COLUMN_LABELS[key]}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {visibleCategories.map((category) => {
                            const isOpen = expandedCategories.has(category.id);
                            const isWhatsApp = category.accent === 'whatsapp';

                            return (
                                <div
                                    key={category.id}
                                    className={`rounded-2xl border overflow-hidden transition-shadow ${
                                        isWhatsApp
                                            ? 'border-emerald-200 dark:border-emerald-800/60 shadow-sm shadow-emerald-500/5'
                                            : 'border-slate-200 dark:border-slate-800'
                                    } ${isOpen ? 'shadow-md' : ''}`}
                                >
                                    <button
                                        onClick={() => toggleCategory(category.id)}
                                        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                                            isWhatsApp
                                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                : 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${isWhatsApp ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                <category.icon className={`w-5 h-5 ${isWhatsApp ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-900 dark:text-white">{category.category}</span>
                                                {isWhatsApp && (
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{category.features.length} capabilities · tap to {isOpen ? 'collapse' : 'expand'}</p>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isOpen && (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/40">
                                            {category.features.map((row, ri) => (
                                                <div
                                                    key={ri}
                                                    className={`grid grid-cols-1 sm:grid-cols-[1fr_repeat(4,88px)] gap-2 sm:gap-0 px-5 py-3.5 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                                                        ri % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-slate-800/20'
                                                    }`}
                                                >
                                                    <div className="sm:pr-4">
                                                        <p className="text-sm text-gray-800 dark:text-slate-200">{row.name}</p>
                                                        {row.hint && (
                                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 flex items-start gap-1">
                                                                <HelpCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                                                {row.hint}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 sm:contents mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-slate-100 dark:border-slate-800 sm:border-0">
                                                        {PLAN_COLUMN_KEYS.map((key) => (
                                                            <div key={key} className="flex sm:block items-center gap-2 sm:text-center min-w-0">
                                                                <span className="sm:hidden text-[10px] font-bold uppercase text-slate-400 w-12 shrink-0">
                                                                    {MOBILE_PLAN_LABELS[key] ?? PLAN_COLUMN_LABELS[key]}
                                                                </span>
                                                                <div className={`min-w-0 sm:min-w-full ${key === 'business' ? 'sm:bg-indigo-50/40 dark:sm:bg-indigo-900/10 sm:py-1 sm:rounded-lg' : key === 'free' ? 'sm:bg-violet-50/40 dark:sm:bg-violet-900/10 sm:py-1 sm:rounded-lg' : ''}`}>
                                                                    {renderCell(getRowValue(row, key), key === 'free')}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Trust */}
            <section className="py-14 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Trusted by teams across Kenya</p>
                    <div className="flex flex-wrap justify-center gap-8">
                        {[
                            { icon: Shield, label: 'SSL Secured' },
                            { icon: CreditCard, label: 'M-Pesa via Paystack' },
                            { icon: Globe, label: 'Kenya-first pricing' },
                            { icon: Headphones, label: 'Local support' },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                <Icon className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 md:py-20">
                <div className="max-w-2xl mx-auto px-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">Questions</h2>
                    <div className="space-y-2">
                        {PRICING_FAQS.map((faq, idx) => (
                            <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
                                <button
                                    onClick={() =>
                                        setExpandedFaqs((p) => {
                                            const n = new Set(p);
                                            n.has(idx) ? n.delete(idx) : n.add(idx);
                                            return n;
                                        })
                                    }
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white pr-4">{faq.question}</span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expandedFaqs.has(idx) ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedFaqs.has(idx) && (
                                    <p className="px-4 pb-4 text-sm text-gray-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                                        {faq.answer}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="pb-20">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">Start with 7 days on us</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm md:text-base">Full Business preview. Upgrade to Starter, Business, or Pro when you&apos;re ready.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to={user ? '/unified' : '/register'} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all hover:-translate-y-0.5">
                            {user ? 'Continue trial' : 'Start 7-day trial'} <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link to="/whatsapp" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl font-bold transition-all hover:-translate-y-0.5">
                            <MessageCircle className="w-4 h-4 text-emerald-500" /> WhatsApp dashboard
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Pricing;
