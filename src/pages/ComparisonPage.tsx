import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, X, Wallet } from 'lucide-react';
import SEO from '../components/SEO';

const COMPETITORS: Record<string, any> = {
    'akiflow': {
        name: 'Akiflow',
        title: 'Arrotech Hub vs Akiflow',
        description: 'Compare Arrotech Hub and Akiflow. See why Arrotech Hub is the best Akiflow alternative for teams in Kenya and beyond.',
        price: '$24.99/mo',
        features: {
            'Unified Inbox': true,
            'Calendar Sync': true,
            'M-Pesa Integration': false,
            'Local Pricing': false,
            'Team Collaboration': 'Limited',
            'AI Workflows': true
        }
    },
    'motion': {
        name: 'Motion',
        title: 'Arrotech Hub vs Motion',
        description: 'Compare Arrotech Hub and Motion. The best Motion alternative with affordable pricing and M-Pesa support.',
        price: '$34/mo',
        features: {
            'Unified Inbox': false,
            'Calendar Sync': true,
            'M-Pesa Integration': false,
            'Local Pricing': false,
            'Team Collaboration': 'Yes',
            'AI Workflows': 'Auto-scheduling only'
        }
    },
    'zapier': {
        name: 'Zapier',
        title: 'Arrotech Hub vs Zapier | Best Zapier Alternative with Built-in AI',
        description: 'Looking for a Zapier alternative? Arrotech Hub offers unified inboxes, native M-Pesa payments, and advanced AI agents at a fraction of the cost.',
        price: 'From $19.99/mo',
        features: {
            'Unified Inbox': false,
            'Calendar Sync': false,
            'M-Pesa Integration': false,
            'Local Pricing': false,
            'Team Collaboration': 'Enterprise Only',
            'AI Workflows': true
        }
    },
    'make': {
        name: 'Make.com',
        title: 'Arrotech Hub vs Make.com | The Best Make Alternative',
        description: 'Compare Arrotech Hub and Make.com. Discover why marketers and agencies prefer Arrotech Hub for unified productivity and automated M-Pesa payments.',
        price: 'From $9/mo',
        features: {
            'Unified Inbox': false,
            'Calendar Sync': false,
            'M-Pesa Integration': false,
            'Local Pricing': false,
            'Team Collaboration': 'Pro Tier',
            'AI Workflows': true
        }
    },
    'n8n': {
        name: 'n8n',
        title: 'Arrotech Hub vs n8n | Better Than Open Source',
        description: 'Compare Arrotech Hub and n8n. If you want a managed MCP server with built-in marketing tools instead of hosting your own infrastructure, Arrotech is for you.',
        price: 'From $20/mo',
        features: {
            'Unified Inbox': false,
            'Calendar Sync': false,
            'M-Pesa Integration': false,
            'Local Pricing': false,
            'Team Collaboration': 'Yes',
            'AI Workflows': true
        }
    },
    'gumloop': {
        name: 'Gumloop',
        title: 'Arrotech Hub vs Gumloop | AI Marketing Agent Builder',
        description: 'Compare Arrotech Hub and Gumloop. While Gumloop builds generic agents, Arrotech Hub provides out-of-the-box AI marketing employees with M-Pesa support.',
        price: 'From $49/mo',
        features: {
            'Unified Inbox': false,
            'Calendar Sync': false,
            'M-Pesa Integration': false,
            'Local Pricing': false,
            'Team Collaboration': 'Yes',
            'AI Workflows': true
        }
    },
    'hubspot': {
        name: 'HubSpot AI',
        title: 'Arrotech Hub vs HubSpot AI | Cost-Effective Marketing Automation',
        description: 'Compare Arrotech Hub and HubSpot AI. Get powerful marketing automation, Slack integration, and WhatsApp CRM for a fraction of HubSpot\'s enterprise costs.',
        price: 'From $800/mo',
        features: {
            'Unified Inbox': true,
            'Calendar Sync': true,
            'M-Pesa Integration': false,
            'Local Pricing': false,
            'Team Collaboration': 'Yes',
            'AI Workflows': true
        }
    }
};

