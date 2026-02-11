import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    ChevronRight,
    Play,
    Sparkles,
    GitBranch,
    Layers,
    TrendingUp,
    LayoutDashboard,
    CreditCard
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';

// Import integration logos
import slackLogo from '../assets/apps/slack.jpg';
import gmailLogo from '../assets/apps/gmail.png';
import notionLogo from '../assets/apps/notion.png';
import asanaLogo from '../assets/apps/asana.png';
import trelloLogo from '../assets/apps/trello.jpg';
import jiraLogo from '../assets/apps/jira.jpeg';
import zoomLogo from '../assets/apps/zoom.jpeg';
import teamsLogo from '../assets/apps/microsoft_teams.png';
import hubspotLogo from '../assets/apps/hub_spot.png';
import salesforceLogo from '../assets/apps/sales_force.png';
import whatsappLogo from '../assets/apps/whatsapp.png';
import linkedinLogo from '../assets/apps/linkedin.png';
import facebookLogo from '../assets/apps/facebook.png';
import instagramLogo from '../assets/apps/instagram.jpeg';
import tiktokLogo from '../assets/apps/tiktok.png';
import outlookLogo from '../assets/apps/outlook.png';

const LandingPage: React.FC = () => {
    const { user } = useAuth();

    const integrations = [
        { name: 'Slack', logo: slackLogo },
        { name: 'Gmail', logo: gmailLogo },
        { name: 'Notion', logo: notionLogo },
        { name: 'Asana', logo: asanaLogo },
        { name: 'Trello', logo: trelloLogo },
        { name: 'Jira', logo: jiraLogo },
        { name: 'Zoom', logo: zoomLogo },
        { name: 'Teams', logo: teamsLogo },
        { name: 'HubSpot', logo: hubspotLogo },
        { name: 'Salesforce', logo: salesforceLogo },
        { name: 'WhatsApp', logo: whatsappLogo },
        { name: 'LinkedIn', logo: linkedinLogo },
        { name: 'Facebook', logo: facebookLogo },
        { name: 'Instagram', logo: instagramLogo },
        { name: 'TikTok', logo: tiktokLogo },
        { name: 'Outlook', logo: outlookLogo },
    ];

    const steps = [
        {
            step: 1,
            title: 'Connect Your Apps',
            description: 'Link your favorite tools in seconds. We support all major industry integrations.',
            icon: Layers
        },
        {
            step: 2,
            title: 'Build Automations',
            description: 'Create powerful workflows with our visual builder. No coding required.',
            icon: GitBranch
        },
        {
            step: 3,
            title: 'Scale Your Business',
            description: 'Watch your productivity soar as AI handles the repetitive work.',
            icon: TrendingUp
        }
    ];

    return (
        <div className="text-gray-900 overflow-x-hidden">
            <SEO
                title="Unified Inbox & Workspace Platform"
                description="Manage emails, messages, and workflows in one unified workspace. Connect Slack, Gmail, M-Pesa, and 50+ apps with AI-powered automation. Built for modern teams."
                url="/"
                keywords={[
                    'Unified Workspace',
                    'Unified Inbox',
                    'Workflow Automation',
                    'M-Pesa Integration',
                    'Productivity Tool',
                    'Team Collaboration'
                ]}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebApplication",
                    "name": "Arrotech Hub",
                    "applicationCategory": "ProductivitySoftware",
                    "operatingSystem": "Web",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "USD"
                    }
                }}
            />

            {/* Hero Section */}
            <section className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-purple-100/50 border border-purple-200 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">Now with AI-powered automation</span>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-gray-900 via-blue-600 to-gray-900 bg-clip-text text-transparent">
                            Connect Everything.
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            Automate Anything.
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                        The all-in-one platform that unifies your tools, automates your workflows,
                        and supercharges your productivity with AI-powered intelligence.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        {user ? (
                            <Link
                                to="/unified"
                                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/25 hover:scale-105"
                            >
                                Go to Dashboard
                                <LayoutDashboard className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <Link
                                to="/register"
                                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/25 hover:scale-105"
                            >
                                Get Started Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                        <button className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-sm hover:shadow-md">
                            <Play className="w-5 h-5 text-blue-600" />
                            Watch Demo
                        </button>
                    </div>

                    {/* Integration Logo Cloud */}
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                        {integrations.slice(0, 8).map((integration, index) => (
                            <div
                                key={integration.name}
                                className="group relative bg-white border border-gray-200 rounded-2xl p-2 md:p-3 transition-all duration-300 hover:scale-110 hover:border-purple-300 hover:shadow-lg"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <img
                                    src={integration.logo}
                                    alt={integration.name}
                                    className="w-6 h-6 md:w-8 md:h-8 object-contain rounded-lg"
                                />
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-600 whitespace-nowrap">
                                    {integration.name}
                                </div>
                            </div>
                        ))}
                        <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-300 rounded-2xl px-4 py-3 backdrop-blur-sm">
                            <span className="text-sm font-medium text-purple-700">+40 more</span>
                        </div>
                    </div>
                </div>
            </section>


            {/* Features Section */}
            <section id="features" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-purple-600 font-bold uppercase tracking-wider text-sm mb-2 block">POWERFUL FEATURES</span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Everything you need to <span className="text-blue-600">run your business</span>
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Stop switching between tabs. Manage your entire workflow from one intelligent dashboard.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all hover:border-purple-200 group">
                            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="w-7 h-7 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Unified Dashboard</h3>
                            <p className="text-gray-600">View all your tasks, events, and messages in one central hub. Customizable widgets give you total control.</p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-200 group">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <CreditCard className="w-7 h-7 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Seamless Payments</h3>
                            <p className="text-gray-600">Integrate M-Pesa and Stripe directly into your workflow. Automated invoicing and payment tracking.</p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all hover:border-pink-200 group">
                            <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-7 h-7 text-pink-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Automation</h3>
                            <p className="text-gray-600">Build complex workflows in minutes. Let AI handle data entry, follow-ups, and repetitive tasks.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                Get Started in
                            </span>
                            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                {" "}Minutes
                            </span>
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Three simple steps to transform your workflow forever.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((item, index) => (
                            <div key={item.step} className="relative">
                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-purple-200 to-transparent" style={{ width: 'calc(100% - 2rem)', left: '50%' }} />
                                )}

                                <div className="relative bg-white border border-gray-200 rounded-3xl p-8 text-center hover:border-purple-300 transition-all duration-300 group shadow-lg hover:shadow-xl">
                                    {/* Step Number */}
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-6 text-2xl font-bold text-white group-hover:scale-110 transition-transform">
                                        {item.step}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                    <p className="text-gray-600">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-r from-purple-50 via-white to-blue-50 border border-gray-200 rounded-3xl p-12 md:p-16 relative overflow-hidden shadow-2xl">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-blue-600/10" />

                        <div className="relative z-10">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                                <span className="bg-gradient-to-r from-gray-900 via-blue-600 to-gray-900 bg-clip-text text-transparent">
                                    Ready to Transform Your Workflow?
                                </span>
                            </h2>

                            <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
                                Start connecting your tools, automating your workflows, and scaling your business today.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                {user ? (
                                    <Link
                                        to="/unified"
                                        className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/25 hover:scale-105"
                                    >
                                        Go to Dashboard
                                        <LayoutDashboard className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            to="/register"
                                            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/25 hover:scale-105"
                                        >
                                            Get Started Free
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                        <Link
                                            to="/login"
                                            className="w-full sm:w-auto text-gray-600 hover:text-gray-900 px-8 py-4 font-medium transition-colors"
                                        >
                                            Already have an account? Sign in
                                        </Link>
                                    </>
                                )}
                            </div>

                            <p className="text-sm text-gray-500 mt-8">
                                No credit card required • Free 14-day trial • Cancel anytime
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
