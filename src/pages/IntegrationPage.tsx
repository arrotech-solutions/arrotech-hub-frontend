import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Activity } from 'lucide-react';
import SEO from '../components/SEO';

import arrotechIcon from '../assets/Logo/icononly_transparent.png';
import gmailLogo from '../assets/apps/gmail.png';
import slackLogo from '../assets/apps/slack.jpg';
import mpesaLogo from '../assets/apps/mpesa.png';
import whatsappLogo from '../assets/apps/whatsapp.png';
import trelloLogo from '../assets/apps/trello.jpg';
import jiraLogo from '../assets/apps/jira.jpeg';

const INTEGRATIONS: Record<string, any> = {
    'gmail': {
        name: 'Gmail',
        title: 'Unified Gmail Inbox & Automation',
        description: 'Connect Gmail to Arrotech Hub. Manage multiple inboxes, automate email tasks, and sync with your calendar in one unified workspace.',
        features: ['Unified Inbox View', 'Email-to-Task Automation', 'AI Email Drafting', 'Multi-account Support'],
        workflow: { trigger: 'Important email received in Gmail', action: 'Create priority task & draft AI response in Hub' },
        color: 'from-red-500 to-red-600',
        logo: gmailLogo
    },
    'slack': {
        name: 'Slack',
        title: 'Slack Integration & Workflow Automation',
        description: 'Bring Slack messages into your unified inbox. Automate notifications and turn chats into tasks without switching apps.',
        features: ['Message Aggregation', 'Reply from Dashboard', 'Channel Monitoring', 'Status Sync'],
        workflow: { trigger: 'Message saved or starred in channel', action: 'Add to Hub unified task list & set reminder' },
        color: 'from-purple-500 to-pink-500',
        logo: slackLogo
    },
    'mpesa': {
        name: 'M-Pesa',
        title: 'M-Pesa Integration for Business',
        description: 'Automate M-Pesa payments for your business. Collect payments, manage subscriptions, and payout to creators directly from Arrotech Hub.',
        features: ['Automated Collections', 'Bulk Payouts', 'Subscription Management', 'Real-time Transaction Sync'],
        workflow: { trigger: 'Payment received via M-Pesa', action: 'Update customer status & send automated receipt' },
        color: 'from-green-500 to-emerald-600',
        logo: mpesaLogo
    },
    'whatsapp': {
        name: 'WhatsApp',
        title: 'WhatsApp Business Automation',
        description: 'Manage WhatsApp Business chats alongside emails and Slack. Automate replies and organize customer conversations.',
        features: ['Unified Chat Interface', 'Auto-replies', 'Lead Capture', 'Team Inbox'],
        workflow: { trigger: 'New customer inquiry received', action: 'Send AI auto-reply & notify sales team in Hub' },
        color: 'from-green-400 to-teal-500',
        logo: whatsappLogo
    },
    'trello': {
        name: 'Trello',
        title: 'Trello Integration',
        description: 'View and manage Trello cards from your unified dashboard. Sync tasks across boards and prioritize effectively.',
        features: ['Board Aggregation', 'Card Editing', 'Drag-and-Drop Tasks', 'Deadline Sync'],
        workflow: { trigger: 'Card moved to "Done" list', action: 'Mark Hub task complete & notify assigned team' },
        color: 'from-blue-400 to-blue-600',
        logo: trelloLogo
    },
    'jira': {
        name: 'Jira',
        title: 'Jira Integration',
        description: 'Track Jira issues without leaving your workspace. Perfect for developers and product managers using Arrotech Hub.',
        features: ['Issue Tracking', 'Status Updates', 'Sprint View', 'Cross-project Search'],
        workflow: { trigger: 'New bug reported in Jira', action: 'Create priority ticket in Hub engineering inbox' },
        color: 'from-blue-600 to-indigo-700',
        logo: jiraLogo
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
        <div className="min-h-screen bg-transparent transition-colors">
            <SEO
                title={`${data.title} | Arrotech Hub`}
                description={data.description}
                url={`/integrations/${slug}`}
                keywords={[`${data.name} Integration`, `${data.name} Automation`, 'Unified Workspace', 'Arrotech Hub']}
            />

            {/* Hero */}
            <div className="relative pt-32 pb-20 px-4 overflow-hidden bg-transparent transition-colors">
                <div className="absolute inset-0 bg-slate-900/5 dark:bg-transparent transition-colors pointer-events-none" />
                {/* Glow Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] pointer-events-none transition-colors"></div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[100px] pointer-events-none transition-colors"></div>

                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    {/* Animated Connection Visual */}
                    <div className="flex justify-center items-center gap-4 sm:gap-8 mb-12">
                        {/* Arrotech Hub Node */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 dark:opacity-40 animate-pulse transition-opacity" />
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xl relative z-10 transition-transform group-hover:scale-105 p-3 sm:p-4">
                                <img src={arrotechIcon} alt="Arrotech Hub" className="w-full h-full object-contain" />
                            </div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap transition-colors">Arrotech</div>
                        </div>

                        {/* Connecting Line with flowing data */}
                        <div className="flex-1 max-w-[120px] sm:max-w-[200px] relative flex flex-col items-center justify-center">
                            <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 animate-pulse flex items-center gap-1 transition-colors">
                                <Activity className="w-3 h-3" />
                                Sync
                            </div>
                            <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-800 absolute top-[18px] sm:top-[20px] transition-colors" />
                            <div className="flex justify-between w-full absolute top-[11px] sm:top-[13px] px-2">
                                <ArrowRight className="w-4 h-4 text-indigo-500/60 dark:text-indigo-400/80 animate-pulse" style={{ animationDelay: '0ms' }} />
                                <ArrowRight className="w-4 h-4 text-purple-500/60 dark:text-purple-400/80 animate-pulse" style={{ animationDelay: '300ms' }} />
                                <ArrowRight className="w-4 h-4 text-pink-500/60 dark:text-pink-400/80 animate-pulse" style={{ animationDelay: '600ms' }} />
                            </div>
                        </div>

                        {/* Integration Node */}
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${data.color} blur-xl opacity-20 dark:opacity-40 animate-pulse transition-opacity`} style={{ animationDelay: '500ms' }} />
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-2xl relative z-10 border border-slate-200 dark:border-slate-700 overflow-hidden transition-transform group-hover:scale-105 p-3 sm:p-4`}>
                                <img src={data.logo} alt={data.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap transition-colors">{data.name}</div>
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white tracking-tight pt-4 transition-colors">
                        Connect <span className={`text-transparent bg-clip-text bg-gradient-to-r ${data.color}`}>{data.name}</span> instantly
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium transition-colors">
                        {data.description}
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-bold text-lg shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-none hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-300"
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
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">Why connect {data.name} to Arrotech Hub?</h2>
                        <div className="space-y-4">
                            {data.features.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-colors">
                        <div className={`absolute -top-4 -right-4 bg-gradient-to-br ${data.color} text-white px-5 py-2 rounded-lg font-bold text-sm shadow-lg z-10 hidden sm:block`}>
                            Automated Workflow
                        </div>

                        <div className="flex flex-col gap-5 relative z-0">
                            {/* Trigger */}
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shadow-sm transition-colors">
                                        <img src={data.logo} alt={data.name} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest transition-colors">Trigger</span>
                                </div>
                                <p className="text-slate-800 dark:text-slate-200 font-semibold transition-colors">{data.workflow.trigger}</p>
                            </div>

                            {/* Divider with Icon */}
                            <div className="flex justify-center -my-3 relative z-10">
                                <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-md border border-slate-100 dark:border-slate-700 ring-4 ring-white dark:ring-slate-900 transition-colors">
                                    <Activity className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-pulse transition-colors" />
                                </div>
                            </div>

                            {/* Action */}
                            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center p-1.5 shadow-sm transition-colors">
                                        <img src={arrotechIcon} alt="Hub" className="w-full h-full object-contain brightness-0 invert" />
                                    </div>
                                    <span className="font-bold text-indigo-500 dark:text-indigo-400 text-xs uppercase tracking-widest transition-colors">Action in Hub</span>
                                </div>
                                <p className="text-indigo-900 dark:text-indigo-200 font-semibold transition-colors">{data.workflow.action}</p>
                            </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                            <Link to="/register" className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-xl flex items-center gap-2">
                                Build this workflow <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-transparent py-20 px-4 text-center transition-colors">
                <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white transition-colors">Ready to streamline your workflow?</h2>
                <div className="flex justify-center gap-4">
                    <Link to="/register" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all">
                        Get Started
                    </Link>
                    <Link to="/unified" className="border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        View All Integrations
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default IntegrationPage;
