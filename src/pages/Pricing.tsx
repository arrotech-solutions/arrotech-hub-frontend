import React, { useState } from 'react';
import { Check, Info, Shield, Zap, Sparkles, Smartphone, CreditCard, ChevronRight } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import toast from 'react-hot-toast';
import apiService from '../services/api';

const Pricing: React.FC = () => {
    const { tier, user } = useSubscription();
    const [loading, setLoading] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');

    const plans = [
        {
            id: 'free',
            name: 'Free Tier',
            price: '0',
            description: 'Perfect for testing and learning automation.',
            features: [
                '3 Active Workflows',
                '10 AI Messages / day',
                'M-Pesa, Slack & Context Tools',
                'Community Support',
                'Basic Dashboard'
            ],
            cta: 'Current Plan',
            highlight: false,
            color: 'gray'
        },
        {
            id: 'lite',
            name: 'Biashara Lite',
            price: '200',
            description: 'Essential tools for solo entrepreneurs.',
            features: [
                '10 Active Workflows',
                '50 AI Messages / day',
                'Google Workspace Integration',
                'M-Pesa + Slack + WhatsApp',
                'Email Support',
                'Weekly Reports'
            ],
            cta: 'Upgrade to Lite',
            highlight: false,
            color: 'blue'
        },
        {
            id: 'pro',
            name: 'Business Pro',
            price: '2,500',
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
            cta: 'Upgrade to Pro',
            highlight: true,
            color: 'indigo'
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: '10,000',
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
            cta: 'Contact Sales',
            highlight: false,
            color: 'purple'
        }
    ];

    const handleUpgrade = async (planId: string) => {
        if (planId === tier) {
            toast.error('You are already on this plan');
            return;
        }

        if (planId === 'free') {
            toast.error('Cannot downgrade to free plan via this menu');
            return;
        }

        // Enterprise requires contacting sales
        if (planId === 'enterprise') {
            window.location.href = 'mailto:sales@arrotechsolutions.co.ke?subject=Enterprise Plan Inquiry';
            return;
        }

        const amountMap: { [key: string]: number } = {
            'lite': 200,
            'pro': 2500,
            'enterprise': 10000
        };
        const amount = amountMap[planId] || 0;

        if (!amount) {
            toast.error('Invalid plan selected');
            return;
        }

        setLoading(planId);

        try {
            if (paymentMethod === 'mpesa') {
                if (!phoneNumber) {
                    const phone = prompt('Please enter your M-Pesa phone number (254...):');
                    if (!phone) {
                        setLoading(null);
                        return;
                    }
                    setPhoneNumber(phone);
                }

                const response = await apiService.initiateMpesaPayment({
                    phone_number: phoneNumber || '254700000000',
                    amount: amount, // KES
                    reference: `Upgrade to ${planId}`,
                    description: `Subscription upgrade for Arrotech Hub`
                });

                if (response.success) {
                    toast.success(`Payment initiated! Please check your phone for the M-Pesa prompt.`);
                } else {
                    toast.error(response.error || 'Failed to initiate M-Pesa payment');
                }
            } else {
                // Stripe Card Payment
                const response = await apiService.createStripeSubscriptionCheckoutSession(
                    planId,
                    amount
                );

                if (response.success && response.data?.checkout_url) {
                    window.location.href = response.data.checkout_url;
                } else {
                    toast.error('Failed to start Card checkout session');
                }
            }

        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                        Pricing Plans
                    </h2>
                    <p className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight">
                        Empower Your Business {user?.name && ` , ${user.name}`}
                    </p>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                        Select the perfect plan for your business needs in the Kenyan market.
                    </p>

                    {/* Payment Method Toggle */}
                    <div className="mt-8 flex justify-center">
                        <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex shadow-sm">
                            <button
                                onClick={() => setPaymentMethod('mpesa')}
                                className={`flex items-center px-4 py-2 rounded-md transition-all ${paymentMethod === 'mpesa'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                <Smartphone className="w-4 h-4 mr-2" />
                                M-Pesa
                            </button>
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`flex items-center px-4 py-2 rounded-md transition-all ${paymentMethod === 'card'
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Card
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <div
                            key={plan.id}
                            className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.highlight ? 'ring-2 ring-indigo-500 transform scale-105 z-10' : 'border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            <div className="p-8 flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                    {plan.id === 'pro' && <Sparkles className="w-6 h-6 text-purple-500" />}
                                    {plan.id === 'starter' && <Zap className="w-6 h-6 text-indigo-500" />}
                                    {plan.id === 'free' && <Shield className="w-6 h-6 text-gray-400" />}
                                </div>

                                <div className="flex items-baseline mb-4">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-1">KES</span>
                                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                                    <span className="text-base font-medium text-gray-500 dark:text-gray-400 ml-1">/mo</span>
                                </div>

                                <p className="text-gray-500 dark:text-gray-400 mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                                    {plan.description}
                                </p>

                                <ul className="space-y-4">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <Check className="h-5 w-5 text-green-500" />
                                            </div>
                                            <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">{feature}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                                {plan.id !== 'free' && plan.id !== tier && paymentMethod === 'mpesa' && (
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                            M-Pesa Number
                                        </label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="254700000000"
                                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={loading === plan.id || tier === plan.id}
                                    className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center transition-all ${tier === plan.id
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-600'
                                        : plan.highlight
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                            : 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                                        }`}
                                >
                                    {loading === plan.id ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {tier === plan.id ? 'Current Plan' : (
                                                paymentMethod === 'card' ? 'Pay with Card' : plan.cta
                                            )}
                                            {tier !== plan.id && <ChevronRight className="ml-2 w-4 h-4" />}
                                        </>
                                    )}
                                </button>

                                {plan.id !== 'free' && (
                                    <div className="mt-4 flex items-center justify-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                        <Shield className="w-3 h-3 mr-1" /> Secure M-Pesa Checkout
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 border-t border-gray-200 dark:border-gray-800 pt-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
                                <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Local M-Pesa Integration</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Seamlessly connect your business with M-Pesa for real-time reporting.</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-4">
                                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Kenyan Market Optimized</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Pricing and features tailored specifically for the local business landscape.</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-4">
                                <Info className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Automated Tax Reporting</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Simplify your KRA reporting with automated daily and monthly summaries.</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
                                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Enterprise Security</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Bank-grade security and data privacy for all your business workflows.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-20 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Need a custom enterprise solution? <a href="mailto:support@arrotechsolutions.co.ke" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Contact our Nairobi team</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
