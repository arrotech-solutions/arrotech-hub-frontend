import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Play,
    Sparkles,
    GitBranch,
    Zap,
    LayoutDashboard,
    Search,
    Bot,
    Globe,
    CheckCircle2,
    Code2,
    Briefcase,
    Megaphone,
    Headphones,
    Users,
    XCircle,
    CheckCircle,
    MessageSquare,
    Mail,
    Calendar,
    FileText,
    TrendingUp,
    Clock,
    Shield,
    Lock,
    DollarSign,
    Cpu,
    Activity,
    Rocket
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

import HeroAIChatMockup from '../components/HeroAIChatMockup';
import UnifiedPlatformShowcase from '../components/UnifiedPlatformShowcase';

const LandingPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('engineering');

    // Use intersection observer for reveal animations
    const useReveal = () => {
        const [isVisible, setIsVisible] = useState(false);
        const ref = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(entry.target);
                    }
                },
                { threshold: 0.1 }
            );

            if (ref.current) {
                observer.observe(ref.current);
            }

            return () => {
                if (ref.current) {
                    observer.unobserve(ref.current);
                }
            };
        }, []);

        return { ref, isVisible };
    };

    const bentoReveal = useReveal();
    const aiReveal = useReveal();
    const adaptReveal = useReveal();
    const creatorReveal = useReveal();
    const chaosReveal = useReveal();
    const securityReveal = useReveal();

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

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
            <SEO 
                title="Arrotech Hub | The Intelligent Command Center for Modern Teams"
                description="Unify your tools, tasks, and teams in one intelligent platform. Arrotech Hub uses autonomous agents and seamless integrations to 10x your team's productivity."
            />

            {/* Premium Hero Section */}
            <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Dynamic Mesh Gradient Background */}
                <div className="absolute inset-0 mesh-gradient-subtle opacity-50 dark:opacity-30 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent dark:from-indigo-900/20 pointer-events-none"></div>
                
                {/* Floating Elements for Premium Feel */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Side: Content */}
                        <div className="text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in">
                                <Sparkles size={14} className="animate-pulse" />
                                <span>Reimagining the Workspace</span>
                            </div>
                            
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.05] animate-slide-up transition-colors">
                                The workspace that <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-300 dark:to-indigo-400">executes the work.</span>
                            </h1>
                            
                            <div className="space-y-5 mb-8 animate-slide-up-delayed">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">1</div>
                                    <p className="text-base text-slate-600 dark:text-slate-400 leading-snug">
                                        <span className="font-bold text-slate-900 dark:text-white">Unify context.</span> Chat, Tasks, Data, and 50+ Apps in one place.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">2</div>
                                    <p className="text-base text-slate-600 dark:text-slate-400 leading-snug">
                                        <span className="font-bold text-slate-900 dark:text-white">Deploy intelligence.</span> AI Agents that think, reason, and act autonomously.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">3</div>
                                    <p className="text-base text-slate-600 dark:text-slate-400 leading-snug">
                                        <span className="font-bold text-slate-900 dark:text-white">Run on autopilot.</span> Create infinite Workflows with zero coding.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up-delayed-2">
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Start Building for Free <ArrowRight size={20} />
                                </Link>
                                <Link
                                    to="/pricing"
                                    className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center"
                                >
                                    View Pricing
                                </Link>
                            </div>

                            {/* Social Proof Stats */}
                            <div className="mt-12 lg:mt-14 flex flex-wrap items-center justify-start gap-4 sm:gap-6 border-t border-slate-200 dark:border-slate-800 pt-8 transition-colors">
                                <div className="flex flex-col items-start hidden sm:flex">
                                    <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Trusted by</div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Early-Stage Tech Teams</div>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                                <div className="flex flex-col items-start">
                                    <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight">50+ Connectors</div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Ready on Day One</div>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                                <div className="flex flex-col items-start">
                                    <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Zero Coding</div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Instant Agent Setup</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Area: AI Mockup */}
                        <div className="w-full h-full flex justify-center lg:justify-end items-center mt-12 lg:mt-0 relative perspective-2000">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/20 dark:from-indigo-900/30 dark:to-purple-900/30 blur-[60px] md:blur-[120px] rounded-full pointer-events-none -mr-40"></div>
                            <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/10 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-2xl z-0 animate-float hidden xl:block"></div>
                            <div className="absolute -bottom-10 right-20 w-32 h-32 bg-indigo-500/10 backdrop-blur-3xl rounded-[2rem] border border-indigo-500/20 shadow-2xl z-0 animate-float-delayed hidden xl:block"></div>

                            <div className="relative z-10 w-full max-w-3xl lg:max-w-none transform lg:scale-110 xl:scale-125 lg:translate-x-10 transition-all duration-1000">
                                <HeroAIChatMockup />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Scrolling Marquee */}
            <section className="py-8 overflow-hidden transition-colors">
                <p className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Trusted by modern teams</p>
                <div className="relative flex overflow-x-hidden group">
                    <div className="py-2 animate-marquee whitespace-nowrap flex items-center">
                        {[...integrations, ...integrations, ...integrations].map((integration, index) => (
                            <div key={`${integration.name}-${index}`} className="mx-8 flex items-center gap-2 opacity-60 dark:opacity-40 hover:opacity-100 dark:hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                                <img src={integration.logo} alt={integration.name} className="h-8 w-auto object-contain dark:brightness-200 dark:grayscale-0 dark:hover:brightness-100" />
                                <span className="text-lg font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">{integration.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* High-Fidelity Platform Showcase */}
            <section id="features" className="relative z-10 transition-colors section-perf-optimized">
                <div ref={bentoReveal.ref} className={`transition-all duration-1000 ${bentoReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
                    <UnifiedPlatformShowcase />
                </div>
            </section>

            {/* AI Powerhouse Section */}
            <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-transparent text-slate-900 dark:text-white relative overflow-hidden transition-colors section-perf-optimized">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/5 dark:from-indigo-900/20 via-transparent dark:via-transparent to-transparent pointer-events-none"></div>

                <div ref={aiReveal.ref} className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${aiReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center mb-10 md:mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Cpu className="w-4 h-4" />
                            <span>Total Control</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-5 sm:mb-6 tracking-tight leading-[1.1] transition-colors">
                            The AI Powerhouse.
                        </h2>
                        <p className="text-lg text-slate-500/90 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed transition-colors">
                            Choose your intelligence. Run local models for maximum privacy or cloud models for maximum power.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Left: Local Intelligence (Terminal Style) */}
                        <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-800 shadow-2xl font-mono text-sm relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs border border-green-900/50">LOCAL GPU: ACTIVE</span>
                            </div>
                            <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="ml-2 text-gray-400">ollama-server — bash</span>
                            </div>
                            <div className="p-6 space-y-2 text-gray-300">
                                <p><span className="text-green-400">$</span> ollama run llama3:instruct</p>
                                <br />
                                <p className="text-blue-400">&gt;&gt;&gt; Loading model...</p>
                                <p className="text-gray-500">Subject: Project Alpha</p>
                                <p className="text-gray-500">Context: 4096 tokens</p>
                                <p className="text-gray-500">Privacy: Offline (0 data sent)</p>
                                <br />
                                <p className="animate-pulse">_ Analyzed 15 local documents. Found 3 key insights...</p>
                            </div>
                        </div>

                        {/* Right: Cloud Intelligence */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Cloud Models</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Top-tier reasoning with GPT-4, Claude 3.5, and Gemini Pro.</p>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center opacity-50 grayscale">
                                <div className="flex gap-2 mb-3">
                                    <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700"></div>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Coming Soon</p>
                            </div>
                            <div className="col-span-2 p-6 bg-indigo-600 dark:bg-indigo-500 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <Globe className="w-16 h-16" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-ping"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Reasoning Engine</span>
                                    </div>
                                    <p className="text-sm font-medium mb-4 opacity-90 italic">"Draft a legal contract for a freelance designer based on California law..."</p>
                                    <div className="h-px bg-white/20 mb-4"></div>
                                    <p className="text-[10px] font-bold opacity-70 mb-1">Response (1.2s latency)</p>
                                    <p className="text-sm font-bold">Here is a draft contract compliant with AB5...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Adaptability Section */}
            <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 transition-colors section-perf-optimized">
                <div ref={adaptReveal.ref} className={`max-w-7xl mx-auto transition-all duration-700 ${adaptReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Users className="w-4 h-4" />
                            <span>Versatile</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-5 sm:mb-6 tracking-tighter leading-[1.1] transition-colors">
                            Built for every team.
                        </h2>
                        <p className="text-lg text-slate-500/90 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium transition-colors">
                            From engineering sprints to marketing launches — one platform that adapts to how your team actually works.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {['engineering', 'marketing', 'sales', 'support'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold capitalize transition-all border ${
                                    activeTab === tab
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg'
                                        : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 md:p-12 border border-slate-200 dark:border-slate-800 transition-colors">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">
                                    {activeTab === 'engineering' && "Ship faster with automated workflows."}
                                    {activeTab === 'marketing' && "Launch campaigns with data-driven AI."}
                                    {activeTab === 'sales' && "Close deals with intelligent CRM automation."}
                                    {activeTab === 'support' && "Delight customers with instant AI responses."}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                    {activeTab === 'engineering' && "Connect Jira, GitHub, and Slack. Automatically create tickets from bug reports and sync status updates tailored for developers."}
                                    {activeTab === 'marketing' && "Unify your social channels, ad data, and email lists. Let AI analyze trends and generate content drafts for your next big push."}
                                    {activeTab === 'sales' && "Seamlessly sync HubSpot, Salesforce, and LinkedIn. Never miss a lead again with autonomous follow-up agents and deal tracking."}
                                    {activeTab === 'support' && "Consolidate WhatsApp, Email, and Intercom. Our agents learn from your knowledge base to resolve 70% of tickets instantly."}
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {activeTab === 'engineering' ? "Git integration & PR tracking" : "Unified channel management"}
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {activeTab === 'engineering' ? "Automated QA pipelines" : "Real-time performance analytics"}
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {activeTab === 'engineering' ? "Sprint sync across tools" : "AI-powered creative assets"}
                                        </span>
                                    </li>
                                </ul>
                                <button className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                                    Learn more <ArrowRight size={18} />
                                </button>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-indigo-500/10 rounded-[2rem] blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                                <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arrotech Hub — {activeTab}</span>
                                    </div>
                                    <div className="p-6">
                                        {activeTab === 'engineering' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Sprint Board</span>
                                                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">Sprint 24</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <GitBranch className="w-4 h-4 text-purple-500" />
                                                            <span className="text-xs font-medium">Fix auth middleware</span>
                                                        </div>
                                                        <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">In Review</span>
                                                    </div>
                                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Zap className="w-4 h-4 text-amber-500" />
                                                            <span className="text-xs font-medium">Deploy v2.4 to staging</span>
                                                        </div>
                                                        <span className="text-[9px] font-bold bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">Deployed</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeTab !== 'engineering' && (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-50 grayscale">
                                                <LayoutDashboard className="w-12 h-12 text-slate-300 mb-4" />
                                                <p className="text-xs font-bold text-slate-400">Updating View...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Creator Economy Section */}
            <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-transparent relative overflow-hidden transition-colors section-perf-optimized">
                <div ref={creatorReveal.ref} className={`max-w-7xl mx-auto transition-all duration-700 ${creatorReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[2rem] opacity-30 blur-xl"></div>
                                <div className="relative bg-white dark:bg-slate-900/50 rounded-[2rem] shadow-2xl dark:shadow-none p-8 border border-gray-100 dark:border-slate-800 backdrop-blur-xl transition-colors">
                                    <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6 shadow-lg transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300 relative overflow-hidden dark:border dark:border-slate-700/50">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer bg-[length:200%_100%]"></div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-slate-400 text-sm font-medium">Total Earnings</p>
                                                <h3 className="text-3xl font-bold">$12,450.00</h3>
                                            </div>
                                            <div className="p-2 bg-slate-800 rounded-lg">
                                                <DollarSign className="w-6 h-6 text-green-400" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-green-400">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>+15% this month</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Recent</p>
                                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                    <Lock className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200">Premium Template</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Unlocked by @alex_d</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white">+$49.00</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-pink-600 dark:text-pink-400">
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200">Tip Received</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">From happy client</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white">+$15.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                                <DollarSign className="w-4 h-4" />
                                <span>Monetization</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-5 sm:mb-6 tracking-tighter leading-[1.1] transition-colors">
                                The Creator Economy OS.
                            </h2>
                            <p className="text-base sm:text-lg text-slate-500/90 dark:text-slate-400 mb-6 sm:mb-8 leading-relaxed font-medium transition-colors">
                                Don't just work—get paid. Arrotech comes with built-in tools to monetize your expertise. Send invoices, receive tips, and sell premium digital assets directly from your dashboard.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium transition-colors">Integrated Invoicing & Payments</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium transition-colors">Sell Digital Products & Templates</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium transition-colors">Accept Tips & Donations</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* "Chaos vs Order" Comparison */}
            <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-transparent text-slate-900 dark:text-white overflow-hidden relative transition-colors section-perf-optimized">
                <div ref={chaosReveal.ref} className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${chaosReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/5 dark:bg-white/5 border border-slate-800/10 dark:border-white/10 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Activity className="w-3.5 h-3.5" />
                            Before & After
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5 tracking-tighter leading-[1.1] text-slate-900 dark:text-white transition-colors">
                            Stop the chaos. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">Start flowing.</span>
                        </h2>
                        <p className="text-lg text-slate-500/90 dark:text-slate-400/90 max-w-2xl mx-auto leading-relaxed font-medium transition-colors">
                            Your team juggles 10+ tools daily. We consolidate them into one intelligent platform — so you can focus on what matters.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 md:gap-0 relative">
                        {/* Center VS Divider */}
                        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-2xl transition-colors">
                                <span className="text-sm font-extrabold text-slate-400 dark:text-slate-300">VS</span>
                            </div>
                        </div>

                        {/* Before Side */}
                        <div className="bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-3xl md:rounded-r-none p-8 md:p-10 relative group backdrop-blur-xl transition-colors">
                            <div className="flex items-center gap-3 mb-8">
                                <span className="px-3 py-1.5 bg-red-500/15 text-red-600 dark:text-red-400 rounded-full text-xs font-bold border border-red-500/20 flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5" /> WITHOUT US
                                </span>
                                <div className="flex-1 h-px bg-gradient-to-r from-red-500/20 to-transparent"></div>
                            </div>
                            <div className="flex flex-col gap-4">
                                {[
                                    { text: 'Context switching between 10+ apps', icon: LayoutDashboard },
                                    { text: 'Missed deadlines & dropped tasks', icon: Clock },
                                    { text: 'Manual copy-paste across platforms', icon: FileText },
                                    { text: 'Notification overload from every channel', icon: MessageSquare },
                                    { text: 'Scattered docs nobody can find', icon: Search },
                                ].map((item, i) => (
                                    <div key={i} className="p-4 bg-white dark:bg-white/[0.03] rounded-xl border border-dashed border-slate-200 dark:border-white/10 flex items-center gap-4 group/item hover:bg-red-50 dark:hover:bg-red-500/5 hover:border-red-200 dark:hover:border-red-500/20 transition-all duration-300 cursor-default">
                                        <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500 dark:text-red-400 flex-shrink-0">
                                            <item.icon className="w-4.5 h-4.5" />
                                        </div>
                                        <span className="text-slate-600 dark:text-slate-400 font-medium text-sm group-hover/item:line-through group-hover/item:text-red-400 transition-all">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* After Side */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-500/20 rounded-3xl md:rounded-l-none p-8 md:p-10 relative shadow-2xl transition-colors">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="px-3 py-1.5 bg-green-500/15 text-green-600 dark:text-green-400 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> WITH ARROTECH
                                    </span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-green-500/20 to-transparent"></div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {[
                                        { text: 'One unified dashboard for everything', icon: LayoutDashboard, gradient: 'from-blue-100 to-indigo-100 dark:from-blue-600/20 dark:to-indigo-600/20', border: 'border-blue-200 dark:border-blue-500/20' },
                                        { text: 'AI-prioritized inbox, zero clutter', icon: Mail, gradient: 'from-cyan-100 to-blue-100 dark:from-cyan-600/20 dark:to-blue-600/20', border: 'border-cyan-200 dark:border-cyan-500/20' },
                                        { text: 'Automated workflows save 4+ hrs/day', icon: Zap, gradient: 'from-amber-100 to-orange-100 dark:from-amber-600/20 dark:to-orange-600/20', border: 'border-amber-200 dark:border-amber-500/20' },
                                        { text: 'Smart scheduling across all calendars', icon: Calendar, gradient: 'from-emerald-100 to-green-100 dark:from-emerald-600/20 dark:to-green-600/20', border: 'border-emerald-200 dark:border-emerald-500/20' },
                                        { text: 'Integrated docs, wikis & knowledge base', icon: FileText, gradient: 'from-slate-100 to-blue-100 dark:from-slate-600/20 dark:to-blue-600/20', border: 'border-slate-200 dark:border-blue-500/20' },
                                    ].map((item, i) => (
                                        <div key={i} className={`p-4 bg-gradient-to-r ${item.gradient} rounded-xl border ${item.border} flex items-center gap-4 animate-pop-in hover:scale-[1.02] transition-transform`} style={{ animationDelay: `${i * 0.1}s` }}>
                                            <div className="w-9 h-9 rounded-lg bg-white/50 dark:bg-white/10 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                                                <item.icon className="w-4.5 h-4.5" />
                                            </div>
                                            <span className="font-semibold text-slate-800 dark:text-white text-sm">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Impact Metrics Banner */}
                    <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { value: '4+', unit: 'hrs/day', label: 'saved per team member' },
                            { value: '60', unit: '%', label: 'fewer missed items' },
                            { value: '10', unit: 'x', label: 'faster team onboarding' },
                        ].map((metric, i) => (
                            <div key={i} className="text-center p-6 bg-slate-100/50 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-500/20 transition-colors">
                                <div className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-1">
                                    {metric.value}<span className="text-blue-600 dark:text-blue-400">{metric.unit}</span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{metric.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security Section */}
            <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 relative transition-colors section-perf-optimized">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div ref={securityReveal.ref} className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${securityReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Shield className="w-4 h-4" />
                            <span>Enterprise Trust</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-5 sm:mb-6 tracking-tighter leading-[1.1] transition-colors">
                            Security at the core.
                        </h2>
                        <p className="text-lg text-slate-500/90 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium transition-colors">
                            We prioritize the safety of your data with bank-grade encryption and strict compliance standards.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* SOC 2 */}
                        <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-8 border border-gray-100 dark:border-slate-800 hover:shadow-lg dark:hover:shadow-none transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-tight">SOC 2 Type II Compliant</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Independently audited to ensure your data is managed with the highest standard of security and privacy.
                            </p>
                        </div>

                        {/* Encryption */}
                        <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-8 border border-gray-100 dark:border-slate-800 hover:shadow-lg dark:hover:shadow-none transition-all">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-tight">End-to-End Encryption</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Your data is encrypted at rest and in transit using AES-256 using industry-standard keys.
                            </p>
                        </div>

                        {/* Uptime */}
                        <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-8 border border-gray-100 dark:border-slate-800 hover:shadow-lg dark:hover:shadow-none transition-all">
                            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-tight">99.99% Uptime SLA</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Redundant infrastructure across multiple regions ensures your workspace is always available.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final Premium CTA */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="relative group overflow-hidden rounded-[3rem] border border-white/20 shadow-2xl">
                        <div className="absolute inset-0 mesh-gradient opacity-90"></div>
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xl"></div>
                        
                        {/* Animated Orbs */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[60px] md:blur-[120px] -mr-40 -mt-40 animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[60px] md:blur-[120px] -ml-40 -mb-40 animate-pulse" style={{ animationDelay: '2s' }}></div>

                        <div className="relative z-10 py-20 md:py-28 px-8 md:px-16 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-10 backdrop-blur-md">
                                <Rocket size={16} className="text-amber-400" />
                                <span>Ready to 10x your productivity?</span>
                            </div>
                            
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tighter leading-tight">
                                Join the future of <br className="hidden md:block" /> 
                                <span className="bg-gradient-to-r from-blue-300 to-cyan-400 bg-clip-text text-transparent italic">intelligent work.</span>
                            </h2>
                            
                            <p className="text-xl text-slate-200 max-w-2xl mx-auto mb-12 font-medium leading-relaxed opacity-90">
                                Experience the only unified command center that thinks, automates, and executes alongside you.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-50 px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:shadow-[0_20px_80px_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-95"
                                >
                                    Get Started Free
                                </Link>
                                <button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/30 px-10 py-5 rounded-2xl font-bold text-lg transition-all backdrop-blur-xl hover:scale-[1.02] active:scale-95 flex items-center gap-3">
                                    Book Demo <ArrowRight size={20} />
                                </button>
                            </div>

                            <div className="mt-12 flex flex-wrap justify-center gap-8 text-slate-300">
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <CheckCircle2 size={16} className="text-emerald-400" /> No credit card
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <CheckCircle2 size={16} className="text-emerald-400" /> 14-day trial
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <CheckCircle2 size={16} className="text-emerald-400" /> Cancel anytime
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