const FEATURES = [
    { key: 'Unified Inbox', label: 'Unified Inbox (Gmail, Slack, WhatsApp)' },
    { key: 'Calendar Sync', label: 'Universal Calendar Sync' },
    { key: 'M-Pesa Integration', label: 'Native M-Pesa Payments' },
    { key: 'Local Pricing', label: 'Affordable Regional Pricing' },
    { key: 'Team Collaboration', label: 'Workspace for Teams' },
    { key: 'AI Workflows', label: 'AI Automation Agents' }
];

const ComparisonPage: React.FC = () => {
    const { competitor } = useParams<{ competitor: string }>();
    const compData = competitor ? COMPETITORS[competitor.toLowerCase()] : null;

    if (!compData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Competitor Not Found</h1>
                    <Link to="/" className="text-blue-600 hover:underline">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <SEO
                title={compData.title}
                description={compData.description}
                url={`/vs/${competitor}`}
                keywords={[`${compData.name} Alternative`, `Arrotech vs ${compData.name}`, 'Unified Workspace Comparison']}
            />

            {/* Hero */}
            <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
                    Switch to the <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Better Alternative</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
                    Why businesses are choosing Arrotech Hub over {compData.name} for unified productivity and payments.
                </p>
            </section>

            {/* Comparison Table */}
            <section className="px-4 pb-24 max-w-5xl mx-auto">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="grid grid-cols-3 bg-gray-50 p-6 border-b border-gray-100">
                        <div className="col-span-1 font-bold text-gray-500 uppercase tracking-wider text-xs pt-2">Feature</div>
                        <div className="col-span-1 text-center font-black text-xl text-purple-600">Arrotech Hub</div>
                        <div className="col-span-1 text-center font-bold text-xl text-gray-500">{compData.name}</div>
                    </div>

                    {/* Price Row */}
                    <div className="grid grid-cols-3 p-6 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <div className="col-span-1 font-semibold text-gray-700 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-gray-400" /> Starting Price
                        </div>
                        <div className="col-span-1 text-center font-bold text-green-600 text-lg">Free / Affordable</div>
                        <div className="col-span-1 text-center font-medium text-gray-600">{compData.price}</div>
                    </div>

                    {FEATURES.map((feature, idx) => {
                        const arrotechVal = feature.key === 'Local Pricing' || feature.key === 'M-Pesa Integration' ? true :
                            feature.key === 'Team Collaboration' ? 'Unlimited' : true;

                        const compVal = compData.features[feature.key];

                        return (
                            <div key={idx} className="grid grid-cols-3 p-6 border-b border-gray-50 hover:bg-gray-50/50 transition-colors items-center">
                                <div className="col-span-1 font-medium text-gray-600 text-sm md:text-base pr-2">{feature.label}</div>

                                {/* Arrotech Column */}
                                <div className="col-span-1 flex justify-center">
                                    {arrotechVal === true ? (
                                        <div className="bg-green-100 text-green-700 p-1.5 rounded-full"><Check className="w-5 h-5" /></div>
                                    ) : (
                                        <span className="font-bold text-gray-900">{arrotechVal}</span>
                                    )}
                                </div>

                                {/* Competitor Column */}
                                <div className="col-span-1 flex justify-center">
                                    {compVal === true ? (
                                        <div className="bg-gray-100 text-gray-600 p-1.5 rounded-full"><Check className="w-5 h-5" /></div>
                                    ) : compVal === false ? (
                                        <div className="bg-red-50 text-red-400 p-1.5 rounded-full"><X className="w-5 h-5" /></div>
                                    ) : (
                                        <span className="text-gray-500 font-medium">{compVal}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 text-center">
                    <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-purple-500/30">
                        Start for Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-4 text-gray-500 text-sm">No credit card required • 14-day free trial on Pro plans</p>
                </div>
            </section>
        </div>
    );
};

export default ComparisonPage;
