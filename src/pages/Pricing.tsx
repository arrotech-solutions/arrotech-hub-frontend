import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Check,
    X,
    Sparkles,
    Zap,
    Building2,
    Crown,
    Shield,
    ArrowRight,
    Mail,
    Calendar,
    CheckSquare,
    Bot,
    Headphones,
    ChevronDown,
    Star,
    TrendingUp,
    Globe,
    CreditCard
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { PaystackButton } from 'react-paystack';
import SEO from '../components/SEO';

// ============================================================================
// PLAN DEFINITIONS - Matches Master Implementation Prompt (Kenya-first KES)
// ============================================================================

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        tagline: 'Unified Visibility',
        price: 0,
        priceDisplay: '0',
        description: 'Perfect for discovery. See all your work in one place.',
        icon: Shield,
        gradient: 'from-slate-500 to-slate-600',
        bgGradient: 'from-slate-50 to-slate-100',
        borderColor: 'border-slate-200',
        highlight: false,
        popular: false,
        features: {
            included: [
                'Unified Inbox (Read-only)',
                'Unified Calendar (View-only)',
                'Unified Tasks (View-only)',
                '1 email provider',
                '1 messaging provider',
                '1 calendar provider',
                '1 task tool',
                'AI Chat (Basic)',
                'AI Briefing (Weekly)',
                '3 workflows (templates)',
                '100 AI actions/month',
                '500 automation runs/month',
            ],
            excluded: [
                'Send & reply messages',
                'Create/edit events',
                'Create/update tasks',
                'Smart Scheduler',
                'AI-assisted replies',
                'Team members'
            ]
        },
        limits: {
            aiActions: 100,
            automationRuns: 500,
            workflows: 3,
            teamMembers: 1
        }
    },
    {
        id: 'starter',
        name: 'Starter',
        tagline: 'Unified Action',
        price: 1500,
        priceDisplay: '1,500',
        description: 'Essential tools for solo productivity.',
        icon: Zap,
        gradient: 'from-blue-500 to-blue-600',
        bgGradient: 'from-blue-50 to-indigo-50',
        borderColor: 'border-blue-200',
        highlight: false,
        popular: false,
        features: {
            included: [
                'Unified Inbox (Send & Reply)',
                'Create tasks from messages',
                'Unified Calendar (Create & Edit)',
                'Unified Tasks (Create & Update)',
                '2 email providers',
                '2 messaging providers',
                '1 task tool synced',
                'AI Chat (Core)',
                'AI Briefing (Daily & Weekly)',
                '5 workflows',
                '500 AI actions/month',
                '2,000 automation runs/month',
            ],
            excluded: [
                'AI-assisted replies',
                'Smart Scheduler',
                'Team members'
            ]
        },
        limits: {
            aiActions: 500,
            automationRuns: 2000,
            workflows: 5,
            teamMembers: 1
        }
    },
    {
        id: 'business',
        name: 'Business',
        tagline: 'Unified Operations',
        price: 5000,
        priceDisplay: '5,000',
        description: 'For teams that need AI power and smart automation.',
        icon: Building2,
        gradient: 'from-indigo-500 to-purple-600',
        bgGradient: 'from-indigo-50 to-purple-50',
        borderColor: 'border-indigo-300',
        highlight: true,
        popular: true,
        features: {
            included: [
                'AI-assisted email replies',
                'Smart Scheduler (AI)',
                'Unified Tasks with analytics',
                'Multi-tool sync (5 per category)',
                'AI Chat (Advanced)',
                'AI Briefing (Custom schedule)',
                '30 workflows',
                '2,000 AI actions/month',
                '15,000 automation runs/month',
                '3 team members',
                'Priority support'
            ],
            excluded: [
                'Multi-client inboxes',
                'SLA tracking',
                'Dedicated support'
            ]
        },
        limits: {
            aiActions: 2000,
            automationRuns: 15000,
            workflows: 30,
            teamMembers: 3
        }
    },
    {
        id: 'pro',
        name: 'Pro / Agency',
        tagline: 'Unified Command Center',
        price: 10000,
        priceDisplay: '10,000',
        description: 'For agencies managing multiple clients at scale.',
        icon: Crown,
        gradient: 'from-purple-500 to-pink-600',
        bgGradient: 'from-purple-50 to-pink-50',
        borderColor: 'border-purple-200',
        highlight: false,
        popular: false,
        features: {
            included: [
                'Multi-client inbox management',
                'SLA tracking & alerts',
                'Advanced Smart Scheduler',
                'Unlimited providers per category',
                'AI Chat (Power Mode)',
                'AI Briefing (Real-time)',
                'Unlimited workflows',
                '5,000 AI actions/month',
                '50,000 automation runs/month',
                '10 team members',
                'Dedicated support'
            ],
            excluded: []
        },
        limits: {
            aiActions: 5000,
            automationRuns: 50000,
            workflows: 'Unlimited',
            teamMembers: 10
        }
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        tagline: 'Custom Solution',
        price: null,
        priceDisplay: 'Custom',
        description: 'Tailored for large organizations with complex needs.',
        icon: Sparkles,
        gradient: 'from-amber-500 to-orange-600',
        bgGradient: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-200',
        highlight: false,
        popular: false,
        features: {
            included: [
                'Everything in Pro, plus:',
                'Dedicated AI models (optional)',
                'Compliance & audit logs',
                'Private deployments',
                'White-labeling & SSO',
                'Custom integrations (2/year)',
                'Unlimited team members',
                'Dedicated account manager'
            ],
            excluded: []
        },
        limits: {
            aiActions: 'Unlimited',
            automationRuns: 'Unlimited',
            workflows: 'Unlimited',
            teamMembers: 'Unlimited'
        }
    }
];

