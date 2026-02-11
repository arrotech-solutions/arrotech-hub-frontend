import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import SEO from '../components/SEO';


const INTEGRATIONS: Record<string, any> = {
    'gmail': {
        name: 'Gmail',
        title: 'Unified Gmail Inbox & Automation',
        description: 'Connect Gmail to Arrotech Hub. Manage multiple inboxes, automate email tasks, and sync with your calendar in one unified workspace.',
        features: ['Unified Inbox View', 'Email-to-Task Automation', 'AI Email Drafting', 'Multi-account Support'],
        color: 'from-red-500 to-red-600'
    },
    'slack': {
        name: 'Slack',
        title: 'Slack Integration & Workflow Automation',
        description: 'Bring Slack messages into your unified inbox. Automate notifications and turn chats into tasks without switching apps.',
        features: ['Message Aggregation', 'Reply from Dashboard', 'Channel Monitoring', 'Status Sync'],
        color: 'from-purple-500 to-pink-500'
    },
    'mpesa': {
        name: 'M-Pesa',
        title: 'M-Pesa Integration for Business',
        description: 'Automate M-Pesa payments for your business. Collect payments, manage subscriptions, and payout to creators directly from Arrotech Hub.',
        features: ['Automated Collections', 'Bulk Payouts', 'Subscription Management', 'Real-time Transaction Sync'],
        color: 'from-green-500 to-emerald-600'
    },
    'whatsapp': {
        name: 'WhatsApp',
        title: 'WhatsApp Business Automation',
        description: 'Manage WhatsApp Business chats alongside emails and Slack. Automate replies and organize customer conversations.',
        features: ['Unified Chat Interface', 'Auto-replies', 'Lead Capture', 'Team Inbox'],
        color: 'from-green-400 to-teal-500'
    },
    'trello': {
        name: 'Trello',
        title: 'Trello Integration',
        description: 'View and manage Trello cards from your unified dashboard. Sync tasks across boards and prioritize effectively.',
        features: ['Board Aggregation', 'Card Editing', 'Drag-and-Drop Tasks', 'Deadline Sync'],
        color: 'from-blue-400 to-blue-600'
    },
    'jira': {
        name: 'Jira',
        title: 'Jira Integration',
        description: 'Track Jira issues without leaving your workspace. Perfect for developers and product managers using Arrotech Hub.',
        features: ['Issue Tracking', 'Status Updates', 'Sprint View', 'Cross-project Search'],
        color: 'from-blue-600 to-indigo-700'
    }
};

const IntegrationPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const data = slug ? INTEGRATIONS[slug.toLowerCase()] : null;

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Integration Not Found</h1>
                    <Link to="/unified" className="text-blue-600 hover:underline">View All Integrations</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <SEO
                title={`${data.title} | Arrotech Hub`}
                description={data.description}
                url={`/integrations/${slug}`}
                keywords={[`${data.name} Integration`, `${data.name} Automation`, 'Unified Workspace', 'Arrotech Hub']}
            />

            {/* Hero */}
            <div className="relative pt-32 pb-20 px-4 overflow-hidden">
                {/* Standard Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 -z-10"></div>

                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <div className="inline-block p-6 bg-white rounded-3xl shadow-xl mb-8 border border-gray-100">
                        {/* Placeholder for logo - using text if image fails or generic icon */}
                        <div className={`w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br ${data.color} text-white font-black text-3xl shadow-inner`}>
                            {data.name[0]}
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 text-gray-900 tracking-tight">
                        {data.title}
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        {data.description}
                    </p>
                    <Link
                        to="/register"
                        className={`inline-flex items-center justify-center gap-2 bg-gradient-to-r ${data.color} text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300`}
                    >
                        Connect {data.name} Now
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Features */}
            <div className="max-w-5xl mx-auto px-4 py-20">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Why connect {data.name} to Arrotech Hub?</h2>
                        <div className="space-y-4">
                            {data.features.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                                    <span className="font-medium text-gray-700">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative">
                        <div className="absolute -top-4 -right-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
                            Automated
                        </div>
                        <div className="space-y-6 opacity-75">
                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                            <div className="h-32 bg-gray-50 rounded border border-gray-100 p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                                </div>
                                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                                <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Link to="/register" className="bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-black transition-colors">
                                Try it Free
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-white py-20 px-4 text-center border-t border-gray-100">
                <h2 className="text-3xl font-bold mb-6">Ready to streamline your workflow?</h2>
                <div className="flex justify-center gap-4">
                    <Link to="/register" className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 transition-colors">
                        Get Started
                    </Link>
                    <Link to="/unified" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-full font-bold hover:bg-gray-50 transition-colors">
                        View All Integrations
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default IntegrationPage;
