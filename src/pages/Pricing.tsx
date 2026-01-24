import React, { useState, useEffect } from 'react';
import { Check, Shield, Zap, Sparkles } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { PaystackButton } from 'react-paystack';

// Subscription plans configuration
const PLANS = [
    {
        id: 'free',
        name: 'Free Tier',
        price: 0,
        priceDisplay: '0',
        description: 'Perfect for testing and learning automation.',
        features: [
            '3 Active Workflows',
            '10 AI Messages / day',
            'M-Pesa, Slack & Context Tools',
            'Community Support',
            'Basic Dashboard'
        ],
        highlight: false,
        color: 'gray'
    },
    {
        id: 'lite',
        name: 'Biashara Lite',
        price: 200,
        priceDisplay: '200',
        description: 'Essential tools for solo entrepreneurs.',
        features: [
            '10 Active Workflows',
            '50 AI Messages / day',
            'Google Workspace Integration',
            'M-Pesa + Slack + WhatsApp',
            'Email Support',
            'Weekly Reports'
        ],
        highlight: false,
        color: 'blue'
    },
    {
        id: 'pro',
        name: 'Business Pro',
        price: 2500,
        priceDisplay: '2,500',
        description: 'Full power for growing businesses.',
        features: [
            '50 Active Workflows',
            '500 AI Messages / day',
            '25+ Platform Integrations',
            'Daily Automated Reports',
            'Priority Support',
            'Team Collaboration (5 users)',
            'API Access (5,000/day)'
        ],
        highlight: true,
        color: 'indigo'
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 10000,
        priceDisplay: '10,000',
        description: 'Ultimate solution for large organizations.',
        features: [
            'Unlimited Workflows',
            'Unlimited AI Messages',
            'All 50+ Integrations + Custom',
            'Real-time Analytics',
            'Dedicated WhatsApp Support',
            'White-labeling & SSO',
            'Custom Integrations (2/year)',
            'Unlimited Team Members'
        ],
        highlight: false,
        color: 'purple'
    }
];

const Pricing: React.FC = () => {
    const { tier, user } = useSubscription();
    const { refreshUser } = useAuth();
    const [paystackKey, setPaystackKey] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch Paystack public key on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await apiService.getPaystackConfig();
                if (response.success && response.data?.key) {
                    setPaystackKey(response.data.key);
                }
            } catch (error) {
                console.error('Failed to fetch Paystack config:', error);
            }
        };
        fetchConfig();
    }, []);

    // Handle successful payment
    const handlePaymentSuccess = async (response: any) => {
        console.log('[PRICING] Payment success callback:', response);
        const toastId = toast.loading('Verifying payment...');
        setLoading(true);

        try {
            const reference = response?.reference || response?.trxref;

            if (!reference) {
                console.error('[PRICING] No reference in response:', response);
                toast.error('Payment completed but reference missing. Please contact support.', { id: toastId });
                return;
            }

            console.log('[PRICING] Verifying reference:', reference);
            const result = await apiService.verifyPaystackPayment(reference);
            console.log('[PRICING] Verification result:', result);

            if (result.success) {
                toast.success('Subscription activated! 🎉', { id: toastId });
                await refreshUser();
            } else {
                toast.error(result.error || 'Verification failed. Please contact support.', { id: toastId });
            }
        } catch (error: any) {
            console.error('[PRICING] Verification error:', error);
            const message = error?.response?.data?.detail || 'Failed to verify payment';
            toast.error(message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    // Handle payment modal close
    const handlePaymentClose = () => {
        console.log('[PRICING] Payment modal closed');
        toast('Payment cancelled', { icon: '❌' });
    };

    // Generate unique reference
    const generateReference = (planId: string) => {
        return `${Date.now()}_${planId}_${Math.random().toString(36).substr(2, 9)}`;
    };

    // Render payment button based on plan
    const renderPaymentButton = (plan: typeof PLANS[0]) => {
        // Current plan - show disabled button
        if (tier === plan.id) {
            return (
                <button
                    disabled
                    className="w-full py-3 px-6 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                >
                    Current Plan
                </button>
            );
        }

        // Free tier - no payment needed
        if (plan.id === 'free') {
            return (
                <button
                    disabled
                    className="w-full py-3 px-6 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                >
                    Free Forever
                </button>
            );
        }

        // Enterprise - contact sales
        if (plan.id === 'enterprise') {
            return (
                <button
                    onClick={() => window.location.href = 'mailto:sales@arrotechsolutions.co.ke?subject=Enterprise Plan Inquiry'}
                    className="w-full py-3 px-6 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all"
                >
                    Contact Sales
                </button>
            );
        }

        // Paid plans - show Paystack button
        if (!paystackKey) {
            return (
                <button
                    disabled
                    className="w-full py-3 px-6 rounded-xl font-bold bg-gray-200 dark:bg-gray-600 text-gray-500 cursor-wait animate-pulse"
                >
                    Loading...
                </button>
            );
        }

        const config = {
            reference: generateReference(plan.id),
            email: user?.email || 'customer@arrotech.co.ke',
            amount: plan.price * 100, // Convert to kobo
            publicKey: paystackKey,
            currency: 'KES',
            metadata: {
                plan: plan.id,
                custom_fields: [
                    {
                        display_name: "Plan",
                        variable_name: "plan",
                        value: plan.id
                    }
                ]
            }
        };

        return (
            <PaystackButton
                {...config}
                text={loading ? 'Processing...' : `Subscribe - KES ${plan.priceDisplay}`}
                onSuccess={handlePaymentSuccess}
                onClose={handlePaymentClose}
                className={`w-full py-3 px-6 rounded-xl font-bold transition-all ${plan.highlight
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                    }`}
            />
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                        Pricing Plans
                    </h2>
                    <p className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
                        Empower Your Business
                    </p>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                        Select the perfect plan for your business needs.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.highlight
                                    ? 'ring-2 ring-indigo-500 transform scale-105 z-10'
                                    : 'border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    POPULAR
                                </div>
                            )}

                            <div className="p-6 flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {plan.name}
                                    </h3>
                                    {plan.id === 'pro' && <Sparkles className="w-5 h-5 text-indigo-500" />}
                                    {plan.id === 'lite' && <Zap className="w-5 h-5 text-blue-500" />}
                                    {plan.id === 'free' && <Shield className="w-5 h-5 text-gray-400" />}
                                </div>

                                <div className="flex items-baseline mb-4">
                                    <span className="text-sm text-gray-500 mr-1">KES</span>
                                    <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                        {plan.priceDisplay}
                                    </span>
                                    <span className="text-gray-500 ml-1">/mo</span>
                                </div>

                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                    {plan.description}
                                </p>

                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start text-sm">
                                            <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-6 pt-0">
                                {renderPaymentButton(plan)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Manual Verification Fallback */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Payment completed but subscription not updated?
                    </p>
                    <button
                        onClick={async () => {
                            const ref = prompt('Enter your Paystack reference (from email receipt):');
                            if (ref) {
                                await handlePaymentSuccess({ reference: ref });
                            }
                        }}
                        className="text-sm text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800"
                    >
                        Manually verify transaction
                    </button>
                </div>

                {/* Footer info */}
                <div className="mt-16 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Need a custom solution?{' '}
                        <a
                            href="mailto:support@arrotechsolutions.co.ke"
                            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Contact our team
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