// Feature comparison data for the table
const FEATURE_COMPARISON = [
    {
        category: 'Unified Inbox',
        icon: Mail,
        features: [
            { name: 'Read messages', free: true, starter: true, business: true, pro: true },
            { name: 'Send & reply', free: false, starter: true, business: true, pro: true },
            { name: 'AI-assisted replies', free: false, starter: false, business: true, pro: true },
            { name: 'Message triggers', free: false, starter: false, business: true, pro: true },
            { name: 'Multi-client inboxes', free: false, starter: false, business: false, pro: true },
            { name: 'SLA tracking', free: false, starter: false, business: false, pro: true },
        ]
    },
    {
        category: 'Unified Calendar',
        icon: Calendar,
        features: [
            { name: 'View events', free: true, starter: true, business: true, pro: true },
            { name: 'Create & edit events', free: false, starter: true, business: true, pro: true },
            { name: 'Smart Scheduler', free: false, starter: false, business: true, pro: true },
            { name: 'Conflict detection', free: false, starter: false, business: true, pro: true },
            { name: 'Auto follow-ups', free: false, starter: false, business: true, pro: true },
            { name: 'Advanced rules', free: false, starter: false, business: false, pro: true },
        ]
    },
    {
        category: 'Unified Tasks',
        icon: CheckSquare,
        features: [
            { name: 'View tasks', free: true, starter: true, business: true, pro: true },
            { name: 'Create & update tasks', free: false, starter: true, business: true, pro: true },
            { name: 'Multiple task tools', free: false, starter: false, business: true, pro: true },
            { name: 'Task analytics', free: false, starter: false, business: true, pro: true },
            { name: 'Client separation', free: false, starter: false, business: false, pro: true },
            { name: 'Advanced reports', free: false, starter: false, business: false, pro: true },
        ]
    },
    {
        category: 'AI Features',
        icon: Bot,
        features: [
            { name: 'AI Chat', free: 'Basic', starter: 'Core', business: 'Advanced', pro: 'Power Mode' },
            { name: 'AI Briefing', free: 'Weekly', starter: 'Daily/Weekly', business: 'Custom', pro: 'Real-time' },
            { name: 'Smart Scheduler', free: false, starter: false, business: 'Core', pro: 'Advanced' },
        ]
    },
    {
        category: 'Limits & Support',
        icon: TrendingUp,
        features: [
            { name: 'AI Actions/month', free: '100', starter: '500', business: '2,000', pro: '5,000' },
            { name: 'Automation runs/month', free: '500', starter: '2,000', business: '15,000', pro: '50,000' },
            { name: 'Active workflows', free: '3', starter: '5', business: '30', pro: 'Unlimited' },
            { name: 'Team members', free: '1', starter: '1', business: '3', pro: '10' },
            { name: 'Providers per category', free: '1', starter: '2', business: '5', pro: 'Unlimited' },
        ]
    }
];

