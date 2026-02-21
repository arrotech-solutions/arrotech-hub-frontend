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
    Activity
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';
import demoVideo from '../assets/videos/Unified_Workspace.mp4';

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
    const [activeTab, setActiveTab] = useState('engineering');
    const [heroTextIndex, setHeroTextIndex] = useState(0);

    // Live Activity Simulation State
    const [activities, setActivities] = useState([
        { id: 1, type: 'slack', user: 'Sarah K.', action: 'mentioned you in #design', time: 'Just now', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-100' },
        { id: 2, type: 'jira', user: 'System', action: 'Ticket EXP-1024 updated', time: '2m ago', icon: GitBranch, color: 'text-orange-500', bg: 'bg-orange-100' },
        { id: 3, type: 'gmail', user: 'Client A', action: 'New proposal request', time: '15m ago', icon: Mail, color: 'text-red-500', bg: 'bg-red-100' },
    ]);

    const heroWords = ["Marketing", "Sales", "Support", "Engineering", "HR"];

    useEffect(() => {
        const interval = setInterval(() => {
            setHeroTextIndex((prev) => (prev + 1) % heroWords.length);
        }, 2000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [heroWords.length]);

    // Simulate incoming activity
    useEffect(() => {
        const newActivities = [
            { type: 'github', user: 'Alex D.', action: 'pushed to main', time: 'Just now', icon: Code2, color: 'text-slate-800', bg: 'bg-slate-200' },
            { type: 'calendar', user: 'Team', action: 'Standup in 10m', time: 'Just now', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-100' },
            { type: 'hubspot', user: 'Lead', action: 'viewed pricing page', time: 'Just now', icon: TrendingUp, color: 'text-teal-500', bg: 'bg-teal-100' },
        ];

        const interval = setInterval(() => {
            const randomActivity = newActivities[Math.floor(Math.random() * newActivities.length)];
            setActivities(prev => [
                { ...randomActivity, id: Date.now() },
                ...prev.slice(0, 3) // Keep only recent 4
            ]);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    // Scroll Reveal System
    const useScrollReveal = () => {
        const ref = useRef<HTMLDivElement>(null);
        const [isVisible, setIsVisible] = useState(false);

        useEffect(() => {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(entry.target);
                    }
                },
                { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
            );
            if (ref.current) observer.observe(ref.current);
            return () => observer.disconnect();
        }, []);

        return { ref, isVisible };
    };

    // Animated Counter
    const useCounter = (end: number, isVisible: boolean, duration = 2000) => {
        const [count, setCount] = useState(0);
        useEffect(() => {
            if (!isVisible) return;
            let start = 0;
            const step = end / (duration / 16);
            const timer = setInterval(() => {
                start += step;
                if (start >= end) {
                    setCount(end);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(start));
                }
            }, 16);
            return () => clearInterval(timer);
        }, [isVisible, end, duration]);
        return count;
    };

    // Create reveal refs for each section
    const heroReveal = useScrollReveal();
    const bentoReveal = useScrollReveal();
    const aiReveal = useScrollReveal();
    const teamsReveal = useScrollReveal();
    const creatorReveal = useScrollReveal();
    const chaosReveal = useScrollReveal();
    const securityReveal = useScrollReveal();
    const ctaReveal = useScrollReveal();

    // Social proof counters
    const statsVisible = heroReveal.isVisible;
    const teamCount = useCounter(10000, statsVisible);
    const integrationCount = useCounter(50, statsVisible);
    const uptimeCount = useCounter(99, statsVisible);


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
        <div className="text-slate-900 overflow-x-hidden">
            <SEO
                title="Unified Inbox & Workspace Platform"
                description="Manage emails, messages, and workflows in one unified workspace. Connect Slack, Gmail, M-Pesa, and 50+ apps with AI-powered automation. Built for modern teams."
                url="/"
            />

            {/* Hero Section */}
            <section className="relative z-10 pt-2 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center overflow-hidden">

                {/* Animated floating orbs — subtle to avoid navbar clash */}
                <div className="absolute top-[15%] left-[15%] w-72 h-72 bg-purple-400/10 rounded-full blur-[120px] animate-float pointer-events-none"></div>
                <div className="absolute top-[25%] right-[10%] w-64 h-64 bg-blue-400/8 rounded-full blur-[100px] animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-[20%] left-[40%] w-56 h-56 bg-cyan-400/6 rounded-full blur-[90px] animate-float pointer-events-none" style={{ animationDelay: '4s' }}></div>
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.02)_1px,_transparent_0)] bg-[size:32px_32px] pointer-events-none"></div>

                <div ref={heroReveal.ref} className={`max-w-6xl mx-auto text-center relative z-20 transition-all duration-700 ${heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

                    {/* Main Headline */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 sm:mb-8 leading-[1.15] tracking-tight">
                        <span className="block text-slate-900">Automate your</span>
                        <div className="h-[1.15em] overflow-hidden relative">
                            <span
                                className="block bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient-shift transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateY(-${heroTextIndex * 1.15}em)` }}
                            >
                                {heroWords.map((word) => (
                                    <span key={word} className="block h-[1.15em]"> {word}</span>
                                ))}
                            </span>
                        </div>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium">
                        Stop switching apps. The intelligent workspace that unifies your <br className="hidden sm:block" />tools, tasks, and teams in one place.
                    </p>


                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                        {user ? (
                            <Link
                                to="/unified"
                                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/20 hover:scale-[1.02]"
                            >
                                Open Dashboard
                                <LayoutDashboard className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <Link
                                to="/register"
                                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02]"
                            >
                                Get Started Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                        <button
                            onClick={() => {
                                document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-slate-700 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]"
                        >
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <Play className="w-4 h-4 text-purple-600 fill-current ml-0.5" />
                            </div>
                            See how it works
                        </button>
                    </div>

                    {/* Social Proof Stats */}
                    <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-5 md:gap-8">
                        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-gray-100 rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <div className="text-xl font-extrabold text-slate-900 leading-tight">{teamCount.toLocaleString()}+</div>
                                <div className="text-xs text-slate-500 font-medium">Teams worldwide</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-gray-100 rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <div className="text-xl font-extrabold text-slate-900 leading-tight">{integrationCount}+</div>
                                <div className="text-xs text-slate-500 font-medium">Integrations</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-gray-100 rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <div className="text-xl font-extrabold text-slate-900 leading-tight">{uptimeCount}.9%</div>
                                <div className="text-xs text-slate-500 font-medium">Uptime SLA</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Video Demo Section */}
            <section id="demo-video" className="pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 bg-transparent relative z-20 w-full overflow-hidden -mt-4 sm:-mt-8 md:-mt-12">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[300px] bg-gradient-to-b from-purple-500/10 to-transparent blur-3xl pointer-events-none"></div>

                <div className="max-w-6xl mx-auto relative">
                    {/* Video Container */}
                    <div className="relative group rounded-[2rem] sm:rounded-[3rem] p-2 sm:p-4 bg-white/50 backdrop-blur-3xl border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_30px_80px_-20px_rgba(100,50,255,0.2)] transition-shadow duration-700">
                        {/* Inner Video Wrapper */}
                        <div className="relative rounded-2xl sm:rounded-[2rem] overflow-hidden bg-slate-900 aspect-video shadow-2xl ring-1 ring-slate-900/10 group-hover:ring-purple-500/30 transition-all duration-700 w-full transform group-hover:-translate-y-1">
                            {/* Subtle Inner Glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10"></div>

                            <video
                                className="absolute top-0 left-0 w-full h-full relative z-0 animate-fade-in object-cover"
                                src={demoVideo}
                                controls
                                autoPlay
                                muted
                                loop
                                playsInline
                            ></video>
                        </div>
                    </div>
                </div>
            </section>

            {/* Scrolling Marquee */}
            <section className="py-8 border-y border-gray-100 bg-white/50 backdrop-blur-sm overflow-hidden">
                <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Trusted by modern teams</p>
                <div className="relative flex overflow-x-hidden group">
                    <div className="py-2 animate-marquee whitespace-nowrap flex items-center">
                        {[...integrations, ...integrations, ...integrations].map((integration, index) => (
                            <div key={`${integration.name}-${index}`} className="mx-8 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                                <img src={integration.logo} alt={integration.name} className="h-8 w-auto object-contain" />
                                <span className="text-lg font-bold text-slate-700 hidden sm:inline">{integration.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section id="features" className="relative z-10 py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
                <div ref={bentoReveal.ref} className={`max-w-7xl mx-auto transition-all duration-700 ${bentoReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center mb-10 md:mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider mb-6">
                            <Sparkles className="w-3.5 h-3.5" />
                            Core Platform
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 sm:mb-5 tracking-tight leading-[1.1]">
                            The OS for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">high-performance</span> teams.
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            Unified inbox, AI agents, workflow automation, and 50+ integrations — all in one intelligent workspace.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 sm:gap-6 h-auto md:h-[850px]">
                        {/* Large Main Card: Unified Dashboard */}
                        <div className="md:col-span-2 md:row-span-2 bg-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 flex flex-col overflow-hidden border border-gray-100 relative group hover:-translate-y-1">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-50 to-blue-50 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

                            <div className="relative z-10 mb-8">
                                <span className="inline-flex items-center justify-center p-4 bg-purple-100 rounded-2xl mb-6 text-purple-600 shadow-sm">
                                    <LayoutDashboard className="w-10 h-10" />
                                </span>
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 sm:mb-4 tracking-tight leading-tight">Unified & Synchronized</h3>
                                <p className="text-lg text-slate-500 max-w-md leading-relaxed">
                                    Your emails, assignments, and calendar events in one intelligent stream.
                                </p>
                            </div>

                            {/* Live Data Dashboard Mockup */}
                            <div className="flex-1 bg-slate-50 border border-gray-200 rounded-t-3xl shadow-sm relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                                <div className="absolute top-4 left-4 right-4 bottom-0 bg-white rounded-t-2xl shadow-lg border border-gray-200 p-6 flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">JD</div>
                                            <div>
                                                <div className="text-base font-bold text-slate-900">John Doe</div>
                                                <div className="text-xs text-green-600 flex items-center gap-1 font-medium">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                                    Online
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600">Inbox (4)</div>
                                            <div className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Tasks (12)</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1 overflow-visible">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Activity</div>
                                        {activities.map((activity) => (
                                            <div key={activity.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-slide-in-right hover:bg-white hover:shadow-md transition-all cursor-pointer group/item">
                                                <div className={`w-10 h-10 rounded-xl ${activity.bg} flex items-center justify-center ${activity.color} shadow-sm`}>
                                                    <activity.icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="text-base font-bold text-slate-900">{activity.user}</p>
                                                        <span className="text-[11px] font-medium text-slate-400">{activity.time}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 truncate font-medium">{activity.action}</p>
                                                </div>
                                                <button className="opacity-0 group-hover/item:opacity-100 p-2 hover:bg-slate-200 rounded-full transition-all">
                                                    <ArrowRight className="w-4 h-4 text-slate-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Right Card: AI Agents */}
                        <div className="md:col-span-2 bg-slate-900 text-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-xl overflow-hidden relative group hover:-translate-y-1 transition-all duration-500">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/30 rounded-full blur-[60px] pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/20 rounded-full blur-[50px] pointer-events-none"></div>

                            <div className="relative z-10 h-full flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3 tracking-tight">
                                            <Bot className="w-8 h-8 text-purple-400" />
                                            AI Agents
                                        </h3>
                                        <p className="text-slate-400 text-sm sm:text-base">Autonomous agents that handle support, sales, and ops 24/7.</p>
                                    </div>
                                    <div className="flex -space-x-2">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold shadow-lg" title="Sales Agent">SA</div>
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold shadow-lg" title="Support Agent">CS</div>
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold shadow-lg" title="DevOps Agent">DO</div>
                                    </div>
                                </div>

                                {/* Simulated Chat Interface */}
                                <div className="flex-1 bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50 space-y-4 shadow-inner backdrop-blur-sm">
                                    <div className="flex justify-end">
                                        <div className="bg-purple-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm font-medium max-w-[85%] shadow-lg">
                                            Book a meeting with sales for top leads.
                                        </div>
                                    </div>
                                    <div className="flex justify-start items-end gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg flex-shrink-0"><Bot className="w-3.5 h-3.5 text-white" /></div>
                                        <div className="bg-slate-700 text-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm font-medium shadow-md">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                                Scanning CRM... Found <span className="text-green-400 font-bold">3 hot leads</span>.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-start items-end gap-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg flex-shrink-0"><Bot className="w-3.5 h-3.5 text-white" /></div>
                                        <div className="bg-slate-700 text-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm font-medium shadow-md">
                                            Sending calendar invites... <span className="text-green-400 font-bold">Done! ✓</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Middle Card: Automation */}
                        <div className="md:col-span-1 bg-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group overflow-hidden min-h-[280px] sm:min-h-[320px] relative">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5 text-blue-600 group-hover:rotate-12 transition-transform shadow-sm">
                                <Zap className="w-7 h-7" />
                            </div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Automation</h3>
                                <p className="text-slate-500 text-sm font-medium">Visual workflow builder with drag-and-drop.</p>
                            </div>
                            {/* 3-Step Pipeline Visual */}
                            <div className="flex items-center gap-1 mt-auto">
                                <div className="flex flex-col items-center gap-1 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">Trigger</span>
                                </div>
                                <div className="flex-1 h-0.5 bg-gray-200 rounded-full overflow-hidden -mt-3">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 delay-100"></div>
                                </div>
                                <div className="flex flex-col items-center gap-1 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform delay-200">
                                        <Cpu className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">Process</span>
                                </div>
                                <div className="flex-1 h-0.5 bg-gray-200 rounded-full overflow-hidden -mt-3">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-green-500 w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 delay-400"></div>
                                </div>
                                <div className="flex flex-col items-center gap-1 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform delay-300">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">Deliver</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Right Card: Connect */}
                        <div className="md:col-span-1 bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-pink-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group min-h-[280px] sm:min-h-[320px] relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-orange-100/50 via-transparent to-transparent rounded-[2.5rem] pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-5 text-pink-600 group-hover:scale-110 transition-transform shadow-sm">
                                    <GitBranch className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Connect</h3>
                                <p className="text-slate-500 text-sm font-medium mb-6">Integrate with 50+ apps your team already uses.</p>
                            </div>
                            <div className="flex -space-x-2 mt-auto relative z-10">
                                {[slackLogo, gmailLogo, notionLogo, asanaLogo].map((logo, i) => (
                                    <img key={i} src={logo} alt="app" className="w-11 h-11 rounded-full border-3 border-white bg-white object-contain shadow-md transition-all duration-300 hover:scale-125 hover:z-10 hover:-translate-y-1" style={{ animationDelay: `${i * 0.1}s` }} />
                                ))}
                                <div className="w-11 h-11 rounded-full bg-white border-3 border-white flex items-center justify-center text-xs font-extrabold text-slate-500 shadow-md hover:scale-125 hover:-translate-y-1 transition-all duration-300 cursor-pointer">+47</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Powerhouse Section */}
            <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950"></div>

                <div ref={aiReveal.ref} className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${aiReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center mb-10 md:mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Cpu className="w-4 h-4" />
                            <span>Total Control</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-5 sm:mb-6 tracking-tight leading-[1.1]">
                            The AI Powerhouse.
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
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
                                <p className="text-blue-400">&gt;&gt;&gt; Loading model...</p>
                                <p className="text-gray-500">Subject: Project Alpha</p>
                                <p className="text-gray-500">Context: 4096 tokens</p>
                                <p className="text-gray-500">Privacy: Offline (0 data sent)</p>
                                <br />
                                <p className="typing-effect border-r-2 border-gray-500 inline-block pr-1">Analyzed 15 local documents. Found 3 key insights...</p>
                                <span className="animate-pulse ml-1 inline-block w-2 h-4 bg-green-500 align-middle"></span>
                            </div>
                        </div>

                        {/* Right: Cloud Intelligence (Glass Style) */}
                        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-1 px-1 backdrop-blur-xl border border-white/10 relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-20 animate-pulse"></div>
                            <div className="bg-slate-900/90 rounded-[1.4rem] p-8 h-full relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Cloud Models</h3>
                                            <p className="text-slate-500 text-sm">Top-tier reasoning</p>
                                        </div>
                                    </div>
                                    <div className="flex -space-x-2">
                                        {/* Fake Logos for GPT, Claude, Gemini */}
                                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-[10px] font-bold">GPT</div>
                                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold">CLD</div>
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">GEM</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-purple-400 uppercase">Input</span>
                                            <span className="text-xs text-slate-500">GPT-4 Turbo</span>
                                        </div>
                                        <p className="text-slate-300 text-sm">"Draft a legal contract for a freelance designer based on California law..."</p>
                                    </div>
                                    <div className="bg-indigo-600/20 rounded-lg p-4 border border-indigo-500/20">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-indigo-400 uppercase">Response</span>
                                            <span className="text-xs text-indigo-300">1.2s latency</span>
                                        </div>
                                        <p className="text-indigo-200 text-sm">Here is a draft contract compliant with AB5...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* "Built for Teams" Tabs Section (Monday.com style) */}
            <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div ref={teamsReveal.ref} className={`max-w-7xl mx-auto transition-all duration-700 ${teamsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 sm:mb-5 tracking-tight leading-[1.1]">
                            Built for every team
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            From engineering sprints to marketing launches — one platform that adapts to how your team actually works.
                        </p>

                        {/* Tabs Navigation */}
                        <div className="flex flex-wrap justify-center gap-2 mt-10">
                            {[
                                { id: 'engineering', label: 'Engineering', icon: Code2, color: 'from-purple-600 to-indigo-600', ring: 'ring-purple-500/30' },
                                { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'from-pink-500 to-rose-500', ring: 'ring-pink-500/30' },
                                { id: 'sales', label: 'Sales', icon: Briefcase, color: 'from-blue-500 to-cyan-500', ring: 'ring-blue-500/30' },
                                { id: 'support', label: 'Support', icon: Headphones, color: 'from-green-500 to-emerald-500', ring: 'ring-green-500/30' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === tab.id
                                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-black/10 scale-105 ring-4 ${tab.ring}`
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-[1.02]'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content Area */}
                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-14 border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-[100px] opacity-70 pointer-events-none"></div>

                        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                            <div>
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 sm:mb-6 tracking-tight leading-tight">
                                    {activeTab === 'engineering' && "Ship faster with automated workflows."}
                                    {activeTab === 'marketing' && "Launch campaigns in record time."}
                                    {activeTab === 'sales' && "Close deals without the busywork."}
                                    {activeTab === 'support' && "Delight customers with instant answers."}
                                </h3>
                                <p className="text-base text-slate-500 mb-8 leading-relaxed">
                                    {activeTab === 'engineering' && "Connect Jira, GitHub, and Slack. Automatically create tickets from bug reports and sync status updates tailored for developers."}
                                    {activeTab === 'marketing' && "Sync leads from Facebook Ads to HubSpot. Auto-generate social posts with AI and approve them in one click."}
                                    {activeTab === 'sales' && "Enrich leads automatically. Schedule meetings and follow up with prospects without leaving your dashboard."}
                                    {activeTab === 'support' && "Unified inbox for email, chat, and social. AI agents resolve 60% of tickets instantly, routing complex issues to your team."}
                                </p>
                                <ul className="space-y-4 mb-8">
                                    {(() => {
                                        const features: Record<string, string[]> = {
                                            engineering: ["Git integration & PR tracking", "Automated QA pipelines", "Sprint sync across tools"],
                                            marketing: ["Campaign automation", "Social listening & scheduling", "Asset management & approvals"],
                                            sales: ["Intelligent lead scoring", "Auto-scheduling & follow-ups", "CRM sync & enrichment"],
                                            support: ["Omnichannel inbox", "SLA monitoring & alerts", "AI auto-responses"],
                                        };
                                        return (features[activeTab] || []).map((feature, i) => (
                                            <li key={`${activeTab}-${i}`} className="flex items-center gap-3 text-slate-700 font-medium animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                                    <CheckCircle className="w-4 h-4" />
                                                </div>
                                                {feature}
                                            </li>
                                        ));
                                    })()}
                                </ul>
                                <Link to="/register" className="inline-flex items-center gap-2 text-purple-600 font-bold hover:text-purple-700 transition-colors group">
                                    Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            {/* Rich Dashboard Mockup */}
                            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden relative">
                                {/* Window Chrome */}
                                <div className="bg-slate-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    <span className="ml-3 text-xs text-slate-400 font-medium">Arrotech Hub — {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                                </div>

                                <div className="p-6 min-h-[320px]">
                                    {activeTab === 'engineering' && (
                                        <div className="space-y-3 animate-fade-in-up">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-bold text-slate-800">Sprint Board</span>
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">Sprint 24</span>
                                            </div>
                                            {[
                                                { title: 'Fix auth middleware', status: 'In Review', color: 'bg-yellow-100 text-yellow-700', pr: 'PR #342' },
                                                { title: 'Deploy v2.4 to staging', status: 'Deployed', color: 'bg-green-100 text-green-700', pr: 'PR #340' },
                                                { title: 'API rate limiter', status: 'In Progress', color: 'bg-blue-100 text-blue-700', pr: 'PR #345' },
                                                { title: 'Database migration', status: 'Queued', color: 'bg-slate-100 text-slate-600', pr: 'PR #347' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-gray-100 hover:bg-slate-100 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                        <span className="text-sm font-medium text-slate-800">{item.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-400 font-mono">{item.pr}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.color}`}>{item.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'marketing' && (
                                        <div className="space-y-3 animate-fade-in-up">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-bold text-slate-800">Campaign Dashboard</span>
                                                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-bold">Q1 2026</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
                                                    <p className="text-xs text-pink-600 font-bold">Total Reach</p>
                                                    <p className="text-2xl font-extrabold text-slate-900">2.4M</p>
                                                    <p className="text-xs text-green-600 font-bold">+18%</p>
                                                </div>
                                                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                                                    <p className="text-xs text-purple-600 font-bold">Conversions</p>
                                                    <p className="text-2xl font-extrabold text-slate-900">12.8K</p>
                                                    <p className="text-xs text-green-600 font-bold">+24%</p>
                                                </div>
                                            </div>
                                            {['Email Drip — Product Launch', 'Instagram Reels — Brand', 'LinkedIn Ads — B2B'].map((campaign, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-gray-100 animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                                                    <span className="text-sm font-medium text-slate-800">{campaign}</span>
                                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full" style={{ width: `${[85, 62, 45][i]}%` }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'sales' && (
                                        <div className="space-y-3 animate-fade-in-up">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-bold text-slate-800">Deal Pipeline</span>
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">$284K ARR</span>
                                            </div>
                                            {[
                                                { name: 'Acme Corp', stage: 'Negotiation', value: '$48K', avatar: 'AC', hot: true },
                                                { name: 'TechFlow Inc', stage: 'Demo Scheduled', value: '$32K', avatar: 'TF', hot: true },
                                                { name: 'DataBridge', stage: 'Proposal Sent', value: '$65K', avatar: 'DB', hot: false },
                                                { name: 'CloudSync Ltd', stage: 'Qualifying', value: '$22K', avatar: 'CS', hot: false },
                                            ].map((deal, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-gray-100 hover:bg-slate-100 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-[10px] font-bold">{deal.avatar}</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{deal.name}</p>
                                                            <p className="text-xs text-slate-400">{deal.stage}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {deal.hot && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">HOT</span>}
                                                        <span className="text-sm font-bold text-slate-900">{deal.value}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'support' && (
                                        <div className="space-y-3 animate-fade-in-up">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-bold text-slate-800">Ticket Queue</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                    <span className="text-xs text-green-600 font-bold">AI Active</span>
                                                </div>
                                            </div>
                                            {[
                                                { subject: 'Login issues on mobile', from: 'user@client.com', urgency: 'High', channel: 'Email', aiResolved: false },
                                                { subject: 'How to export reports?', from: '@james_k', urgency: 'Low', channel: 'Chat', aiResolved: true },
                                                { subject: 'Billing discrepancy', from: 'finance@acme.co', urgency: 'Med', channel: 'Email', aiResolved: false },
                                                { subject: 'API rate limit question', from: '@dev_sarah', urgency: 'Low', channel: 'Slack', aiResolved: true },
                                            ].map((ticket, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-gray-100 hover:bg-slate-100 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ticket.urgency === 'High' ? 'bg-red-500' : ticket.urgency === 'Med' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-slate-800 truncate">{ticket.subject}</p>
                                                            <p className="text-xs text-slate-400 truncate">{ticket.from} via {ticket.channel}</p>
                                                        </div>
                                                    </div>
                                                    {ticket.aiResolved && (
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold whitespace-nowrap ml-2 flex items-center gap-1">
                                                            <Bot className="w-3 h-3" /> Resolved
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Creator Economy Section */}
            <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
                <div ref={creatorReveal.ref} className={`max-w-7xl mx-auto transition-all duration-700 ${creatorReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1">
                            {/* Visual for Creator Economy */}
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-[2rem] opacity-30 blur-xl"></div>
                                <div className="relative bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100">
                                    {/* Earnings Card */}
                                    <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6 shadow-lg transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
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

                                    {/* Recent Transactions */}
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent</p>
                                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                    <Lock className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">Premium Template</p>
                                                    <p className="text-xs text-slate-500">Unlocked by @alex_d</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-slate-900">+$49.00</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">Tip Received</p>
                                                    <p className="text-xs text-slate-500">From happy client</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-slate-900">+$15.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-xs font-bold uppercase tracking-wider mb-6">
                                <DollarSign className="w-4 h-4" />
                                <span>Monetization</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 sm:mb-6 tracking-tight leading-[1.1]">
                                The Creator Economy OS.
                            </h2>
                            <p className="text-base sm:text-lg text-slate-500 mb-6 sm:mb-8 leading-relaxed">
                                Don't just work—get paid. Arrotech comes with built-in tools to monetize your expertise. Send invoices, receive tips, and sell premium digital assets directly from your dashboard.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-700 font-medium">Integrated Invoicing & Payments</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-700 font-medium">Sell Digital Products & Templates</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-700 font-medium">Accept Tips & Donations</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* "Chaos vs Order" Comparison (ClickUp style) */}
            <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900"></div>
                {/* Floating ambient orbs */}
                <div className="absolute top-20 left-[10%] w-72 h-72 bg-red-500/10 rounded-full blur-[100px] animate-float pointer-events-none"></div>
                <div className="absolute bottom-20 right-[10%] w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] animate-float pointer-events-none" style={{ animationDelay: '3s' }}></div>

                <div ref={chaosReveal.ref} className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${chaosReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Activity className="w-3.5 h-3.5" />
                            Before &amp; After
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-5 tracking-tight leading-[1.1]">
                            Stop the chaos. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Start flowing.</span>
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Your team juggles 10+ tools daily. We consolidate them into one intelligent platform — so you can focus on what matters.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 md:gap-0 relative">
                        {/* Center VS Divider (desktop only) */}
                        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-2xl">
                                <span className="text-sm font-extrabold text-slate-300">VS</span>
                            </div>
                        </div>

                        {/* Before Side */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-3xl md:rounded-r-none p-8 md:p-10 relative group">
                            <div className="flex items-center gap-3 mb-8">
                                <span className="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-full text-xs font-bold border border-red-500/20 flex items-center gap-1.5">
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
                                    <div key={i} className="p-4 bg-white/[0.03] rounded-xl border border-dashed border-white/10 flex items-center gap-4 group/item hover:bg-red-500/5 hover:border-red-500/20 transition-all duration-300 cursor-default">
                                        <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0">
                                            <item.icon className="w-4.5 h-4.5" />
                                        </div>
                                        <span className="text-slate-400 font-medium text-sm group-hover/item:line-through group-hover/item:text-red-400/60 transition-all">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* After Side */}
                        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-3xl md:rounded-l-none p-8 md:p-10 relative shadow-2xl ring-1 ring-purple-500/20">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-3xl md:rounded-l-none pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="px-3 py-1.5 bg-green-500/15 text-green-400 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> WITH ARROTECH
                                    </span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-green-500/20 to-transparent"></div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {[
                                        { text: 'One unified dashboard for everything', icon: LayoutDashboard, gradient: 'from-purple-600/20 to-indigo-600/20', border: 'border-purple-500/20' },
                                        { text: 'AI-prioritized inbox, zero clutter', icon: Mail, gradient: 'from-blue-600/20 to-cyan-600/20', border: 'border-blue-500/20' },
                                        { text: 'Automated workflows save 4+ hrs/day', icon: Zap, gradient: 'from-amber-600/20 to-orange-600/20', border: 'border-amber-500/20' },
                                        { text: 'Smart scheduling across all calendars', icon: Calendar, gradient: 'from-green-600/20 to-emerald-600/20', border: 'border-green-500/20' },
                                        { text: 'Integrated docs, wikis & knowledge base', icon: FileText, gradient: 'from-pink-600/20 to-rose-600/20', border: 'border-pink-500/20' },
                                    ].map((item, i) => (
                                        <div key={i} className={`p-4 bg-gradient-to-r ${item.gradient} rounded-xl border ${item.border} flex items-center gap-4 animate-pop-in hover:scale-[1.02] transition-transform`} style={{ animationDelay: `${i * 0.1}s` }}>
                                            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-green-400 flex-shrink-0">
                                                <item.icon className="w-4.5 h-4.5" />
                                            </div>
                                            <span className="font-semibold text-white text-sm">{item.text}</span>
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
                            <div key={i} className="text-center p-6 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-purple-500/20 transition-colors">
                                <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                                    {metric.value}<span className="text-purple-400">{metric.unit}</span>
                                </div>
                                <p className="text-sm text-slate-400 font-medium">{metric.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security Section */}
            <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-100 relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div ref={securityReveal.ref} className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${securityReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
                            <Shield className="w-4 h-4" />
                            <span>Enterprise Trust</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 sm:mb-6 tracking-tight leading-[1.1]">
                            Security at the core.
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            We prioritize the safety of your data with bank-grade encryption and strict compliance standards.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* SOC 2 */}
                        <div className="bg-slate-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3 tracking-tight">SOC 2 Type II Compliant</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Independently audited to ensure your data is managed with the highest standard of security and privacy.
                            </p>
                        </div>

                        {/* Encryption */}
                        <div className="bg-slate-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3 tracking-tight">End-to-End Encryption</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Your data is encrypted at rest and in transit using AES-256 using industry-standard keys.
                            </p>
                        </div>

                        {/* Uptime */}
                        <div className="bg-slate-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 mb-6">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3 tracking-tight">99.99% Uptime SLA</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Redundant infrastructure across multiple regions ensures your workspace is always available.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative z-10 py-14 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
                <div ref={ctaReveal.ref} className={`max-w-5xl mx-auto transition-all duration-700 ${ctaReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="bg-slate-900 rounded-2xl sm:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                        {/* Decorative Background */}
                        <div className="absolute inset-0">
                            <div className="absolute top-[-50%] left-[20%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] animate-float"></div>
                            <div className="absolute bottom-[-50%] right-[20%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] animate-float" style={{ animationDelay: '3s' }}></div>
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 sm:mb-8 tracking-tight leading-[1.1]">
                                Ready for the <span className="text-purple-400">future of work?</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                                Join thousands of teams using Arrotech to boost productivity and reclaim their time.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto bg-white text-slate-900 hover:bg-gray-100 px-6 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base transition-all transform hover:scale-[1.02] shadow-xl hover:shadow-2xl"
                                >
                                    Get Started Free
                                </Link>
                                <button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base transition-all backdrop-blur-md hover:scale-[1.02] hover:border-white/40">
                                    Contact Sales
                                </button>
                            </div>

                            <p className="mt-8 text-slate-400 text-sm">
                                No credit card required • 14-day free trial
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
