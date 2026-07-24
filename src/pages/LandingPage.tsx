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
import AutonomousAgentsShowcase from '../components/AutonomousAgentsShowcase';
import VisualWorkflowShowcase from '../components/VisualWorkflowShowcase';

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
        <div className="min-h-screen bg-white dark:bg-secondary-950 transition-colors duration-500 overflow-x-hidden">
            <SEO
                title="Arrotech Hub | The Intelligent Command Center for Modern Teams"
                description="Unify your tools, tasks, and teams in one intelligent platform. Arrotech Hub uses autonomous agents and seamless integrations to 10x your team's productivity."
            />

            {/* Premium Hero Section */}
            <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Dynamic Mesh Gradient Background */}
                <div className="absolute inset-0 mesh-gradient-subtle opacity-50 dark:opacity-30 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent dark:from-blue-900/20 pointer-events-none"></div>

                {/* Floating Elements for Premium Feel */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Side: Content */}
                        <div className="text-left">                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tighter leading-tight animate-slide-up transition-colors">
                            The workspace that <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500 dark:from-primary-400 dark:to-accent-400">executes the work.</span>
                        </h1>
                            <div className="space-y-5 mb-8 animate-slide-up-delayed">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-secondary-800 flex items-center justify-center text-[10px] font-bold text-slate-400">1</div>
                                    <p className="text-base text-slate-600 dark:text-slate-400 leading-snug">
                                        <span className="font-bold text-slate-900 dark:text-white">Unify context.</span> Chat, Tasks, Data, and 50+ Apps in one place.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-secondary-800 flex items-center justify-center text-[10px] font-bold text-slate-400">2</div>
                                    <p className="text-base text-slate-600 dark:text-slate-400 leading-snug">
                                        <span className="font-bold text-slate-900 dark:text-white">Deploy intelligence.</span> AI Agents that think, reason, and act autonomously.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-secondary-800 flex items-center justify-center text-[10px] font-bold text-slate-400">3</div>
                                    <p className="text-base text-slate-600 dark:text-slate-400 leading-snug">
                                        <span className="font-bold text-slate-900 dark:text-white">Run on autopilot.</span> Create infinite Workflows with zero coding.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up-delayed-2">
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto bg-primary-500 dark:bg-primary-500 text-white hover:bg-slate-800 dark:hover:bg-slate-100 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Start Building for Free <ArrowRight size={20} />
                                </Link>
                                <Link
                                    to="/pricing"
                                    className="w-full sm:w-auto bg-white dark:bg-secondary-900 text-slate-900 dark:text-white border border-slate-200 dark:border-secondary-800 hover:border-slate-300 dark:hover:border-slate-700 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center"
                                >
                                    View Pricing
                                </Link>
                            </div>

                            {/* Social Proof Stats */}
                            <div className="mt-12 lg:mt-14 flex flex-wrap items-center justify-start gap-4 sm:gap-6 border-t border-slate-200 dark:border-secondary-800 pt-8 transition-colors">
                                <div className="flex flex-col items-start hidden sm:flex">
                                    <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Trusted by</div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Early-Stage Tech Teams</div>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-secondary-800 hidden sm:block"></div>
                                <div className="flex flex-col items-start">
                                    <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight">50+ Connectors</div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Ready on Day One</div>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-secondary-800 hidden sm:block"></div>
                                <div className="flex flex-col items-start">
                                    <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Zero Coding</div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Instant Agent Setup</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Area: AI Mockup */}
                        <div className="w-full h-full flex justify-center lg:justify-end items-center mt-12 lg:mt-0 relative perspective-2000">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/15 to-accent-500/20 dark:from-primary-900/30 dark:to-secondary-900/50 blur-[60px] md:blur-[120px] rounded-full pointer-events-none -mr-40"></div>
                            <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/10 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-2xl z-0 animate-float hidden xl:block"></div>
                            <div className="absolute -bottom-10 right-20 w-32 h-32 bg-primary-500/10 backdrop-blur-3xl rounded-[2rem] border border-blue-500/20 shadow-2xl z-0 animate-float-delayed hidden xl:block"></div>

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
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/5 dark:from-blue-900/20 via-transparent dark:via-transparent to-transparent pointer-events-none"></div>

                <div ref={aiReveal.ref} className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${aiReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center mb-10 md:mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-blue-500/20 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-6">
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
                            <div className="p-6 bg-white dark:bg-secondary-900/50 rounded-2xl border border-gray-100 dark:border-secondary-800 shadow-sm transition-all hover:shadow-md">
                                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Cloud Models</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Top-tier reasoning with GPT-4, Claude 3.5, and Gemini Pro.</p>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-secondary-800/50 rounded-2xl border border-gray-100 dark:border-secondary-800 shadow-sm flex flex-col items-center justify-center text-center opacity-50 grayscale">
                                <div className="flex gap-2 mb-3">
                                    <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700"></div>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Coming Soon</p>
                            </div>
                            <div className="col-span-2 p-6 bg-primary-500 dark:bg-primary-500 rounded-2xl text-white shadow-xl relative overflow-hidden group">
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

            {/* Autonomous Agents Showcase Section */}
            <AutonomousAgentsShowcase />

            {/* Visual Workflow Showcase */}
            <VisualWorkflowShowcase />

            {/* Creator Economy Section (Crazy Rewrite) */}
            <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50 dark:bg-secondary-950 transition-colors border-t border-slate-200 dark:border-secondary-800/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-500/10 dark:from-primary-900/20 via-transparent dark:via-secondary-950 to-transparent dark:to-secondary-950 pointer-events-none"></div>

                <div ref={creatorReveal.ref} className={`max-w-7xl mx-auto relative z-10 transition-all duration-1000 ${creatorReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 relative h-[500px]">
                            {/* Massive floating elements */}
                            <div className="absolute inset-0 z-0">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-primary-500/20 to-accent-400/20 rounded-full blur-[80px] animate-pulse"></div>
                            </div>

                            {/* Main Earnings Card - 3D Tilted */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white/80 dark:bg-secondary-950/80 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-[0_0_100px_rgba(255,70,150,0.18)] p-8 transform rotate-[-5deg] hover:rotate-0 hover:scale-105 transition-all duration-500 z-20">
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 dark:from-white/5 to-transparent rounded-3xl"></div>
                                <div className="relative">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Total Revenue</p>
                                            <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">$142,450</h3>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                    </div>
                                    
                                    {/* Chart bars simulation */}
                                    <div className="flex items-end gap-2 h-24 mb-6">
                                        {[40, 60, 45, 80, 55, 90, 100].map((h, i) => (
                                            <div key={i} className="flex-1 bg-gradient-to-t from-primary-500/40 dark:from-primary-500/20 to-primary-500 dark:to-primary-400/80 rounded-t-sm transition-all duration-1000" style={{ height: `${creatorReveal.isVisible ? h : 0}%`, transitionDelay: `${i * 100}ms` }}></div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>+324% MRR Growth</span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Transaction Card 1 */}
                            <div className="absolute top-10 right-0 w-64 bg-white/90 dark:bg-secondary-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xl dark:shadow-2xl transform rotate-[10deg] hover:rotate-0 translate-x-10 hover:translate-x-0 transition-all duration-500 z-30 delay-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-slate-900 dark:text-white font-bold text-sm">Enterprise Tier</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs">Yearly Subscription</p>
                                    </div>
                                    <div className="ml-auto text-primary-600 dark:text-primary-400 font-bold">+$12k</div>
                                </div>
                            </div>

                            {/* Floating Transaction Card 2 */}
                            <div className="absolute bottom-10 left-0 w-64 bg-white/90 dark:bg-secondary-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xl dark:shadow-2xl transform rotate-[-15deg] hover:rotate-0 -translate-x-10 hover:translate-x-0 transition-all duration-500 z-30 delay-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-slate-900 dark:text-white font-bold text-sm">Custom Agent</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs">Marketplace Sale</p>
                                    </div>
                                    <div className="ml-auto text-accent-600 dark:text-accent-400 font-bold">+$499</div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider mb-6">
                                <DollarSign className="w-4 h-4" />
                                <span>Monetization OS</span>
                            </div>
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[1.05]">
                                Don't just work. <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-700 dark:from-primary-400 dark:to-primary-300">Build an Empire.</span>
                            </h2>
                            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                                Arrotech isn't just a productivity tool. It's a complete monetization engine. Sell your custom AI agents, charge for premium workflows, and process payments instantly.
                            </p>

                            <ul className="space-y-6">
                                {[
                                    { title: "Sell Custom Agents", desc: "Build specialized agents and sell them on the Arrotech Marketplace." },
                                    { title: "Global Payments Integration", desc: "Accept payments in 135+ currencies with zero setup via Stripe." },
                                    { title: "Automated Invoicing", desc: "Let your AI generate and chase invoices while you sleep." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-secondary-800 border border-slate-200 dark:border-secondary-700 flex items-center justify-center flex-shrink-0 group-hover:border-emerald-500 group-hover:bg-emerald-500/10 transition-colors">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-900 dark:text-white font-bold text-lg mb-1">{item.title}</h4>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>


            {/* Security Section */}
            <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 relative transition-colors section-perf-optimized">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div ref={securityReveal.ref} className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${securityReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-6">
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
                        <div className="bg-white dark:bg-secondary-900/50 rounded-2xl p-8 border border-gray-100 dark:border-secondary-800 hover:shadow-lg dark:hover:shadow-none transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-tight">SOC 2 Type II Compliant</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Independently audited to ensure your data is managed with the highest standard of security and privacy.
                            </p>
                        </div>

                        {/* Encryption */}
                        <div className="bg-white dark:bg-secondary-900/50 rounded-2xl p-8 border border-gray-100 dark:border-secondary-800 hover:shadow-lg dark:hover:shadow-none transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-tight">End-to-End Encryption</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Your data is encrypted at rest and in transit using AES-256 using industry-standard keys.
                            </p>
                        </div>

                        {/* Uptime */}
                        <div className="bg-white dark:bg-secondary-900/50 rounded-2xl p-8 border border-gray-100 dark:border-secondary-800 hover:shadow-lg dark:hover:shadow-none transition-all">
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


            {/* Clean Premium CTA */}
            <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50 dark:bg-secondary-900/20 transition-colors border-t border-slate-200 dark:border-secondary-800/50">
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="bg-white dark:bg-secondary-900 border border-slate-200 dark:border-secondary-800 rounded-[2.5rem] shadow-xl overflow-hidden relative">
                        {/* Decorative Background Accents */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[80px]"></div>
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[80px]"></div>
                        
                        <div className="px-6 py-16 md:px-16 md:py-20 text-center relative z-10">
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                                Ready to work <span className="text-primary-600 dark:text-primary-500">smarter?</span>
                            </h2>
                            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Join thousands of modern teams unifying their tools, processes, and intelligence in one powerful platform.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto px-8 py-4 bg-primary-500 dark:bg-primary-500 text-white hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Get Started for Free <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link
                                    to="/contact"
                                    className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-slate-200 dark:border-secondary-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl font-bold text-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center"
                                >
                                    Talk to Sales
                                </Link>
                            </div>
                            
                            <div className="mt-10 pt-10 border-t border-slate-100 dark:border-secondary-800 flex flex-wrap justify-center gap-6 md:gap-12 text-sm font-medium text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>No credit card required</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>14-day free trial</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>Cancel anytime</span>
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