const FAQS = [
    {
        question: "Can I cancel my subscription at any time?",
        answer: "Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period."
    },
    {
        question: "How does the M-Pesa payment work?",
        answer: "Select your preferred plan, choose M-Pesa as the payment method, and enter your phone number. You'll receive a prompt on your phone to complete the transaction securely."
    },
    {
        question: "Is there a free trial for paid plans?",
        answer: "Yes, all paid plans come with a 14-day free trial. You won't be charged until the trial period ends."
    },
    {
        question: "What happens if I downgrade my plan?",
        answer: "If you downgrade, you'll retain your current features until the end of your billing cycle. Afterwards, your account will revert to the limits of the new plan."
    }
];


const Pricing: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [paystackKey, setPaystackKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');


    // Fetch Paystack public key on mount - ONLY if user is logged in
    // This prevents 401 redirects for unauthenticated visitors viewing pricing
    useEffect(() => {
        if (!user) return; // Skip for unauthenticated users

        const fetchConfig = async () => {
            try {
                const response = await apiService.getPaystackConfig();
                if (response.success && response.data?.key) {
                    setPaystackKey(response.data.key);
                }
            } catch (error) {
                // Silently fail - user can still view pricing, just can't pay
                console.error('Failed to fetch Paystack config:', error);
            }
        };
        fetchConfig();
    }, [user]);

    const handlePaymentSuccess = async (reference: any, planId: string) => {
        setLoading(true);
        try {
            const response = await apiService.verifyPaystackPayment(reference.reference);
            if (response.success) {
                toast.success('Payment successful! Your plan has been upgraded.');
                navigate('/unified');
            } else {
                toast.error('Payment verification failed. Please contact support.');
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Failed to verify payment. Please contact support.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentClose = () => {
        toast('Payment cancelled. You can try again anytime.');
    };

    const getPaystackConfig = (plan: typeof PLANS[0]) => ({
        reference: `sub_${plan.id}_${Date.now()}`,
        email: user?.email || '',
        amount: (plan.price || 0) * 100, // Paystack expects amount in kobo/cents
        publicKey: paystackKey,
        currency: 'KES',
        metadata: {
            plan_id: plan.id,
            user_id: user?.id,
            plan_name: plan.name,
            custom_fields: [
                {
                    display_name: 'Plan',
                    variable_name: 'plan',
                    value: plan.name,
                },
            ],
        },
    });

    const renderFeatureValue = (value: boolean | string) => {
        if (value === true) {
            return <Check className="w-5 h-5 text-emerald-500" />;
        } else if (value === false) {
            return <X className="w-5 h-5 text-gray-300" />;
        }
        return <span className="text-sm font-medium text-gray-700">{value}</span>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            <SEO
                title="Pricing | Flexible Plans for Teams"
                description="Explore Arrotech Hub pricing. Start for free, upgrade to Pro or Enterprise. The most affordable unified workspace with M-Pesa support. Flexible plans for every team size."
                url="/pricing"
                keywords={[
                    'Arrotech Hub Pricing',
                    'Unified Workspace Plans',
                    'Business Automation Pricing',
                    'M-Pesa Payment Subscription',
                    'Affordable Workspace',
                    'Free Plan'
                ]}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": FAQS.map(faq => ({
                        "@type": "Question",
                        "name": faq.question,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": faq.answer
                        }
                    }))
                }}
            />
            {/* ================================================================ */}
            {/* HEADER - Standalone Navigation */}
            {/* ================================================================ */}


            {/* ================================================================ */}
            {/* HERO SECTION */}
            {/* ================================================================ */}
            <section className="relative overflow-hidden py-16 md:py-24">
                {/* Background Decorations */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl -z-10" />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold mb-6">
                        <Sparkles className="w-4 h-4" />
                        Simple, transparent pricing
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                        Choose the plan that
                        <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                            fits your workflow
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                        Start free, upgrade as you grow. All plans include our unified inbox, calendar, and task management.
                        <span className="font-semibold text-gray-800"> Pay with M-Pesa.</span>
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-3 p-1.5 bg-gray-100 rounded-2xl mb-8">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${billingCycle === 'monthly'
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${billingCycle === 'yearly'
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Yearly
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                Save 20%
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* PRICING CARDS */}
            {/* ================================================================ */}
            <section className="relative pb-16 md:pb-24 -mt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {PLANS.map((plan) => {
                            const Icon = plan.icon;
                            const isCurrentPlan = user?.subscription_tier === plan.id;
                            const yearlyPrice = plan.price ? Math.round(plan.price * 12 * 0.8) : null;
                            const displayPrice = billingCycle === 'yearly' && yearlyPrice
                                ? yearlyPrice.toLocaleString()
                                : plan.priceDisplay;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative flex flex-col rounded-3xl border-2 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${plan.highlight
                                        ? 'border-indigo-400 shadow-xl shadow-indigo-500/10 scale-105 z-10'
                                        : plan.borderColor
                                        }`}
                                >
                                    {/* Popular Badge */}
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                            <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-full shadow-lg">
                                                <Star className="w-4 h-4 fill-current" />
                                                Most Popular
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 flex-1 flex flex-col">
                                        {/* Plan Header */}
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{plan.tagline}</p>

                                        {/* Pricing */}
                                        <div className="mb-6">
                                            {plan.price !== null ? (
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-sm text-gray-500">KES</span>
                                                    <span className="text-4xl font-black text-gray-900">{displayPrice}</span>
                                                    <span className="text-gray-500">/{billingCycle === 'yearly' ? 'year' : 'mo'}</span>
                                                </div>
                                            ) : (
                                                <div className="text-4xl font-black text-gray-900">Custom</div>
                                            )}
                                            {billingCycle === 'yearly' && plan.price && (
                                                <p className="text-sm text-emerald-600 font-medium mt-1">
                                                    Save KES {((plan.price * 12) - yearlyPrice!).toLocaleString()}/year
                                                </p>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

                                        {/* CTA Button */}
                                        <div className="mt-auto">
                                            {isCurrentPlan ? (
                                                <div className="w-full py-3 px-4 bg-gray-100 text-gray-600 text-center rounded-xl font-semibold">
                                                    Current Plan
                                                </div>
                                            ) : plan.id === 'enterprise' ? (
                                                <a
                                                    href="mailto:sales@arrotechsolutions.com?subject=Enterprise%20Plan%20Inquiry"
                                                    className="block w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center rounded-xl font-semibold hover:shadow-lg transition-all"
                                                >
                                                    Contact Sales
                                                </a>
                                            ) : plan.id === 'free' ? (
                                                user ? (
                                                    <Link
                                                        to="/unified"
                                                        className="block w-full py-3 px-4 bg-gray-900 text-white text-center rounded-xl font-semibold hover:bg-gray-800 transition-all"
                                                    >
                                                        Go to Dashboard
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to="/register"
                                                        className="block w-full py-3 px-4 bg-gray-900 text-white text-center rounded-xl font-semibold hover:bg-gray-800 transition-all"
                                                    >
                                                        Get Started Free
                                                    </Link>
                                                )
                                            ) : user && paystackKey ? (
                                                <PaystackButton
                                                    {...getPaystackConfig(plan)}
                                                    onSuccess={(ref) => handlePaymentSuccess(ref, plan.id)}
                                                    onClose={handlePaymentClose}
                                                    className={`w-full py-3 px-4 bg-gradient-to-r ${plan.gradient} text-white text-center rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50`}
                                                    text={loading ? 'Processing...' : `Upgrade to ${plan.name}`}
                                                />
                                            ) : (
                                                <Link
                                                    to="/register"
                                                    className={`block w-full py-3 px-4 bg-gradient-to-r ${plan.gradient} text-white text-center rounded-xl font-semibold hover:shadow-lg transition-all`}
                                                >
                                                    Start with {plan.name}
                                                </Link>
                                            )}
                                        </div>

                                        {/* Features List */}
                                        <div className="mt-6 pt-6 border-t border-gray-100">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-3">What's included:</h4>
                                            <ul className="space-y-2.5">
                                                {plan.features.included.slice(0, 6).map((feature, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                                {plan.features.included.length > 6 && (
                                                    <li className="text-sm text-indigo-600 font-medium">
                                                        +{plan.features.included.length - 6} more features
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Compare Plans Button */}
                    <div className="text-center mt-12">
                        <button
                            onClick={() => setShowComparison(!showComparison)}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                        >
                            {showComparison ? 'Hide' : 'Compare all'} features
                            <ChevronDown className={`w-5 h-5 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* FEATURE COMPARISON TABLE */}
            {/* ================================================================ */}
            {showComparison && (
                <section className="pb-16 md:pb-24 animate-in slide-in-from-top-4">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Feature Comparison</h2>
                                <p className="text-gray-600 mt-2">A detailed breakdown of what each plan includes</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="text-left py-4 px-6 font-semibold text-gray-900 min-w-[200px]">Feature</th>
                                            <th className="text-center py-4 px-4 font-semibold text-gray-700">Free</th>
                                            <th className="text-center py-4 px-4 font-semibold text-gray-700">Starter</th>
                                            <th className="text-center py-4 px-4 font-semibold text-indigo-700 bg-indigo-50">Business</th>
                                            <th className="text-center py-4 px-4 font-semibold text-gray-700">Pro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {FEATURE_COMPARISON.map((category, catIdx) => (
                                            <React.Fragment key={catIdx}>
                                                <tr className="bg-gray-50/50">
                                                    <td colSpan={5} className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <category.icon className="w-5 h-5 text-indigo-600" />
                                                            <span className="font-bold text-gray-900">{category.category}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {category.features.map((feature, featIdx) => (
                                                    <tr key={featIdx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-3.5 px-6 text-sm text-gray-700">{feature.name}</td>
                                                        <td className="py-3.5 px-4 text-center">{renderFeatureValue(feature.free)}</td>
                                                        <td className="py-3.5 px-4 text-center">{renderFeatureValue(feature.starter)}</td>
                                                        <td className="py-3.5 px-4 text-center bg-indigo-50/30">{renderFeatureValue(feature.business)}</td>
                                                        <td className="py-3.5 px-4 text-center">{renderFeatureValue(feature.pro)}</td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ================================================================ */}
            {/* TRUST & PAYMENT SECTION */}
            {/* ================================================================ */}
            <section className="py-16 bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        Trusted by businesses across Kenya
                    </h2>
                    <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                        Pay securely with M-Pesa through Paystack. Cancel anytime with no hidden fees.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                        <div className="flex items-center gap-2 text-white/80">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm">SSL Secured</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                            <CreditCard className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm">M-Pesa Supported</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                            <Globe className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm">Kenya-First Pricing</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                            <Headphones className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm">24/7 Support</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* FAQ SECTION */}
            {/* ================================================================ */}
            <section className="py-16 md:py-24">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-6">
                        {[
                            {
                                q: 'Can I switch plans anytime?',
                                a: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be prorated for the remaining time. When downgrading, the new plan takes effect at the next billing cycle.'
                            },
                            {
                                q: 'How does the M-Pesa payment work?',
                                a: 'We use Paystack to process M-Pesa payments securely. When you subscribe, you\'ll receive an STK Push notification on your phone to complete the payment. It\'s fast and secure.'
                            },
                            {
                                q: 'What happens when I hit my AI action limit?',
                                a: 'At 80% usage, you\'ll receive a warning. At 100%, AI-powered features will be paused until your next billing cycle or until you upgrade. You can always upgrade mid-cycle.'
                            },
                            {
                                q: 'Is there a free trial for paid plans?',
                                a: 'The Free plan is unlimited and never expires. For paid plans, we offer a 14-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.'
                            }
                        ].map((faq, idx) => (
                            <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                                <p className="text-gray-600">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* FINAL CTA */}
            {/* ================================================================ */}
            <section className="py-16 md:py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Ready to unify your workflow?
                    </h2>
                    <p className="text-white/80 text-lg mb-8">
                        Join thousands of professionals who've simplified their work with Arrotech Hub.
                    </p>
                    {user ? (
                        <Link
                            to="/unified"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg hover:shadow-2xl hover:-translate-y-1 transition-all"
                        >
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    ) : (
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg hover:shadow-2xl hover:-translate-y-1 transition-all"
                        >
                            Get Started Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    )}
                </div>
            </section>

            {/* ================================================================ */}
            {/* FOOTER */}
            {/* ================================================================ */}

        </div>
    );
};

export default Pricing;
